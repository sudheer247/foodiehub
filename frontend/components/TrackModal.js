"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import RateModal from "./RateModal";

const ICONS = ["✅", "👨‍🍳", "📦", "🔎", "🛵", "📍", "🏠", "🎉"];
const clock = iso => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

// Seconds until the next status change, so the screen refreshes right when something changes
function secondsToNext(order) {
  const t = order.tracking;
  const elapsed = t.total_seconds - t.eta_seconds;
  const next = t.stages.find(s => !s.done);
  if (!next) return 30;
  const offset = (new Date(next.at) - new Date(order.created_at)) / 1000;
  return Math.max(1, offset - elapsed);
}

export default function TrackModal({ auth, orderId, onClose, onViewOrders }) {
  const [order, setOrder] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  const [empty, setEmpty] = useState(false);
  const [rating, setRating] = useState(false);
  const timer = useRef();

  useEffect(() => {
    let stopped = false;

    async function load(id) {
      try {
        let target = id;
        if (!target) {
          // opened from the profile menu: show the newest order that is still on its way
          const list = await api("/orders", { token: auth.token });
          if (stopped) return;
          if (!list.length) return setEmpty(true);
          target = (list.find(o => !o.tracking.delivered) || list[0]).id;
        }
        const data = await api(`/orders/${target}`, { token: auth.token });
        if (stopped) return;
        setOrder(data);
        setFetchedAt(Date.now());
        setError("");
        if (!data.tracking.delivered) {
          // refresh at least every 30 seconds, and right after the next status change
          timer.current = setTimeout(() => load(target), Math.min(30, secondsToNext(data) + 1) * 1000);
        }
      } catch (err) {
        if (stopped) return;
        setError(err.message);
        timer.current = setTimeout(() => load(id), 30000);
      }
    }

    load(orderId);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      stopped = true;
      clearTimeout(timer.current);
      clearInterval(tick);
    };
  }, [orderId, auth.token]);

  let body = null;

  if (order) {
    const t = order.tracking;
    const elapsed = Math.min(t.total_seconds, t.total_seconds - t.eta_seconds + (now - fetchedAt) / 1000);
    const created = new Date(order.created_at).getTime();
    const stages = t.stages.map(s => ({ ...s, done: elapsed >= (new Date(s.at).getTime() - created) / 1000 }));
    const active = stages.filter(s => s.done).length - 1;
    const delivered = active === stages.length - 1;
    const minutes = Math.max(1, Math.ceil((t.total_seconds - elapsed) / 60));

    body = (
      <>
        <div className="trk-status">
          <div className="trk-emoji">{ICONS[active]}</div>
          <div>
            <h3>{stages[active].label}</h3>
            <p>{stages[active].detail}</p>
            <p className="trk-eta">{delivered ? "Delivered 🎉" : `Arriving in about ${minutes} min`}</p>
          </div>
        </div>

        <div className="trk-bar"><span style={{ width: `${Math.round((elapsed * 100) / t.total_seconds)}%` }} /></div>

        {t.partner && active >= 4 && (
          <div className="partner-card">
            <div className="partner-avatar">🛵</div>
            <div>
              <strong>{t.partner.name}</strong>
              <small>{t.partner.vehicle}</small>
              <small>{t.partner.phone}</small>
            </div>
          </div>
        )}

        <ol className="timeline">
          {stages.map((s, i) => (
            <li key={s.label} className={i < active ? "done" : i === active ? "active" : ""}>
              <span className="tl-dot">{i <= active ? ICONS[i] : ""}</span>
              <div>
                <strong>{s.label}</strong>
                {i === active && <p>{s.detail}</p>}
              </div>
              <time>{i <= active ? clock(s.at) : `~${clock(s.at)}`}</time>
            </li>
          ))}
        </ol>

        <div className="trk-summary">
          <p><strong>Items:</strong> {order.items.map(i => `${i.name} × ${i.quantity}`).join(", ")}</p>
          <p><strong>Total:</strong> ₹{order.total} · {order.method}</p>
          <p><strong>Deliver to:</strong> {order.address}</p>
        </div>

        {delivered && !order.rating && (
          <button className="primary-button pay-button" style={{ marginTop: 14 }} onClick={() => setRating(true)}>
            ⭐ Rate your food &amp; delivery
          </button>
        )}
        {order.rating && (
          <p className="ord-rated">Thanks for rating! Delivery: {order.rating.delivery ? `${order.rating.delivery}/5` : "not rated"}</p>
        )}

        <button type="button" className="auth-switch" onClick={onViewOrders}>View all orders</button>
        <p className="trk-note">Live tracking. This screen updates by itself.</p>

        {rating && (
          <RateModal
            auth={auth}
            order={{ ...order, items: order.items }}
            onClose={() => setRating(false)}
            onRated={r => { setOrder(o => ({ ...o, rating: r })); setRating(false); }}
          />
        )}
      </>
    );
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal track-modal" role="dialog" aria-modal="true" aria-labelledby="track-title">
        <button className="close-button modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 id="track-title">Track Order 📍{order ? <small className="trk-id"> #{order.id}</small> : null}</h2>

        {empty && (
          <div className="orders-empty">
            <p>You haven't placed any orders yet.</p>
            <button type="button" className="small-btn" style={{ marginTop: 12 }} onClick={onClose}>Browse the menu</button>
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
        {!order && !empty && !error && <p className="orders-empty">Loading...</p>}
        {body}
      </div>
    </div>
  );
}
