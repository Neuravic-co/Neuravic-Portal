import type { Metadata } from "next";
import Link from "next/link";
import { findToken } from "@/lib/email-tokens";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const valid = findToken(value, "reset") !== null;

  return (
    <>
      <p className="page-head__eyebrow">Account recovery</p>
      <h1 className="auth__heading">Choose a new password</h1>
      {valid ? (
        <>
          <p className="auth__lead">You will be signed out everywhere, then you can sign in with the new password.</p>
          <ResetForm token={value} />
        </>
      ) : (
        <>
          <p className="alert alert--error" role="alert">
            This link is invalid or has expired.
          </p>
          <p className="auth__switch">
            <Link href="/forgot-password">Ask for a new reset link</Link>
          </p>
        </>
      )}
    </>
  );
}
