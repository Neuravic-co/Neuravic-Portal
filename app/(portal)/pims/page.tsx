import type { Metadata } from "next";
import { Briefcase, Building2, CalendarClock, Hash, Mail, MapPin, Phone, Sparkles, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { officeLabel } from "@/lib/profile";
import { formatDate } from "@/lib/holidays";
import { PasswordForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "PIMS" };

function formatTimestamp(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
}

export default async function PimsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser();
  const { welcome } = await searchParams;

  const optional = [user.phone, user.start_date, user.bio];
  const complete = Math.round(((5 + optional.filter(Boolean).length) / (5 + optional.length)) * 100);
  const initials = user.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const details = [
    { icon: Hash, label: "Employee ID", value: user.employee_id },
    { icon: Mail, label: "Work email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone || "Not added" },
    { icon: Briefcase, label: "Job title", value: user.job_title },
    { icon: Building2, label: "Department", value: user.department },
    { icon: MapPin, label: "Office", value: officeLabel(user.office) },
    { icon: CalendarClock, label: "Start date", value: user.start_date ? formatDate(user.start_date) : "Not added" },
    { icon: UserRound, label: "Member since", value: formatDate(user.created_at.slice(0, 10)) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="PIMS"
        title="Personal information"
        lead="Your profile in the Neuravic portal. Keep it up to date so the team knows who you are and how to reach you."
      />

      {welcome ? (
        <p className="alert alert--success welcome">
          <Sparkles aria-hidden="true" />
          <span>Welcome to the portal, {user.full_name.split(" ")[0]}. Your account is ready — add your phone, start date and a short bio below to finish your profile.</span>
        </p>
      ) : null}

      <section className="card profile">
        <span className="avatar avatar--lg" aria-hidden="true">
          {initials}
        </span>
        <div className="profile__who">
          <h2 className="profile__name">{user.full_name}</h2>
          <p className="profile__role">
            {user.job_title} · {user.department}
          </p>
          <div className="profile__tags">
            <span className="badge badge--blue">{user.employee_id}</span>
            <span className="badge">{officeLabel(user.office)}</span>
          </div>
        </div>
        <div className="profile__meter">
          <div className="progress">
            <div className="progress__track" role="progressbar" aria-label="Profile complete" aria-valuenow={complete} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress__bar" style={{ width: `${complete}%` }} />
            </div>
            <span className="progress__value">{complete}%</span>
          </div>
          <span className="card__sub">Profile complete · last sign-in {formatTimestamp(user.last_login_at)}</span>
        </div>
      </section>

      <div className="grid grid--split">
        <div className="stack">
          <section className="card" aria-labelledby="edit-title">
            <div className="card__head">
              <div>
                <h2 className="card__title" id="edit-title">
                  Edit your details
                </h2>
                <p className="card__sub">Your email is your sign-in and cannot be changed here.</p>
              </div>
            </div>
            <div className="card__body">
              <ProfileForm
                user={{
                  full_name: user.full_name,
                  job_title: user.job_title,
                  department: user.department,
                  office: user.office,
                  phone: user.phone,
                  start_date: user.start_date,
                  bio: user.bio,
                }}
              />
            </div>
          </section>

          <section className="card" aria-labelledby="password-title">
            <div className="card__head">
              <h2 className="card__title" id="password-title">
                Change password
              </h2>
            </div>
            <div className="card__body">
              <PasswordForm />
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card" aria-labelledby="details-title">
            <div className="card__head">
              <h2 className="card__title" id="details-title">
                Your record
              </h2>
            </div>
            <dl className="details">
              {details.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="details__row" key={item.label}>
                    <dt>
                      <Icon aria-hidden="true" />
                      {item.label}
                    </dt>
                    <dd>{item.value}</dd>
                  </div>
                );
              })}
            </dl>
          </section>

          {user.bio ? (
            <section className="card" aria-labelledby="bio-title">
              <div className="card__head">
                <h2 className="card__title" id="bio-title">
                  About
                </h2>
              </div>
              <p className="card__body bio">{user.bio}</p>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
