"use client";

import { useState } from "react";
import Turnstile from "@/components/Turnstile";
import { AUDIENCES, CONSENT_TEXT, PROVINCES, ROLES, THANK_YOU, validate, type FieldErrors, type WaitlistInput } from "@/lib/waitlist";

const EMPTY: WaitlistInput = {
  audience: "",
  firstName: "",
  lastName: "",
  email: "",
  clinicName: "",
  role: "",
  roleOther: "",
  province: "",
  consent: false,
  website: "",
};

export default function WaitlistForm() {
  const [v, setV] = useState<WaitlistInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<keyof WaitlistInput>>(new Set());
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState("");
  const [attempts, setAttempts] = useState(0);

  const isClinic = v.audience === "clinic";

  function set<K extends keyof WaitlistInput>(key: K, value: WaitlistInput[K]) {
    const next = { ...v, [key]: value };
    setV(next);
    if (touched.has(key)) setErrors(validate(next).errors);
  }
  function blur(key: keyof WaitlistInput) {
    const t = new Set(touched).add(key);
    setTouched(t);
    const all = validate(v).errors;
    setErrors(Object.fromEntries(Object.entries(all).filter(([k]) => t.has(k as keyof WaitlistInput))));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setFormError("");
    const check = validate(v);
    if (!check.ok) {
      setErrors(check.errors);
      setTouched(new Set(Object.keys(EMPTY) as (keyof WaitlistInput)[]));
      const first = Object.keys(check.errors)[0];
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, turnstileToken: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        return;
      }
      setAttempts((n) => n + 1);
      if (data.errors) setErrors(data.errors);
      setFormError(data.error || (data.errors ? "Please check the highlighted answers." : "Something went wrong sending your details. Please try again."));
    } catch {
      setAttempts((n) => n + 1);
      setFormError("Something went wrong sending your details. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="thanks" tabIndex={-1} ref={(el) => el?.focus()}>
        <h3>Thank you</h3>
        <p>{THANK_YOU}</p>
      </div>
    );
  }

  const err = (k: keyof WaitlistInput) =>
    errors[k] ? (
      <p className="err" id={`err-${k}`} role="alert">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof WaitlistInput) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `err-${k}` : undefined });

  return (
    <form onSubmit={submit} noValidate>
      <div className={`row ${errors.audience ? "invalid" : ""}`}>
        <p className="lab" id="lab-audience">
          I am <span className="req" aria-hidden="true">*</span>
        </p>
        <div className="choices" role="radiogroup" aria-labelledby="lab-audience">
          {AUDIENCES.map((a, i) => (
            <label className="choice" key={a.value}>
              <input
                type="radio"
                name="audience"
                id={i === 0 ? "f-audience" : undefined}
                value={a.value}
                checked={v.audience === a.value}
                onChange={() => set("audience", a.value)}
                onBlur={() => blur("audience")}
              />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
        {err("audience")}
      </div>

      <div className="pair">
        <div className={`row ${errors.firstName ? "invalid" : ""}`}>
          <label className="lab" htmlFor="f-firstName">
            First name <span className="req" aria-hidden="true">*</span>
          </label>
          <input id="f-firstName" type="text" autoComplete="given-name" value={v.firstName} onChange={(e) => set("firstName", e.target.value)} onBlur={() => blur("firstName")} {...aria("firstName")} />
          {err("firstName")}
        </div>
        <div className="row">
          <label className="lab" htmlFor="f-lastName">Last name</label>
          <input id="f-lastName" type="text" autoComplete="family-name" value={v.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
      </div>

      <div className={`row ${errors.email ? "invalid" : ""}`}>
        <label className="lab" htmlFor="f-email">
          Email <span className="req" aria-hidden="true">*</span>
        </label>
        <input id="f-email" type="email" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} {...aria("email")} />
        {err("email")}
      </div>

      {isClinic && (
        <div className={`row ${errors.clinicName ? "invalid" : ""}`}>
          <label className="lab" htmlFor="f-clinicName">
            Clinic name <span className="req" aria-hidden="true">*</span>
          </label>
          <input id="f-clinicName" type="text" autoComplete="organization" value={v.clinicName} onChange={(e) => set("clinicName", e.target.value)} onBlur={() => blur("clinicName")} {...aria("clinicName")} />
          {err("clinicName")}
        </div>
      )}

      <div className={`row ${errors.role || errors.roleOther ? "invalid" : ""}`}>
        <label className="lab" htmlFor="f-role">{isClinic ? "Role you're hiring for" : "Your role"}</label>
        <select id="f-role" value={v.role} onChange={(e) => set("role", e.target.value)} onBlur={() => blur("role")} {...aria("role")}>
          <option value="">Choose one</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
          <option value="__other__">Other</option>
        </select>
        {v.role === "__other__" && (
          <input id="f-roleOther" className="other" type="text" placeholder="Tell us the role" aria-label="Other role" value={v.roleOther} onChange={(e) => set("roleOther", e.target.value)} onBlur={() => blur("roleOther")} {...aria("roleOther")} />
        )}
        {err("role")}
        {err("roleOther")}
      </div>

      <div className={`row ${errors.province ? "invalid" : ""}`}>
        <label className="lab" htmlFor="f-province">
          Province or territory <span className="req" aria-hidden="true">*</span>
        </label>
        <select id="f-province" value={v.province} onChange={(e) => set("province", e.target.value)} onBlur={() => blur("province")} {...aria("province")}>
          <option value="">Choose one</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {err("province")}
      </div>

      <div className={`row ${errors.consent ? "invalid" : ""}`}>
        <label className="consent">
          <input id="f-consent" type="checkbox" checked={v.consent} onChange={(e) => { setTouched(new Set(touched).add("consent")); set("consent", e.target.checked); }} {...aria("consent")} />
          <span>
            {CONSENT_TEXT} <span className="req" aria-hidden="true">*</span>
          </span>
        </label>
        {err("consent")}
      </div>

      {/* Honeypot: hidden from people, filled in by bots */}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>

      <Turnstile onToken={setToken} resetSignal={attempts} />
      {formError && <p className="err form-err" role="alert">{formError}</p>}
      <button type="submit" className="btn" disabled={sending}>
        {sending ? "Sending" : "Join the waitlist"}
      </button>
    </form>
  );
}
