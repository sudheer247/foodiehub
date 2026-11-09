"use client";

import { useState } from "react";
import { api } from "../lib/api";
import { fmt, useCountdown } from "../lib/otp";
import OtpBoxes from "./OtpBoxes";

const BENEFITS = [["📦", "Saved Orders"], ["⚡", "Faster Checkout"], ["🔁", "Easy Reorder"]];

// 10 digits only; removes a pasted +91 / 91 at the start
function cleanPhone(v) {
  let d = v.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  return d.slice(0, 10);
}

export default function AuthModal({ onClose, onAuth, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login");
  const [step, setStep] = useState("enter"); // enter -> otp -> details (details: signup only)
  const [value, setValue] = useState("");    // mobile number (login also accepts an email)
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useCountdown();
  const [demoOtp, setDemoOtp] = useState("");
  const [pending, setPending] = useState(null); // { token, user } right after signup
  const [profile, setProfile] = useState({ name: "", dob: "", gender: "" });
  const today = new Date().toISOString().slice(0, 10);

  const signup = mode === "signup";
  const isEmail = !signup && value.includes("@");
  const shown = isEmail ? value : `+91-${value}`;

  function onValue(e) {
    const v = e.target.value.trim();
    setValue(signup || /^[\d\s+\-]*$/.test(v) ? cleanPhone(v) : v);
  }

  function switchMode(next) {
    setMode(next);
    setStep("enter");
    setError("");
    setCode("");
    setLeft(0);
    if (next === "signup") setValue(cleanPhone(value));
  }

  function backToEnter() {
    setStep("enter");
    setCode("");
    setError("");
  }

  // Closing during the details step keeps the new account logged in (details can be added later)
  const close = () => (step === "details" && pending ? onAuth(pending) : onClose());

  async function sendOtp() {
    const ok = isEmail ? /^\S+@\S+\.\S+$/.test(value) : /^[6-9]\d{9}$/.test(value);
    if (!ok) return setError(isEmail ? "Enter a valid email." : "Enter a valid 10-digit mobile number.");

    setError("");
    setBusy(true);
    try {
      const res = await api("/otp/send", { method: "POST", body: { purpose: mode, target: value } });
      setStep("otp");
      setCode("");
      setLeft(res.resend_in);
      setDemoOtp(res.demo_otp || "");
    } catch (err) {
      if (err.data && err.data.retry_after) {
        setStep("otp");
        setLeft(err.data.retry_after);
      }
      setError(err.message);
    }
    setBusy(false);
  }

  async function verifyOtp(e) {
    e.preventDefault();
    if (code.length !== 6) return;

    setError("");
    setBusy(true);
    try {
      const data = await api("/otp/verify", { method: "POST", body: { purpose: mode, target: value, code } });
      if (data.is_new) {
        setPending(data);
        setStep("details");
      } else {
        onAuth(data);
      }
    } catch (err) {
      setError(err.message);
      setCode("");
    }
    setBusy(false);
  }

  async function saveDetails(e) {
    e.preventDefault();
    if (profile.name.trim().length < 2) return setError("Please enter your name.");

    setError("");
    setBusy(true);
    try {
      const acc = await api("/account", { method: "POST", token: pending.token, body: profile });
      onAuth({ ...pending, user: { ...pending.user, name: acc.name } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const notRegistered = error.includes("not registered");
  const alreadyRegistered = error.includes("already registered");

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
      <div className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="close-button modal-close" onClick={close} aria-label="Close">✕</button>
        {step === "otp" && (
          <button type="button" className="back-btn" onClick={backToEnter} aria-label="Back">←</button>
        )}

        {step === "enter" && (
          <form onSubmit={e => { e.preventDefault(); sendOtp(); }} noValidate>
            <h2 id="auth-title">{signup ? "Sign up to get started" : "Login to unlock awesome benefits"}</h2>

            <div className="benefits">
              {BENEFITS.map(([icon, label]) => (
                <div key={label}><span>{icon}</span>{label}</div>
              ))}
            </div>

            <div className="float-field">
              <label htmlFor="auth-id">{signup ? "Mobile Number" : "Mobile number or email"}</label>
              <div className="float-input">
                {!isEmail && <span className="prefix-text">+91</span>}
                <input
                  id="auth-id"
                  value={value}
                  onChange={onValue}
                  inputMode={signup ? "numeric" : undefined}
                  autoComplete={signup ? "tel" : "username"}
                  autoFocus
                />
              </div>
            </div>

            <p className="form-error" role="alert">{error}</p>
            {notRegistered && (
              <button type="button" className="link-btn" onClick={() => switchMode("signup")}>Sign up instead</button>
            )}
            {alreadyRegistered && (
              <button type="button" className="link-btn" onClick={() => switchMode("login")}>Log in instead</button>
            )}

            <p className="terms-text">By going forward you accept our Terms &amp; Conditions</p>
            <button type="submit" className="primary-button pay-button" disabled={busy}>
              {busy ? "Please wait..." : "Send OTP"}
            </button>

            <button type="button" className="auth-switch" onClick={() => switchMode(signup ? "login" : "signup")}>
              {signup ? "Already registered? Log in" : "New to FoodieHub? Sign up"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} noValidate>
            <h2 id="auth-title">OTP Verification</h2>
            <p className="otp-sent">
              OTP has been sent to <strong>{shown}</strong>{" "}
              <button type="button" className="link-btn" onClick={backToEnter}>Change</button>
            </p>

            <OtpBoxes value={code} onChange={setCode} />
            <p className="otp-hint">Please enter your OTP</p>

            <p className="otp-timer">
              {left > 0 ? (
                <>Resend OTP in <strong>{fmt(left)}</strong></>
              ) : (
                <button type="button" className="link-btn" onClick={sendOtp} disabled={busy}>Resend OTP</button>
              )}
            </p>
            {demoOtp ? (
     <p className="demo-otp">Demo mode: your OTP is <strong>{demoOtp}</strong> (valid for 5 minutes)</p>
   ) : (
     <p className="otp-note">Valid for 5 minutes. Dev mode: the code is printed in the backend terminal.</p>
   )}

            <p className="form-error" role="alert">{error}</p>
            <button type="submit" className="primary-button pay-button login-submit" disabled={busy || code.length !== 6}>
              {busy ? "Please wait..." : signup ? "Verify & Continue" : "Login"}
            </button>
          </form>
        )}

        {step === "details" && (
          <form onSubmit={saveDetails} noValidate>
            <h2 id="auth-title">Tell us about you</h2>
            <p className="otp-note" style={{ textAlign: "left", marginBottom: 14 }}>
              Your mobile number +91-{value} is verified ✔. Add a few details to finish.
            </p>

            <div className="acc-row">
              <label>Full name *</label>
              <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" autoFocus />
            </div>
            <div className="acc-row">
              <label>Date of birth</label>
              <input type="date" max={today} value={profile.dob} onChange={e => setProfile({ ...profile, dob: e.target.value })} />
            </div>
            <div className="acc-row">
              <label>Gender</label>
              <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <p className="otp-note" style={{ textAlign: "left" }}>You can add and verify your email later in My Account.</p>

            <p className="form-error" role="alert">{error}</p>
            <button type="submit" className="primary-button pay-button" disabled={busy}>
              {busy ? "Saving..." : "Continue"}
            </button>
            <button type="button" className="auth-switch" onClick={() => onAuth(pending)}>Skip for now</button>
          </form>
        )}
      </div>
    </div>
  );
}