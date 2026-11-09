"use client";

import { useState } from "react";
import { api } from "../lib/api";

const METHODS = [
  ["upi", "📱 UPI", "UPI"],
  ["card", "💳 Card", "Card"],
  ["cod", "💵 Cash on Delivery", "Cash on Delivery"]
];

export default function CheckoutModal({ lines, total, auth, onClose, onPlaced, onViewOrders, defaultAddress = "" }) {
  const [f, setF] = useState({
    name: auth.user.name, phone: auth.user.phone || "", address: defaultAddress, upi: "", cardNumber: "", expiry: "", cvv: ""
  });
  const [method, setMethod] = useState("upi");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(null);

  const set = (key, clean = v => v) => e => setF({ ...f, [key]: clean(e.target.value) });
  const digits = v => v.replace(/\D/g, "");

  function validate() {
    if (f.name.trim().length < 2) return "Please enter your full name.";
    if (!/^\d{10}$/.test(f.phone)) return "Enter a valid 10-digit phone number.";
    if (f.address.trim().length < 5) return "Please enter your delivery address.";
    if (method === "upi" && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(f.upi.trim())) return "Enter a valid UPI ID, like name@upi.";
    if (method === "card") {
      if (digits(f.cardNumber).length !== 16) return "Card number must be 16 digits.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiry)) return "Enter expiry as MM/YY.";
      if (!/^\d{3}$/.test(f.cvv)) return "CVV must be 3 digits.";
    }
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;

    setBusy(true);
    try {
      // Only name/phone/address/method and item ids are sent. Card and UPI details are NOT sent or stored.
      const order = await api("/orders", {
        method: "POST",
        token: auth.token,
        body: {
          items: lines.map(l => ({ id: l.id, quantity: l.quantity })),
          method: METHODS.find(m => m[0] === method)[2],
          name: f.name, phone: f.phone, address: f.address
        }
      });
      setPlaced(order);
      onPlaced();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button className="close-button modal-close" onClick={onClose} aria-label="Close checkout">✕</button>

        {placed ? (
          <div className="success">
            <div className="success-icon">✅</div>
            <h2>Order placed!</h2>
            <p>Order {placed.id} · ₹{placed.total} · {placed.method}. Your food is on its way (demo)!</p>
            <button className="primary-button" onClick={onClose}>Done</button>
            <button className="clear-button" onClick={onViewOrders}>View Order History</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="checkout-title">Checkout</h2>

            <div className="order-summary">
              {lines.map(l => (
                <div key={l.id}><span>{l.food.name} × {l.quantity}</span><span>₹{l.food.price * l.quantity}</span></div>
              ))}
              <div className="summary-total"><span>Total</span><span>₹{total}</span></div>
            </div>

            <h3>Delivery details</h3>
            <input placeholder="Full name" value={f.name} onChange={set("name")} autoComplete="name" />
            <input placeholder="Phone number (10 digits)" value={f.phone} onChange={set("phone", v => digits(v).slice(0, 10))} inputMode="numeric" autoComplete="tel" />
            <textarea placeholder="Delivery address" rows="2" value={f.address} onChange={set("address")} />

            <h3>Payment method</h3>
            <div className="pay-options">
              {METHODS.map(([key, label]) => (
                <label className="pay-option" key={key}>
                  <input type="radio" name="payment" checked={method === key} onChange={() => setMethod(key)} /> {label}
                </label>
              ))}
            </div>

            {method === "upi" && (
              <div className="pay-fields">
                <input placeholder="UPI ID (e.g. name@upi)" value={f.upi} onChange={set("upi")} />
              </div>
            )}
            {method === "card" && (
              <div className="pay-fields">
                <input placeholder="Card number" inputMode="numeric" autoComplete="off" value={f.cardNumber}
                  onChange={set("cardNumber", v => digits(v).slice(0, 16).replace(/(.{4})/g, "$1 ").trim())} />
                <div className="pay-row">
                  <input placeholder="MM/YY" maxLength={5} autoComplete="off" value={f.expiry} onChange={set("expiry")} />
                  <input placeholder="CVV" inputMode="numeric" autoComplete="off" value={f.cvv} onChange={set("cvv", v => digits(v).slice(0, 3))} />
                </div>
              </div>
            )}
            {method === "cod" && (
              <div className="pay-fields"><p>Pay in cash when your order arrives.</p></div>
            )}

            <p className="form-error" role="alert">{error}</p>
            <button type="submit" className="primary-button pay-button" disabled={busy}>
              {busy ? "Placing order..." : method === "cod" ? `Place Order ₹${total}` : `Pay ₹${total}`}
            </button>
            <p className="demo-note">Demo only: no real payment is processed. Please don't enter real card details.</p>
          </form>
        )}
      </div>
    </div>
  );
}