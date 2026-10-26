import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <p className="page-head__eyebrow">Get started</p>
      <h1 className="auth__heading">Create your account</h1>
      <p className="auth__lead">Your details go into PIMS, where you can update them at any time.</p>
      <SignupForm />
      <p className="auth__switch">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
