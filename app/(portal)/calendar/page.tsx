import type { Metadata } from "next";
import { HolidayCalendar } from "./holiday-calendar";

export const metadata: Metadata = { title: "Calendar & holidays" };

export default function CalendarPage() {
  return <HolidayCalendar />;
}
