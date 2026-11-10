"use client";

import { CONTACT, FAQS, OFFERS, TERMS } from "../lib/content";

const TITLES = { offers: "Deals & Offers 🏷️", help: "Need Help? 💬", terms: "Terms & Conditions 📄" };

export default function InfoModal({ kind, onClose, showToast }) {
  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Code ${code} copied ✓`);
    } catch {
      showToast(`Your code: ${code}`);
    }
  }

  function openBot() {
    onClose();
    window.dispatchEvent(new Event("open-foodiebot"));
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <button className="close-button modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 id="info-title">{TITLES[kind]}</h2>

        {kind === "offers" && (
          <>
            <p className="info-note">Sample offers for this demo. Codes are not applied at checkout yet.</p>
            {OFFERS.map(o => (
              <div className="offer-card" key={o.code}>
                <div className="offer-icon">{o.icon}</div>
                <div>
                  <span className="offer-tag">{o.tag}</span>
                  <h3>{o.title}</h3>
                  <p>{o.text}</p>
                  <p>{o.valid}</p>
                  <div className="offer-code">
                    <code>{o.code}</code>
                    <button type="button" className="link-btn" onClick={() => copy(o.code)}>Copy code</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {kind === "help" && (
          <>
            {FAQS.map(([q, a]) => (
              <details className="faq" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
            <div className="contact-card">
              <strong>Still need help?</strong>
              <p>✉️ {CONTACT.email}</p>
              <p>📞 {CONTACT.phone}</p>
              <p>🕘 {CONTACT.hours}</p>
              <button type="button" className="primary-button pay-button" onClick={openBot}>🤖 Chat with FoodieBot</button>
            </div>
          </>
        )}

        {kind === "terms" && (
          <div className="terms-sec">
            <p className="info-note">Sample terms for a demo project.</p>
            {TERMS.map(([title, text]) => (
              <div key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
