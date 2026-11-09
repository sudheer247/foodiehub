"use client";

import { useState } from "react";
import { detectLocation } from "../lib/location";

// One tap to set a city (add more here whenever you like)
const CITIES = [
  ["Nellore", "Andhra Pradesh"],
  ["Tirupati", "Andhra Pradesh"],
  ["Vijayawada", "Andhra Pradesh"],
  ["Visakhapatnam", "Andhra Pradesh"],
  ["Guntur", "Andhra Pradesh"],
  ["Hyderabad", "Telangana"],
  ["Chennai", "Tamil Nadu"],
  ["Bengaluru", "Karnataka"]
];

export default function LocationModal({ current, onSave, onClose }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function detect() {
    setError("");
    setBusy(true);
    try {
      onSave(await detectLocation());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function saveManual(e) {
    e.preventDefault();
    const address = text.trim();
    if (address.length < 3) return setError("Please enter your area, city or address.");
    onSave({ label: address.split(",")[0].trim().slice(0, 30), address });
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="location-title">
        <button className="close-button modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 id="location-title">Delivery location 📍</h2>

        {current && <p className="otp-note" style={{ textAlign: "left", marginBottom: 12 }}>Current: {current.address}</p>}

        <button type="button" className="primary-button pay-button" onClick={detect} disabled={busy}>
          {busy ? "Detecting..." : "📍 Detect my location"}
        </button>

        <p className="or-line"><span>or choose your city</span></p>

        <div className="city-chips">
          {CITIES.map(([city, state]) => (
            <button
              type="button"
              key={city}
              onClick={() => onSave({ label: city, address: `${city}, ${state}, India` })}
            >
              {city}
            </button>
          ))}
        </div>

        <p className="or-line"><span>or type it</span></p>

        <form onSubmit={saveManual} noValidate>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Area, city or full address"
            autoComplete="street-address"
          />
          <p className="form-error" role="alert">{error}</p>
          <button type="submit" className="small-btn" style={{ width: "100%" }}>Save location</button>
        </form>

        {current && (
          <button type="button" className="auth-switch" onClick={() => onSave(null)}>Remove location</button>
        )}
      </div>
    </div>
  );
}