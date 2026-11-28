import type { Metadata } from "next";
import Link from "next/link";
import { EmailRequestForm } from "../email-request-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <p className="page-head__eyebrow">Account recovery</p>
      <h1 className="auth__heading">Reset your password</h1>
      <p className="auth__lead">Enter your work email and we will send you a link to choose a new password.</p>
      <EmailRequestForm kind="reset" button="Send reset link" />
      <p className="auth__switch">
        Remembered it? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
