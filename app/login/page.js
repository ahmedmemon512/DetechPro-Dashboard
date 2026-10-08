"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { Alert } from "@/components/ui";

export default function LoginPage() {
  const [step, setStep] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function post(url, payload) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }

  async function sendCode(e) {
    e?.preventDefault();
    if (busy || wait > 0) return;
    setBusy(true); setError("");
    try { await post("/api/auth/send-otp", { email }); setStep("code"); setCode(""); setWait(60); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function verify(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await post("/api/auth/verify-otp", { email, code });
      // Make sure the browser really kept the session cookie. If it did not, the middleware would
      // send us straight back here with no message, so say what is wrong instead.
      const check = await fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
      if (!check.signedIn) {
        throw new Error("The code was correct, but your browser did not save the login. Open the site over https (or http://localhost), allow cookies, and try again.");
      }
      window.location.replace("/");
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <main className="login">
      <div className="login-card">
        <Logo width={150} priority />
        {step === "email" ? (
          <form onSubmit={sendCode} className="stack">
            <div className="login-text">
              <h1>Sign in</h1>
              <p className="muted">Enter your work email and we will send you a one-time code.</p>
            </div>
            <label className="field"><span>Email</span>
              <input className="input" type="email" required autoFocus autoComplete="email" maxLength={254} placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            {error && <Alert title="Could not continue">{error}</Alert>}
            <button className="btn btn-block" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="stack">
            <div className="login-text">
              <h1>Check your email</h1>
              <p className="muted">If <strong>{email}</strong> has access, a code is on its way. It expires soon.</p>
            </div>
            <label className="field"><span>One-time code</span>
              <input className="input input-code" required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={10} placeholder="······"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></label>
            {error && <Alert title="Could not sign in">{error}</Alert>}
            <button className="btn btn-block" disabled={busy || code.length < 6}>{busy ? "Signing in…" : "Sign in"}</button>
            <div className="login-links">
              <button type="button" className="btn btn-quiet btn-sm" onClick={sendCode} disabled={busy || wait > 0}>{wait > 0 ? `Resend code in ${wait}s` : "Resend code"}</button>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => { setStep("email"); setError(""); }} disabled={busy}>Use a different email</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
