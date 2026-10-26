"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { UpcomingHolidays } from "@/components/upcoming-holidays";
import { HOLIDAYS, REGIONS, toISODate, type Region } from "@/lib/holidays";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type RegionFilter = Region | "all";

const subscribe = () => () => {};

function useToday() {
  return useSyncExternalStore(subscribe, () => toISODate(new Date()), () => null);
}

/** Six weeks of days, Monday first, covering the whole month. */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

function holidayDayLabel(count: number) {
  if (count === 0) return "No holidays this month";
  return count === 1 ? "1 holiday day" : `${count} holiday days`;
}

export function HolidayCalendar() {
  const today = useToday();
  const [region, setRegion] = useState<RegionFilter>("all");
  const [shift, setShift] = useState(0);

  const base = today ? new Date(`${today}T00:00:00`) : new Date(2026, 0, 1);
  const view = new Date(base.getFullYear(), base.getMonth() + shift, 1);
  const year = view.getFullYear();
  const month = view.getMonth();

  const holidays = useMemo(() => HOLIDAYS.filter((holiday) => region === "all" || holiday.region === region), [region]);
  const byDate = useMemo(() => {
    const map = new Map<string, typeof holidays>();
    for (const holiday of holidays) map.set(holiday.date, [...(map.get(holiday.date) ?? []), holiday]);
    return map;
  }, [holidays]);

  const days = monthGrid(year, month);
  const title = view.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const inMonth = holidays.filter((holiday) => holiday.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`));

  return (
    <>
      <PageHeader
        eyebrow="Calendar & holidays"
        title="Holiday calendar"
        lead="Public holidays for the Dubai and Cairo offices. Plan leave, releases and client meetings around them."
        actions={
          <div className="tabs" role="group" aria-label="Office">
            <button type="button" aria-pressed={region === "all"} onClick={() => setRegion("all")}>
              All offices
            </button>
            {REGIONS.map((item) => (
              <button key={item.id} type="button" aria-pressed={region === item.id} onClick={() => setRegion(item.id)}>
                {item.office}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid--split">
        <section className="card" aria-labelledby="month-title">
          <div className="card__head">
            <div className="cal__nav">
              <button className="btn btn--icon" type="button" aria-label="Previous month" onClick={() => setShift((value) => value - 1)}>
                <ChevronLeft aria-hidden="true" />
              </button>
              <h2 className="cal__month" id="month-title" aria-live="polite">
                {title}
              </h2>
              <button className="btn btn--icon" type="button" aria-label="Next month" onClick={() => setShift((value) => value + 1)}>
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
            <div className="toolbar">
              <span className="card__sub">
                {holidayDayLabel(new Set(inMonth.map((holiday) => holiday.date)).size)}
              </span>
              <button className="btn" type="button" disabled={shift === 0} onClick={() => setShift(0)}>
                Today
              </button>
            </div>
          </div>

          <ul className="sr-only">
            {inMonth.length === 0 ? <li>No holidays this month.</li> : null}
            {inMonth.map((holiday) => (
              <li key={holiday.date + holiday.region + holiday.name}>
                {new Date(`${holiday.date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}:{" "}
                {holiday.name}, {REGIONS.find((item) => item.id === holiday.region)?.label}
              </li>
            ))}
          </ul>

          <div className="cal" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <div className="cal__dow" key={day}>
                {day}
              </div>
            ))}
            {days.map((day) => {
              const iso = toISODate(day);
              const events = byDate.get(iso) ?? [];
              const classes = ["cal__day"];
              if (day.getMonth() !== month) classes.push("cal__day--out");
              if (day.getDay() === 0 || day.getDay() === 6) classes.push("cal__day--weekend");
              if (iso === today) classes.push("cal__day--today");
              return (
                <div className={classes.join(" ")} key={iso}>
                  <span className="cal__num">
                    {day.getDate()}
                  </span>
                  <span className="cal__events">
                    {events.map((event) => (
                      <span className={`cal__event cal__event--${event.region}`} key={event.region + event.name} title={event.name}>
                        {event.name}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="card__body legend">
            <span>
              <i className="legend__uae" /> UAE (Dubai)
            </span>
            <span>
              <i className="legend__egypt" /> Egypt (Cairo)
            </span>
          </div>
        </section>

        <div className="stack">
          <UpcomingHolidays holidays={holidays} limit={6} title="Coming up" />
          <p className="note">
            <Info aria-hidden="true" />
            <span>
              Eid, Arafat Day, Islamic New Year and the Prophet&apos;s Birthday follow the lunar calendar. Their dates here are
              expected dates; the official days are confirmed by each government shortly before.
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
