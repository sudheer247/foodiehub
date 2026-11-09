"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function OrdersModal({ auth, onClose, onReorder }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/orders", { token: auth.token }).then(setOrders).catch(err => setError(err.message));
  }, [auth.token]);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="orders-title">
        <button className="close-button modal-close" onClick={onClose} aria-label="Close order history">✕</button>
        <h2 id="orders-title">Order History 📦</h2>

        <div id="orders-list">
          {error && <p className="form-error">{error}</p>}
          {!orders && !error && <p className="orders-empty">Loading...</p>}
          {orders && orders.length === 0 && <p className="orders-empty">You haven't placed any orders yet.</p>}

          {orders && orders.map(order => (
            <div className="order-card" key={order.id}>
              <div className="order-head">
                <strong>{order.id}</strong>
                <span className="order-status">✓ Placed</span>
              </div>
              <p className="order-date">
                {new Date(order.created_at).toLocaleString("en-IN", {
                  day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"
                })}
              </p>
              <ul className="order-items">
                {order.items.map(i => <li key={i.id}>{i.name} × {i.quantity}</li>)}
              </ul>
              <div className="order-foot">
                <span className="order-total">₹{order.total} · {order.method}</span>
                <button className="add-button" onClick={() => onReorder(order.items)}>Reorder</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
