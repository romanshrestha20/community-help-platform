// utils/date.ts
import { DateTime } from "luxon";

export const getGreeting = (timeZone = "Europe/Helsinki") => {
  const hour = DateTime.now().setZone(timeZone).hour;

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
};