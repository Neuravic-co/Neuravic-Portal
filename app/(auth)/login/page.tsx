import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  "check-email": "Check your email. If we can set up that address, a link is on its way. Confirm it, then sign in.",
  verified: "Email confirmed. You can sign in now.",
  "password-reset": "Your password is changed. Sign in with the new one.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string | string[] }> }) {
  const { notice } = await searchParams;
  const message = typeof notice === "string" ? NOTICES[notice] : undefined;

  return (
    <>
      <p className="page-head__eyebrow">Welcome back</p>
      <h1 className="auth__heading">Sign in to the portal</h1>
      <p className="auth__lead">Use the email and password you signed up with.</p>
      {message ? (
        <p className="alert alert--success" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>{message}</span>
        </p>
      ) : null}
      <LoginForm />
      <p className="auth__switch">
        <Link href="/forgot-password">Forgot your password?</Link> · <Link href="/resend-verification">Resend confirmation email</Link>
      </p>
      <p className="auth__switch">
        New to the portal? <Link href="/signup">Create an account</Link>
      </p>
    </>
  );
}
