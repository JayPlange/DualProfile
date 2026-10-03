/**
 * Scheduled Photos: is a given local moment inside the schedule's window?
 *
 * Loaded by the service worker with importScripts (it becomes a global), and
 * required by Jest. convex/scheduleWindow.ts holds a copy of the function
 * between the BEGIN/END markers, for the server's viewer-side fallback;
 * lib/__tests__/schedule-window.test.js fails if the two ever differ.
 *
 * Rule:
 *   - Start earlier than end (09:00 to 17:00): the window is that span on each
 *     ticked day.
 *   - Start later than end (22:00 to 06:00): the window runs overnight. The
 *     ticked day is the day it STARTS, so a window ticked for Friday runs from
 *     Friday 22:00 to Saturday 06:00.
 *   - Start equal to end: an empty window, never inside it.
 *
 * dayOfWeek is 0 (Sunday) to 6. minutesOfDay is hours * 60 + minutes, in the
 * schedule owner's local time.
 */
// BEGIN schedule-window
function isInScheduleWindow(schedule, dayOfWeek, minutesOfDay) {
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

if (typeof module !== 'undefined') {
  module.exports = { isInScheduleWindow };
}
