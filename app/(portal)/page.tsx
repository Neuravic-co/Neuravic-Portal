import Link from "next/link";
import { ArrowRight, Bot, CalendarDays, IdCard, Wrench } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { UpcomingHolidays } from "@/components/upcoming-holidays";
import { requireUser } from "@/lib/auth";
import { HOLIDAYS } from "@/lib/holidays";
import { IT_TOOLS } from "@/lib/it-tools";
import { MODULES } from "@/lib/nav";
import { officeLabel } from "@/lib/profile";
import { TOOLS } from "@/lib/tools";

export default async function OverviewPage() {
  const user = await requireUser();
  const firstName = user.full_name.split(" ")[0];
  const optional = [user.phone, user.start_date, user.bio];
  const complete = Math.round(((5 + optional.filter(Boolean).length) / (5 + optional.length)) * 100);

  return (
    <>
      <section className="hero">
        <BrandMark className="hero__mark" id="hero-mark" />
        <p className="hero__eyebrow">Neuravic portal</p>
        <h1 className="hero__title">
          Welcome back, <span>{firstName}</span>
        </h1>
        <p className="hero__lead">
          Your profile, the tools we use, public holidays and the IT toolkit, all in one place.
        </p>
      </section>

      <div className="grid grid--stats">
        <Link className="card stat stat--link" href="/pims">
          <span className="stat__label">
            <IdCard aria-hidden="true" /> Your profile
          </span>
          <span className="stat__value">{complete}%</span>
          <span className="stat__note">{complete === 100 ? "Complete" : "Add the missing details in PIMS"}</span>
        </Link>
        <Link className="card stat stat--link" href="/tools">
          <span className="stat__label">
            <Bot aria-hidden="true" /> AI tools
          </span>
          <span className="stat__value">{TOOLS.filter((tool) => tool.group === "ai").length}</span>
          <span className="stat__note">
            {TOOLS.filter((tool) => tool.group === "ai" && tool.kind === "open").length} open source ·{" "}
            {TOOLS.filter((tool) => tool.group === "ai" && tool.kind === "paid").length} closed &amp; paid
          </span>
        </Link>
        <Link className="card stat stat--link" href="/support">
          <span className="stat__label">
            <Wrench aria-hidden="true" /> IT toolkit
          </span>
          <span className="stat__value">{IT_TOOLS.length}</span>
          <span className="stat__note">Tools for diagnosing and fixing problems</span>
        </Link>
        <Link className="card stat stat--link" href="/calendar">
          <span className="stat__label">
            <CalendarDays aria-hidden="true" /> Your office
          </span>
          <span className="stat__value stat__value--sm">{officeLabel(user.office)}</span>
          <span className="stat__note">Holidays for Dubai and Cairo</span>
        </Link>
      </div>

      <div className="grid modules">
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} className="card module" href={module.href}>
              <span className="module__icon">
                <Icon aria-hidden="true" />
              </span>
              <h2 className="module__title">{module.label}</h2>
              <p className="module__text">{module.description}</p>
              <span className="module__link">
                Open <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>

      <UpcomingHolidays holidays={HOLIDAYS} limit={4} />
    </>
  );
}
