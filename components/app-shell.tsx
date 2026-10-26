"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import { HOME, MODULES, type NavItem } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      className="nav__link"
      href={item.href}
      aria-current={isActive(pathname, item.href) ? "page" : undefined}
      onClick={onNavigate}
    >
      <Icon aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <aside className="sidebar" id="sidebar" data-open={open} aria-label="Portal">
        <Link className="brand" href="/" onClick={close}>
          <BrandMark className="brand__mark" id="sidebar-mark" />
          <span>
            <span className="brand__name">Neuravic</span>
            <span className="brand__sub">Portal</span>
          </span>
        </Link>

        <nav className="nav" aria-label="Main">
          <NavLink item={HOME} pathname={pathname} onNavigate={close} />
        </nav>

        <nav className="nav" aria-labelledby="nav-workspace">
          <p className="nav__label" id="nav-workspace">
            Workspace
          </p>
          {MODULES.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={close} />
          ))}
        </nav>

        <div className="sidebar__foot">
          <Link className="sidebar__user" href="/pims" onClick={close}>
            <span className="avatar" aria-hidden="true">
              {initials(user.name)}
            </span>
            <span className="sidebar__who">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </span>
          </Link>
          <form action={signOut}>
            <button className="sidebar__signout" type="submit" aria-label="Sign out" title="Sign out">
              <LogOut aria-hidden="true" />
            </button>
          </form>
        </div>
      </aside>

      {open ? <button className="scrim" type="button" aria-label="Close menu" onClick={close} /> : null}

      <div className="main">
        <div className="topbar">
          <Link className="brand" href="/">
            <BrandMark className="brand__mark" id="topbar-mark" />
            <span className="brand__name">Neuravic</span>
          </Link>
          <button
            className="btn btn--icon"
            type="button"
            aria-expanded={open}
            aria-controls="sidebar"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        <main className="content" id="content">
          {children}
        </main>
      </div>
    </div>
  );
}
