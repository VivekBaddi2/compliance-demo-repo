import { endOfMonth } from "date-fns";

/**
 * Decide if task is due on checkDate (Date object)
 * - Uses startDate and frequency.
 * - If day-of-month > days in checkDate's month -> use last day of month.
 */
export const isTaskDueOnDate = (task, checkDate) => {
  if (!task || !task.startDate) return false;

  const start = new Date(task.startDate);
  const freqMap = {
    Monthly: 1,
    Quarterly: 3,
    HalfYearly: 6,
    Yearly: 12,
  };

  const stepMonths = freqMap[task.frequency];
  if (!stepMonths) return false;

  // normalize times to date-only
  const checkY = checkDate.getFullYear();
  const checkM = checkDate.getMonth(); // 0-based
  const checkD = checkDate.getDate();

  // find the day-of-month we intend to send based on startDate
  const desiredDay = start.getDate();

  // compute the number of months between start and checkDate
  const monthsBetween = (checkY - start.getFullYear()) * 12 + (checkM - start.getMonth());
  if (monthsBetween < 0) return false; // checkDate before start

  // task is due only when monthsBetween % stepMonths === 0
  if (monthsBetween % stepMonths !== 0) return false;

  // compute the day-of-month available in check month
  const lastDayOfCheckMonth = endOfMonth(checkDate).getDate();
  const actualDay = Math.min(desiredDay, lastDayOfCheckMonth);

  return checkD === actualDay;
};