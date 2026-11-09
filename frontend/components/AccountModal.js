"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { fmt, useCountdown } from "../lib/otp";

// Email / mobile: shows "Verified" (locked) or lets the customer verify with an OTP
function VerifyField({ kind, label, value, verified, token, onDone }) {
  const isPhone = kind === "phone";
  const [input, setInput] = useState(value || "");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useCountdown();
  const [demoOtp, setDemoOtp] = useState("");

  async function send() {
    setError("");
    setBusy(true);
    try {
      const res = await api("/otp/send", { method: "POST", token, body: { purpose: kind, target: input } });
      setSent(true);
      setCode("");
      setLeft(res.resend_in);
      setDemoOtp(res.demo_otp || "");
    } catch (err) {
      if (err.data && err.data.retry_after) {
        setSent(true);
        setLeft(err.data.retry_after);
      }
      setError(err.message);
    }
    setBusy(false);
  }

  async function verify() {
    setError("");
    setBusy(true);
    try {
      onDone(await api("/otp/verify", { method: "POST", token, body: { purpose: kind, target: input, code } }));
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  if (verified) {
    return (
      <div className="acc-row">
        <label>{label}</label>
        <div className="field-line verified-field">
          <input value={isPhone ? `+91 ${value}` : value} readOnly aria-readonly="true" />
          <span className="verified-badge">Verified</span>
        </div>
      </div>
    );
  }

  return (
    <div className="acc-row">
      <label>{label} <span className="unverified-badge">Not verified</span></label>
      <div className="field-line">
        {isPhone && <span className="prefix">+91</span>}
        <input
          value={input}
          disabled={sent}
          placeholder={isPhone ? "10-digit mobile number" : "you@example.com"}
          inputMode={isPhone ? "numeric" : "email"}
          onChange={e => setInput(isPhone ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value)}
        />
        {!sent && <button type="button" className="small-btn" disabled={busy} onClick={send}>Send OTP</button>}
      </div>

      {sent && (
        <>
          <div className="field-line">
            <input
              className="otp-input"
              inputMode="numeric"
              placeholder="······"
              value={code}
              maxLength={6}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <button type="button" className="small-btn" disabled={busy || code.length !== 6} onClick={verify}>Verify</button>
          </div>
          <p className="otp-timer">
            {left > 0 ? (
              <>Resend OTP in <strong>{fmt(left)}</strong></>
            ) : (
              <button type="button" className="link-btn" onClick={send} disabled={busy}>Resend OTP</button>
            )}
            {" · valid for 5 minutes · "}
            <button type="button" className="link-btn" onClick={() => { setSent(false); setCode(""); setLeft(0); setError(""); }}>
              Change
            </button>
          </p>
             {demoOtp && <p className="demo-otp">Demo mode: your OTP is <strong>{demoOtp}</strong></p>}
        </>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function AccountModal({ auth, onClose, onUserChange, showToast }) {
  const [acc, setAcc] = useState(null);
  const [form, setForm] = useState({ name: "", dob: "", gender: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    api("/account", { token: auth.token })
      .then(data => {
        setAcc(data);
        setForm({ name: data.name, dob: data.dob, gender: data.gender });
      })
      .catch(err => setError(err.message));
  }, [auth.token]);

  async function save(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api("/account", { method: "POST", token: auth.token, body: form });
      setAcc(data);
      onUserChange({ name: data.name });
      showToast("Profile saved ✓");
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  function verified(data) {
    setAcc(data);
    onUserChange({ email: data.email, phone: data.phone });
    showToast("Verified ✓");
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button className="close-button modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 id="account-title">My Account 👤</h2>

        {!acc && !error && <p className="orders-empty">Loading...</p>}

        {acc && (
          <>
            <form onSubmit={save} noValidate>
              <div className="acc-row">
                <label>Customer name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>

              <div className="acc-row">
                <label>Date of birth</label>
                <input type="date" max={today} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
              </div>

              <div className="acc-row">
                <label>Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <p className="form-error" role="alert">{error}</p>
              <button type="submit" className="primary-button pay-button" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </button>
            </form>

            <h3>Contact details</h3>
            <VerifyField kind="email" label="Email" value={acc.email} verified={acc.email_verified} token={auth.token} onDone={verified} />
            <VerifyField kind="phone" label="Mobile number" value={acc.phone} verified={acc.phone_verified} token={auth.token} onDone={verified} />
            <p className="demo-note">Once verified, email and mobile number cannot be changed.</p>
          </>
        )}
      </div>
    </div>
  );
}