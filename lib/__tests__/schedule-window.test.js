/**
 * Tests for the Scheduled Photos window rule (lib/schedule-window.js) and its
 * server copy (convex/scheduleWindow.ts). The two must agree exactly.
 */
const fs = require('fs');
const path = require('path');
const { isInScheduleWindow } = require('../schedule-window');

const SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6;
const at = (h, m) => h * 60 + m;
const sched = (days, sh, sm, eh, em) => ({ days, startHour: sh, startMinute: sm, endHour: eh, endMinute: em });

describe('same-day window (09:00 to 17:00, Tuesday)', () => {
  const s = sched([TUE], 9, 0, 17, 0);
  test('is outside just before the start', () => expect(isInScheduleWindow(s, TUE, at(8, 59))).toBe(false));
  test('is inside at the start minute', () => expect(isInScheduleWindow(s, TUE, at(9, 0))).toBe(true));
  test('is inside one minute before the end', () => expect(isInScheduleWindow(s, TUE, at(16, 59))).toBe(true));
  test('is outside at the end minute', () => expect(isInScheduleWindow(s, TUE, at(17, 0))).toBe(false));
  test('is outside on an unticked day', () => expect(isInScheduleWindow(s, WED, at(12, 0))).toBe(false));
});

describe('overnight window (22:00 to 06:00, ticked for Friday)', () => {
  const s = sched([FRI], 22, 0, 6, 0);
  test('is outside before the start on Friday', () => expect(isInScheduleWindow(s, FRI, at(21, 59))).toBe(false));
  test('is inside at the start on Friday', () => expect(isInScheduleWindow(s, FRI, at(22, 0))).toBe(true));
  test('is inside at 23:59 on Friday', () => expect(isInScheduleWindow(s, FRI, at(23, 59))).toBe(true));
  test('is inside at midnight, now Saturday', () => expect(isInScheduleWindow(s, SAT, at(0, 0))).toBe(true));
  test('is inside at 05:59 on Saturday', () => expect(isInScheduleWindow(s, SAT, at(5, 59))).toBe(true));
  test('is outside at the end minute on Saturday', () => expect(isInScheduleWindow(s, SAT, at(6, 0))).toBe(false));
  test('is outside on Saturday evening (Saturday is not ticked)', () => expect(isInScheduleWindow(s, SAT, at(22, 0))).toBe(false));
  test('is outside early Friday morning (Thursday is not ticked)', () => expect(isInScheduleWindow(s, FRI, at(3, 0))).toBe(false));
  test('is outside on Sunday morning', () => expect(isInScheduleWindow(s, SUN, at(3, 0))).toBe(false));
});

describe('overnight window across the end of the week', () => {
  test('ticked for Saturday, still inside early Sunday', () => {
    const s = sched([SAT], 22, 0, 6, 0);
    expect(isInScheduleWindow(s, SUN, at(3, 0))).toBe(true);
    expect(isInScheduleWindow(s, SUN, at(6, 0))).toBe(false);
  });
  test('ticked for Sunday, inside early Monday but not early Sunday', () => {
    const s = sched([SUN], 22, 0, 6, 0);
    expect(isInScheduleWindow(s, MON, at(3, 0))).toBe(true);
    expect(isInScheduleWindow(s, SUN, at(3, 0))).toBe(false);
  });
});

describe('overnight window ticked for several days', () => {
  const s = sched([MON, TUE], 22, 0, 6, 0);
  test('Tuesday 03:00 belongs to the window that began Monday', () => expect(isInScheduleWindow(s, TUE, at(3, 0))).toBe(true));
  test('Wednesday 03:00 belongs to the window that began Tuesday', () => expect(isInScheduleWindow(s, WED, at(3, 0))).toBe(true));
  test('Wednesday 22:00 is outside, Wednesday is not ticked', () => expect(isInScheduleWindow(s, WED, at(22, 0))).toBe(false));
});

describe('window ending at midnight (22:00 to 00:00)', () => {
  const s = sched([FRI], 22, 0, 0, 0);
  test('is inside at 23:59', () => expect(isInScheduleWindow(s, FRI, at(23, 59))).toBe(true));
  test('is outside at 00:00 the next day', () => expect(isInScheduleWindow(s, SAT, at(0, 0))).toBe(false));
});

describe('window starting at midnight (00:00 to 06:00)', () => {
  const s = sched([SAT], 0, 0, 6, 0);
  test('is inside at 00:00 on the ticked day', () => expect(isInScheduleWindow(s, SAT, at(0, 0))).toBe(true));
  test('is outside the evening before', () => expect(isInScheduleWindow(s, FRI, at(23, 59))).toBe(false));
});

describe('degenerate schedules', () => {
  test('start equal to end is an empty window', () => {
    const s = sched([MON, TUE, WED, THU, FRI, SAT, SUN], 9, 0, 9, 0);
    for (let m = 0; m < 1440; m += 30) expect(isInScheduleWindow(s, MON, m)).toBe(false);
  });
  test('no ticked days is never inside', () => {
    expect(isInScheduleWindow(sched([], 22, 0, 6, 0), FRI, at(23, 0))).toBe(false);
    expect(isInScheduleWindow(sched([], 9, 0, 17, 0), FRI, at(12, 0))).toBe(false);
  });
});

describe('server copy agrees with the extension copy', () => {
  const extractBlock = (file) => {
    const text = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const match = text.match(/\/\/ BEGIN schedule-window\r?\n([\s\S]*?)\/\/ END schedule-window/);
    if (!match) throw new Error('markers not found in ' + file);
    return match[1].replace(/\r\n/g, '\n').trim();
  };
  // The server copy only differs by `export` and the type annotations.
  const stripTypes = (code) => code
    .replace(/^export /, '')
    .replace(/:\s*(any|number|boolean)\b/g, '');

  const extensionSource = extractBlock('../schedule-window.js');
  const serverSource = stripTypes(extractBlock('../../convex/scheduleWindow.ts'));

  test('the two function bodies are textually identical once types are stripped', () => {
    expect(serverSource).toBe(extensionSource);
  });

  test('they agree on every minute of every day for a spread of schedules', () => {
    const serverFn = new Function(serverSource + '; return isInScheduleWindow;')();
    const schedules = [
      sched([TUE], 9, 0, 17, 0),
      sched([FRI], 22, 0, 6, 0),
      sched([SAT], 22, 0, 6, 0),
      sched([SUN], 23, 30, 0, 30),
      sched([MON, WED, FRI], 18, 15, 2, 45),
      sched([1, 2, 3, 4, 5, 6, 0], 0, 0, 23, 59),
      sched([MON], 12, 0, 12, 0),
      sched([], 22, 0, 6, 0),
    ];
    for (const s of schedules) {
      for (let day = 0; day < 7; day++) {
        for (let m = 0; m < 1440; m++) {
          if (serverFn(s, day, m) !== isInScheduleWindow(s, day, m)) {
            throw new Error('disagree: ' + JSON.stringify(s) + ' day ' + day + ' minute ' + m);
          }
        }
      }
    }
  });
});
