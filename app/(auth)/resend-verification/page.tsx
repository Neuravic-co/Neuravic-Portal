import type { Metadata } from "next";
import Link from "next/link";
import { EmailRequestForm } from "../email-request-form";

export const metadata: Metadata = { title: "Confirm your email" };

export default function ResendVerificationPage() {
  return (
    <>
      <p className="page-head__eyebrow">Almost there</p>
      <h1 className="auth__heading">Send a new confirmation link</h1>
      <p className="auth__lead">Enter the email you signed up with and we will send the link again.</p>
      <EmailRequestForm kind="verify" button="Send confirmation link" />
      <p className="auth__switch">
        Already confirmed? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
