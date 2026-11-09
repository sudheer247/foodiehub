"use client";

import { useRef } from "react";

// Six separate boxes for the OTP. Typing moves forward, Backspace moves back, pasting fills all boxes.
export default function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);

  function handleChange(i, e) {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) return;

    const next = digits.length > 1
      ? (value.slice(0, i) + digits).slice(0, 6)          // pasted several digits
      : value.slice(0, i) + digits + value.slice(i + 1);  // typed one digit

    onChange(next.slice(0, 6));
    const target = refs.current[Math.min(5, i + digits.length)];
    if (target) target.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key !== "Backspace") return;
    e.preventDefault();

    if (value[i]) {
      onChange(value.slice(0, i) + value.slice(i + 1));
    } else if (i > 0) {
      onChange(value.slice(0, i - 1) + value.slice(i));
      refs.current[i - 1].focus();
    }
  }

  return (
    <div className="otp-boxes">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          className="otp-box"
          value={value[i] || ""}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`OTP digit ${i + 1}`}
          autoFocus={i === 0}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
        />
      ))}
    </div>
  );
}