"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatDate, groupHolidays, REGIONS, toISODate, type Holiday } from "@/lib/holidays";

const subscribe = () => () => {};

/** Today's date, read on the client so the list never shows a stale day from the build. */
function useToday() {
  return useSyncExternalStore(subscribe, () => toISODate(new Date()), () => null);
}

export function UpcomingHolidays({ holidays, limit, title = "Upcoming holidays" }: { holidays: Holiday[]; limit: number; title?: string }) {
  const today = useToday();
  const upcoming = today ? groupHolidays(holidays).filter((group) => group.end >= today).slice(0, limit) : [];

  return (
    <section className="card" aria-labelledby="upcoming-title">
      <div className="card__head">
        <div>
          <h2 className="card__title" id="upcoming-title">
            {title}
          </h2>
          <p className="card__sub">Next days off across both offices</p>
        </div>
        <Link className="btn" href="/calendar">
          Full calendar
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="empty">{today ? "No holidays on record ahead." : "Loading…"}</p>
      ) : (
        <ul className="list">
          {upcoming.map((group) => {
            const region = REGIONS.find((item) => item.id === group.region);
            return (
              <li className="list__item" key={`${group.region}-${group.start}`}>
                <span className="date-tile" aria-hidden="true">
                  <span className="date-tile__month">{formatDate(group.start, { month: "short" })}</span>
                  <span className="date-tile__day">{formatDate(group.start, { day: "numeric" })}</span>
                </span>
                <span className="list__text">
                  <span className="list__title">{group.name}</span>
                  <span className="list__meta">
                    {formatDate(group.start, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    {group.days > 1 ? ` – ${formatDate(group.end)} · ${group.days} days` : ""}
                    {group.expected ? " · expected" : ""}
                  </span>
                </span>
                <span className={group.region === "uae" ? "badge badge--blue" : "badge badge--amber"}>{region?.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
