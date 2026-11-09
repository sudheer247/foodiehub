"use client";

export default function CartPanel({ open, lines, total, onClose, onQty, onRemove, onClear, onCheckout }) {
  return (
    <>
      <div className="cart-backdrop" hidden={!open} onClick={onClose} />

      <aside className="cart-panel" hidden={!open}>
        <div className="cart-header">
          <h2>Your Cart 🛒</h2>
          <button className="close-button" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        <div>
          {lines.length === 0 && "Your cart is empty."}
          {lines.map(({ food, quantity }) => (
            <div className="cart-item" key={food.id}>
              <div>
                <h4>{food.name}</h4>
                <p>₹{food.price * quantity}</p>
                <div className="quantity-controls">
                  <button onClick={() => onQty(food.id, -1)} aria-label={`Decrease ${food.name} quantity`}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => onQty(food.id, 1)} aria-label={`Increase ${food.name} quantity`}>+</button>
                </div>
                <button className="remove-button" onClick={() => onRemove(food.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Total: <span>₹{total}</span></h3>
          <button className="primary-button checkout-button" onClick={onCheckout}>Proceed to Checkout</button>
          <button className="clear-button" onClick={onClear}>Clear Cart</button>
        </div>
      </aside>
    </>
  );
}
