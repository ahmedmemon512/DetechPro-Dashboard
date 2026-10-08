"use client";

import { Icon } from "./Icons";

export default function SignOutButton() {
  async function out() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    window.location.href = "/login";
  }
  return (
    <button type="button" className="nav-link signout" onClick={out}>
      <Icon name="logout" />
      Sign out
    </button>
  );
}