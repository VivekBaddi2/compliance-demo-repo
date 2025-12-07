import { endOfMonth } from "date-fns";

/**
 * Decide if task is due on checkDate (Date object in IST)
 * - Uses startDate and frequency.
 * - If startDate day > days in checkDate’s month → fallback to last day of that month.
 */
export const isTaskDueOnDate = (task, checkDate) => {
  if (!task || !task.startDate) return false;

  // Convert both dates into IST "date-only" objects
  const start = new Date(
    new Date(task.startDate).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const todayIST = new Date(
    checkDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const freqMap = {
    Monthly: 1,
    Quarterly: 3,
    HalfYearly: 6,
    Yearly: 12,
  };

  const stepMonths = freqMap[task.frequency];
  if (!stepMonths) return false;

  // extract IST date parts
  const checkY = todayIST.getFullYear();
  const checkM = todayIST.getMonth();
  const checkD = todayIST.getDate();

  const desiredDay = start.getDate();

  // months difference
  const monthsBetween =
    (checkY - start.getFullYear()) * 12 +
    (checkM - start.getMonth());

  if (monthsBetween < 0) return false; // checkDate before startDate

  if (monthsBetween % stepMonths !== 0) return false;

  // last day of this month
  const lastDayOfMonth = endOfMonth(todayIST).getDate();

  // task day must be either "desired" or last day if overflowed
  const actualDay = Math.min(desiredDay, lastDayOfMonth);

  // final check
  return checkD === actualDay;
};
