import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { currentUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await currentUser()) redirect("/");

  return (
    <div className="auth">
      <aside className="auth__brand">
        <div className="brand">
          <BrandMark className="brand__mark" id="auth-mark" />
          <span>
            <span className="brand__name">Neuravic</span>
            <span className="brand__sub">Portal</span>
          </span>
        </div>
        <div className="auth__pitch">
          <p className="hero__eyebrow">Team portal</p>
          <h2 className="auth__title">
            One place for <span>your work</span>
          </h2>
          <ul className="auth__points">
            <li>Your profile and details in PIMS</li>
            <li>Teams and people in Team Manager</li>
            <li>Approved AI and software tools</li>
            <li>Holidays for the Dubai and Cairo offices</li>
            <li>IT tools for quick fixes</li>
          </ul>
        </div>
        <BrandMark className="auth__art" id="auth-art" />
        <p className="auth__foot">© Neuravic. For Neuravic team members only.</p>
      </aside>
      <main className="auth__main">
        <div className="auth__panel">{children}</div>
      </main>
    </div>
  );
}
