import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <p className="page-head__eyebrow">Welcome back</p>
      <h1 className="auth__heading">Sign in to the portal</h1>
      <p className="auth__lead">Use the email and password you signed up with.</p>
      <LoginForm />
      <p className="auth__switch">
        New to the portal? <Link href="/signup">Create an account</Link>
      </p>
    </>
  );
}
