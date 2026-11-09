"use client";

import { useEffect, useRef, useState } from "react";
import { API } from "../lib/api";

const SUGGESTIONS = [
  "Veg biryani under ₹200",
  "Something sweet",
  "Best burger",
  "Light South Indian breakfast"
];

const GREETING = {
  role: "assistant",
  content: "Hi! I'm FoodieBot 🍽️ Tell me what you're craving, your budget, or whether you want veg, and I'll suggest dishes from our menu."
};

export default function AssistantChat({ foods, onAdd }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const endRef = useRef();

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Changes the last (assistant) message while the answer is streaming in
  function patchLast(change) {
    setMessages(m => {
      const copy = m.slice();
      copy[copy.length - 1] = change({ ...copy[copy.length - 1] });
      return copy;
    });
  }

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || busy) return;

    // The greeting is not part of the conversation sent to the server
    const history = messages.slice(1).filter(m => m.content).map(({ role, content }) => ({ role, content }));

    setMessages(m => [...m, { role: "user", content: message }, { role: "assistant", content: "", dishes: [] }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch(`${API}/api/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }

      // The server sends one JSON object per line: first the dishes, then the text in pieces
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          patchLast(last => {
            if (event.dishes) last.pending = event.dishes; // shown after the text is finished
            if (event.delta) last.content += event.delta;
            return last;
          });
        }
      }

      // The text is finished: now show the dish cards under it
      patchLast(last => ({ ...last, dishes: last.pending || [] }));
    } catch (err) {
      patchLast(last => ({ ...last, content: err.message || "Something went wrong." }));
    }
    setBusy(false);
  }

  if (!open) {
    return (
      <button className="bot-fab" onClick={() => setOpen(true)} aria-label="Ask FoodieBot">
        🤖 <span>Ask FoodieBot</span>
      </button>
    );
  }

  return (
    <div className="bot-panel" role="dialog" aria-label="FoodieBot assistant">
      <div className="bot-header">
        <strong>🤖 FoodieBot</strong>
        <button className="close-button" onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
      </div>

      <div className="bot-messages">
        {messages.map((m, i) => (
          <div key={i} className={`bot-msg ${m.role === "user" ? "user" : "bot"}`}>
            <p>{m.content || (busy && i === messages.length - 1 ? "Thinking…" : "")}</p>

            {m.dishes && m.dishes.length > 0 && (
              <div className="bot-dishes">
                {m.dishes.map(d => {
                  const food = foods.find(f => f.id === d.id);
                  return (
                    <div className="bot-dish" key={d.id}>
                      <span>{d.name} · ₹{d.price}</span>
                      {food && <button className="add-button" onClick={() => onAdd(food)}>Add +</button>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {messages.length === 1 && (
          <div className="bot-chips">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form className="bot-input" onSubmit={e => { e.preventDefault(); send(); }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. spicy non-veg under ₹250"
          maxLength={300}
          aria-label="Message FoodieBot"
        />
        <button type="submit" className="primary-button" disabled={busy || !input.trim()}>Send</button>
      </form>
    </div>
  );
}