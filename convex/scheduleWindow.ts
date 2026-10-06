// Scheduled Photos: is a given local moment inside the schedule's window?
//
// The block between BEGIN/END is a copy of lib/schedule-window.js, which the
// extension's service worker uses for the owner's own prompts. Both must give
// the same answer, so lib/__tests__/schedule-window.test.js compares the two
// (it strips the type annotations below and checks the text is identical).
// Change one, change the other.
//
// Rule: start before end is a same-day window on each ticked day. Start after
// end runs overnight, and the ticked day is the day it STARTS. Start equal to
// end is an empty window.
// BEGIN schedule-window
export function isInScheduleWindow(schedule: any, dayOfWeek: number, minutesOfDay: number): boolean {
  var start = schedule.startHour * 60 + schedule.startMinute;
  var end = schedule.endHour * 60 + schedule.endMinute;
  var days = schedule.days || [];
  if (start === end) return false;
  if (start < end) {
    return days.indexOf(dayOfWeek) !== -1 && minutesOfDay >= start && minutesOfDay < end;
  }
  var previousDay = (dayOfWeek + 6) % 7;
  return (days.indexOf(dayOfWeek) !== -1 && minutesOfDay >= start) ||
    (days.indexOf(previousDay) !== -1 && minutesOfDay < end);
}
// END schedule-window
