"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import RateModal from "./RateModal";
import { FOOD_FALLBACK, dishSrc } from "../lib/dish";

const TABS = ["All", "Active", "Delivered"];

const pillClass = o => (o.tracking.delivered ? "ok" : o.tracking.stage >= 4 ? "go" : "wait");
const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

export default function OrdersModal({ auth, onClose, onReorder, onTrack }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("All");
  const [rateOrder, setRateOrder] = useState(null);

  // load now, then refresh every 30 seconds so the status badges stay current
  useEffect(() => {
    let stopped = false;
    const load = () =>
      api("/orders", { token: auth.token })
        .then(data => !stopped && setOrders(data))
        .catch(err => !stopped && setError(err.message));
    load();
    const timer = setInterval(load, 30000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [auth.token]);

  const visible = (orders || []).filter(o =>
    tab === "All" ? true : tab === "Active" ? !o.tracking.delivered : o.tracking.delivered
  );

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal orders-modal" role="dialog" aria-modal="true" aria-labelledby="orders-title">
        <button className="close-button modal-close" onClick={onClose} aria-label="Close order history">✕</button>
        <h2 id="orders-title">Your Orders 📦</h2>

        <div className="ord-tabs" role="tablist">
          {TABS.map(t => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}
        {!orders && !error && <p className="orders-empty">Loading...</p>}
        {orders && visible.length === 0 && (
          <p className="orders-empty">{orders.length === 0 ? "You haven't placed any orders yet." : `No ${tab.toLowerCase()} orders.`}</p>
        )}

        {visible.map(o => {
          const foodStars = o.rating ? Object.values(o.rating.food) : [];
          const foodAvg = foodStars.length ? Math.round(foodStars.reduce((a, b) => a + b, 0) / foodStars.length) : 0;

          return (
            <article className="ord-card" key={o.id}>
              <div className="ord-top">
                <div className="ord-thumbs">
                  {o.items.slice(0, 3).map(i => (
                    <img key={i.id} src={dishSrc(i.image)} alt={i.name} onError={e => { e.currentTarget.src = FOOD_FALLBACK; }} />
                  ))}
                  {o.items.length > 3 && <span>+{o.items.length - 3}</span>}
                </div>
                <div className="ord-meta">
                  <strong>#{o.id}</strong>
                  <small>
                    {new Date(o.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </small>
                </div>
                <span className={`ord-pill ${pillClass(o)}`}>{o.tracking.delivered ? "Delivered" : o.tracking.label}</span>
              </div>

              <p className="ord-items">{o.items.map(i => `${i.name} × ${i.quantity}`).join(", ")}</p>
              <div className="ord-mid">
                <span className="ord-total">₹{o.total}</span>
                <span>{o.method}</span>
                {!o.tracking.delivered && <span>ETA about {Math.max(1, Math.ceil(o.tracking.eta_seconds / 60))} min</span>}
              </div>

              {o.rating && (
                <p className="ord-rated">
                  {foodAvg > 0 && <>Food {stars(foodAvg)} </>}
                  {o.rating.delivery > 0 && <>· Delivery {stars(o.rating.delivery)}</>}
                </p>
              )}

              <div className="ord-actions">
                {!o.tracking.delivered && (
                  <button className="small-btn" onClick={() => onTrack(o.id)}>📍 Track order</button>
                )}
                {o.tracking.delivered && !o.rating && (
                  <button className="small-btn" onClick={() => setRateOrder(o)}>⭐ Rate order</button>
                )}
                <button className="small-btn filled" onClick={() => onReorder(o.items)}>🔁 Reorder</button>
              </div>
            </article>
          );
        })}

        {rateOrder && (
          <RateModal
            auth={auth}
            order={rateOrder}
            onClose={() => setRateOrder(null)}
            onRated={rating => {
              setOrders(list => list.map(x => (x.id === rateOrder.id ? { ...x, rating } : x)));
              setRateOrder(null);
            }}
          />
        )}
      </div>
    </div>
  );
}