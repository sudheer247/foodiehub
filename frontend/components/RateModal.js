"use client";

import { useState } from "react";
import { api } from "../lib/api";
import { FOOD_FALLBACK, dishSrc } from "../lib/dish";

function Stars({ value, onChange, label }) {
  return (
    <div className="stars" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={n <= value ? "on" : ""}
          onClick={() => onChange(n === value ? 0 : n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function RateModal({ auth, order, onClose, onRated }) {
  const [food, setFood] = useState({});   // dish id -> stars
  const [delivery, setDelivery] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const partner = order.tracking && order.tracking.partner;

  async function submit(e) {
    e.preventDefault();
    const foodRatings = order.items.filter(i => food[i.id]).map(i => ({ id: i.id, stars: food[i.id] }));
    if (!delivery && foodRatings.length === 0) return setError("Please give at least one rating.");

    setError("");
    setBusy(true);
    try {
      const res = await api(`/orders/${order.id}/rate`, {
        method: "POST",
        token: auth.token,
        body: { delivery, comment, food: foodRatings }
      });
      onRated(res.rating);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="rate-title">
        <button className="close-button modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 id="rate-title">Rate your order ⭐</h2>
        <p className="info-note">Order #{order.id}</p>

        <form onSubmit={submit} noValidate>
          <p className="rate-sec">How was the food?</p>
          {order.items.map(i => (
            <div className="rate-row" key={i.id}>
              <img src={dishSrc(i.image)} alt={i.name} onError={e => { e.currentTarget.src = FOOD_FALLBACK; }} />
              <span className="rate-name">{i.name}</span>
              <Stars value={food[i.id] || 0} label={`Rate ${i.name}`} onChange={n => setFood({ ...food, [i.id]: n })} />
            </div>
          ))}

          <p className="rate-sec">{partner ? `How was ${partner.name}'s delivery?` : "How was the delivery?"}</p>
          <Stars value={delivery} label="Rate the delivery partner" onChange={setDelivery} />
          <textarea
            placeholder="Add a comment about the delivery (optional)"
            rows="2"
            maxLength={300}
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ marginTop: 10 }}
          />

          <p className="form-error" role="alert">{error}</p>
          <button type="submit" className="primary-button pay-button" disabled={busy}>
            {busy ? "Saving..." : "Submit ratings"}
          </button>
        </form>
      </div>
    </div>
  );
}
