"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icons";
import Logo from "./Logo";
import SignOutButton from "./SignOutButton";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/generate-leads", label: "Generate leads", icon: "search" },
  { href: "/upload-leads", label: "Upload leads", icon: "upload" },
  { href: "/recent-calls", label: "Recent calls", icon: "phone" },
  { href: "/inbound-calls", label: "Inbound calls", icon: "inbound" },
  { href: "/outbound-calls", label: "Outbound calls", icon: "outbound" },
  { href: "/analytics", label: "Analytics", icon: "chart" },
];

export default function Shell({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <a href="#main" className="skip">Skip to content</a>

      <header className="topbar">
        <button className="icon-btn" aria-label="Open menu" aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen((v) => !v)}>
          <Icon name={open ? "close" : "menu"} />
        </button>
        <Logo width={104} priority />
      </header>

      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <aside id="sidebar" className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="side-brand"><Logo width={150} priority /></div>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
                <Icon name={n.icon} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="side-foot"><SignOutButton /></div>
      </aside>

      <main id="main" className="main">{children}</main>
    </div>
  );
}
