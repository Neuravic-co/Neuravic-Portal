import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

/** Every page in this group needs a signed-in user; anyone else is sent to the login page. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={{ name: user.full_name, role: user.job_title || user.department }}>
      {children}
    </AppShell>
  );
}
