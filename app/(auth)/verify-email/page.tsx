import type { Metadata } from "next";
import Link from "next/link";
import { findToken } from "@/lib/email-tokens";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const valid = findToken(value, "verify") !== null;

  return (
    <>
      <p className="page-head__eyebrow">Almost there</p>
      <h1 className="auth__heading">Confirm your email</h1>
      {valid ? (
        <>
          <p className="auth__lead">Press the button to confirm this address and finish setting up your account.</p>
          <VerifyForm token={value} />
        </>
      ) : (
        <>
          <p className="alert alert--error" role="alert">
            This link is invalid or has expired.
          </p>
          <p className="auth__switch">
            <Link href="/resend-verification">Send a new confirmation link</Link>
          </p>
        </>
      )}
    </>
  );
}
