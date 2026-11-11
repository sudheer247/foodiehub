"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import CartPanel from "../components/CartPanel";
import CheckoutModal from "../components/CheckoutModal";
import OrdersModal from "../components/OrdersModal";
import TrackModal from "../components/TrackModal";
import InfoModal from "../components/InfoModal";
import AuthModal from "../components/AuthModal";
import AccountModal from "../components/AccountModal";
import AssistantChat from "../components/AssistantChat";
import LocationModal from "../components/LocationModal";
import { detectLocation } from "../lib/location";

const MAX_QTY = 10;
const CATEGORIES = [
  ["All", "🍽️"], ["Biryani", "🍚"], ["Pizza", "🍕"],
  ["Burger", "🍔"], ["South Indian", "🥞"], ["Dessert", "🍰"]
];
const EMOJI = { Biryani: "🍚", Pizza: "🍕", Burger: "🍔", "South Indian": "🥞", Dessert: "🍰" };

function placeholder(category) {
  const emoji = EMOJI[category] || "🍽️";
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400"><rect width="100%" height="100%" fill="#fff1e8"/><text x="50%" y="50%" font-size="110" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`
    )
  );
}

export default function Home() {
  const [foods, setFoods] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [modal, setModal] = useState(null); // "auth" | "checkout" | "orders" | null
  const [auth, setAuth] = useState(null); // { token, user }
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const toastTimer = useRef();
  const pendingCheckout = useRef(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const profileRef = useRef();
  const [location, setLocation] = useState(null); // { label, address }
  const [locGuess, setLocGuess] = useState(null); // approximate location waiting for confirmation
  const [trackId, setTrackId] = useState(null);   // order shown in Track Order (null = newest active order)
  const [infoKind, setInfoKind] = useState("offers"); // offers | help | terms

  useEffect(() => {
    if (!ready) return;
    if (location) localStorage.setItem("foodiehub-location", JSON.stringify(location));
    else localStorage.removeItem("foodiehub-location");
  }, [location, ready]);

  // Load saved cart + login, then load the menu from the backend
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("foodiehub-cart") || "[]");
      if (Array.isArray(saved)) {
        setCart(saved.filter(i => Number.isInteger(i.id) && Number.isInteger(i.quantity) && i.quantity > 0));
      }
      const savedAuth = JSON.parse(localStorage.getItem("foodiehub-auth") || "null");
      if (savedAuth && savedAuth.token) setAuth(savedAuth);
      const savedLoc = JSON.parse(localStorage.getItem("foodiehub-location") || "null");
      if (savedLoc && savedLoc.label) setLocation(savedLoc);
    } catch {}
    setReady(true);

    api("/foods")
      .then(setFoods)
      .catch(() => setLoadError("Could not load the menu. Is the backend running?"));
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("foodiehub-cart", JSON.stringify(cart));
  }, [cart, ready]);

  useEffect(() => {
    if (!ready) return;
    if (auth) localStorage.setItem("foodiehub-auth", JSON.stringify(auth));
    else localStorage.removeItem("foodiehub-auth");
  }, [auth, ready]);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  useEffect(() => {
    const onKey = e => {
      if (e.key !== "Escape") return;
      setProfileOpen(false);
      if (modal) closeModal();
      else setCartOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal]);

  useEffect(() => {
    document.body.style.overflow = cartOpen || modal ? "hidden" : "";
  }, [cartOpen, modal]);

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }

  function closeModal() {
    pendingCheckout.current = false;
    setLocGuess(null);
    setModal(null);
  }

  const lines = useMemo(
    () => cart.map(i => ({ ...i, food: foods.find(f => f.id === i.id) })).filter(l => l.food),
    [cart, foods]
  );
  const total = lines.reduce((s, l) => s + l.food.price * l.quantity, 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const qtyOf = id => (cart.find(i => i.id === id) || { quantity: 0 }).quantity;

  const visibleFoods = foods.filter(f => {
    const q = search.trim().toLowerCase();
    return (category === "All" || f.category === category) &&
      (f.name.toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q));
  });

  function addToCart(food) {
    const existing = cart.find(i => i.id === food.id);
    if (existing && existing.quantity >= MAX_QTY) {
      showToast(`Maximum ${MAX_QTY} of each item per order`);
      return;
    }
    setCart(prev =>
      existing
        ? prev.map(i => (i.id === food.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { id: food.id, quantity: 1 }]
    );
    showToast(`${food.name} added to cart ✓`);
  }

  function changeQty(id, delta) {
    setCart(prev =>
      prev.flatMap(i => {
        if (i.id !== id) return [i];
        const q = i.quantity + delta;
        return q <= 0 ? [] : [{ ...i, quantity: Math.min(MAX_QTY, q) }];
      })
    );
  }

  function reorder(items) {
    setCart(prev =>
      items.reduce((acc, it) => {
        if (!foods.some(f => f.id === it.id)) return acc;
        const ex = acc.find(i => i.id === it.id);
        const q = Math.min(MAX_QTY, (ex ? ex.quantity : 0) + it.quantity);
        return ex ? acc.map(i => (i.id === it.id ? { ...i, quantity: q } : i)) : [...acc, { id: it.id, quantity: q }];
      }, prev)
    );
    setModal(null);
    setCartOpen(true);
    showToast("Items added to your cart ✓");
  }

  function startCheckout() {
    if (!lines.length) return showToast("Your cart is empty. Please add some food first.");
    setCartOpen(false);
    if (auth) setModal("checkout");
    else {
      pendingCheckout.current = true;
      setAuthMode("login");
      setModal("auth");
    }
  }

  function handleAuth(data) {
    setAuth(data);
    showToast(data.user.name === "Customer" ? "Welcome! Add your name in My Account." : `Welcome, ${data.user.name}!`);
    if (pendingCheckout.current) {
      pendingCheckout.current = false;
      setModal("checkout");
    } else setModal(null);
  }

  function saveLocation(loc) {
    setLocation(loc);
    setLocGuess(null);
    setModal(null);
    showToast(loc ? `Delivering to ${loc.label} 📍` : "Location removed");
  }

  async function detectNow() {
    showToast("Detecting your location…");
    try {
      const loc = await detectLocation();
      if (loc.accuracy > 3000) {
        setLocGuess(loc); // only a rough guess from the browser: let the customer confirm
        setModal("location");
      } else {
        saveLocation(loc);
      }
    } catch (err) {
      showToast(err.message);
      setModal("location");
    }
  }

  function fromProfile(action) {
    setProfileOpen(false);
    action();
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setModal("auth");
  }

  function openAccount() {
    if (auth) setModal("account");
  }

  function openOrders() {
    if (auth) setModal("orders");
    else openAuth("login");
  }

  function openTrack(id) {
    if (!auth) return openAuth("login");
    setTrackId(typeof id === "string" ? id : null);
    setModal("track");
  }

  function openInfo(kind) {
    setInfoKind(kind);
    setModal("info");
  }

  return (
    <>
      <div className="location-bar">
        <button className="location-trigger" onClick={() => setModal("location")}>
          <span className={`loc-title${location ? " set" : ""}`}>📍 {location ? location.label : "No Location"} ▾</span>
          <small>{location ? location.address : "Exact Location Required!"}</small>
        </button>
      </div>

      <header className="navbar">
        <a href="#home" className="logo" aria-label="FoodieHub home">
          <svg viewBox="0 0 32 32" width="36" height="36" aria-hidden="true">
            <circle cx="16" cy="16" r="16" fill="#ff5722" />
            <path d="M7 21 A9 9 0 0 1 25 21 Z" fill="#fff" />
            <rect x="5" y="22.5" width="22" height="2.5" rx="1.25" fill="#fff" />
            <circle cx="16" cy="10.5" r="1.6" fill="#fff" />
          </svg>
          <span>FoodieHub</span>
        </a>

        <nav aria-label="Main">
          <a href="#home">Home</a>
          <div className="nav-dropdown">
            <a href="#menu" aria-haspopup="true">Menu ▾</a>
            <div className="dropdown-panel">
              {CATEGORIES.filter(([name]) => name !== "All").map(([name, icon]) => (
                <a key={name} href="#menu" onClick={() => setCategory(name)}>
                  {icon} {name}
                </a>
              ))}
              <a href="#menu" onClick={() => setCategory("All")}>🍽️ View all</a>
            </div>
          </div>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="nav-actions">
          <button className="cart-button" onClick={() => setCartOpen(true)} aria-expanded={cartOpen}>
            🛒 Cart ({count})
          </button>

          <div className="profile" ref={profileRef}>
            <button
              className="profile-button"
              onClick={() => setProfileOpen(o => !o)}
              aria-label="Profile"
              aria-expanded={profileOpen}
            >
              {auth ? (
                auth.user.name.charAt(0).toUpperCase()
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
                </svg>
              )}
            </button>

            {profileOpen && (
              <div className="profile-panel">
                <div className="profile-head">
                  <div className="profile-top">
                    <div className="profile-avatar">{auth ? auth.user.name.charAt(0).toUpperCase() : "👤"}</div>
                    <div className="profile-info">
                      {auth ? (
                        <>
                          <strong>{auth.user.name}</strong>
                          <small>{auth.user.email || (auth.user.phone ? `+91 ${auth.user.phone}` : "")}</small>
                        </>
                      ) : (
                        <>
                          <small>Login for</small>
                          <strong>Saved orders &amp; faster checkout</strong>
                        </>
                      )}
                    </div>
                  </div>

                  {!auth && (
                    <div className="profile-actions">
                      <button className="login-btn" onClick={() => fromProfile(() => openAuth("login"))}>Login</button>
                      <button className="signup-btn" onClick={() => fromProfile(() => openAuth("signup"))}>Sign Up</button>
                    </div>
                  )}
                </div>

                <ul className="profile-menu">
                  {auth && (
                    <li><button onClick={() => fromProfile(openAccount)}>👤 My Account</button></li>
                  )}
                  <li><button onClick={() => fromProfile(() => openInfo("offers"))}>🏷️ Deals &amp; Offers</button></li>
                  <li><button onClick={() => fromProfile(() => openTrack())}>🚚 Track Order</button></li>
                  <li><button onClick={() => fromProfile(openOrders)}>📦 Order History</button></li>
                  <li><button onClick={() => fromProfile(() => openInfo("help"))}>💬 Need Help?</button></li>
                  <li><button onClick={() => fromProfile(() => openInfo("terms"))}>📄 Terms &amp; Conditions</button></li>
                  {auth && (
                    <li>
                      <button className="logout-item" onClick={() => fromProfile(() => { setAuth(null); showToast("Logged out"); })}>
                        🚪 Logout
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {!location && (
        <div className="location-banner">
          <div className="loc-pin">📍</div>
          <p>Give us your exact location<br />for seamless delivery</p>
          <button onClick={detectNow}>Detect location</button>
        </div>
      )}

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="subtitle">WELCOME TO FOODIEHUB</p>
          <h1>Delicious Food,<br />Delivered To Your Door</h1>
          <p>Discover your favorite dishes and enjoy delicious meals delivered straight to your home.</p>
          <a href="#menu" className="primary-button">Explore Menu</a>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=85"
            alt="Delicious pizza"
          />
        </div>
      </section>

      <section className="categories">
        <h2>Explore Categories</h2>
        <div className="category-list">
          {CATEGORIES.map(([name, icon]) => (
            <button
              key={name}
              className={`category-btn${category === name ? " active" : ""}`}
              onClick={() => setCategory(name)}
            >
              {icon} {name}
            </button>
          ))}
        </div>
      </section>

      <section className="menu-section" id="menu">
        <div className="section-heading">
          <div>
            <p className="subtitle">OUR MENU</p>
            <h2>Popular Dishes</h2>
          </div>
          <input
            type="search"
            id="search-input"
            placeholder="Search your favorite food..."
            aria-label="Search food"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="food-grid">
          {loadError && <p className="empty-message loading-note">{loadError}</p>}
          {visibleFoods.map(food => (
            <article className="food-card" key={food.id}>
              <img
                src={food.image || placeholder(food.category)}
                alt={food.name}
                loading="lazy"
                onError={e => { e.currentTarget.src = placeholder(food.category); }}
              />
              <div className="food-info">
                <h3>{food.name}</h3>
                <p className="food-description">{food.description}</p>
                <p className="food-rating">⭐ {food.rating} / 5</p>
                <div className="food-bottom">
                  <span className="food-price">₹{food.price}</span>
                  {qtyOf(food.id) === 0 ? (
                    <button className="add-button" onClick={() => addToCart(food)}>Add +</button>
                  ) : (
                    <div className="card-stepper">
                      <button onClick={() => changeQty(food.id, -1)} aria-label={`Decrease ${food.name} quantity`}>−</button>
                      <span>{qtyOf(food.id)}</span>
                      <button onClick={() => addToCart(food)} aria-label={`Increase ${food.name} quantity`}>+</button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {!loadError && foods.length > 0 && visibleFoods.length === 0 && (
          <p className="empty-message">No food items found. Try another search.</p>
        )}
      </section>

      <CartPanel
        open={cartOpen}
        lines={lines}
        total={total}
        onClose={() => setCartOpen(false)}
        onQty={changeQty}
        onRemove={id => setCart(prev => prev.filter(i => i.id !== id))}
        onClear={() => lines.length && confirm("Are you sure you want to clear your cart?") && setCart([])}
        onCheckout={startCheckout}
      />

      {modal === "location" && <LocationModal current={location} guess={locGuess} onSave={saveLocation} onClose={closeModal} />}
      {modal === "auth" && <AuthModal initialMode={authMode} onClose={closeModal} onAuth={handleAuth} />}
      {modal === "checkout" && auth && (
        <CheckoutModal
          lines={lines}
          defaultAddress={location ? location.address : ""}
          total={total}
          auth={auth}
          onClose={closeModal}
          onPlaced={() => setCart([])}
          onViewOrders={() => setModal("orders")}
          onTrack={openTrack}
        />
      )}
      {modal === "account" && auth && (
        <AccountModal
          auth={auth}
          onClose={closeModal}
          onUserChange={u => setAuth(prev => ({ ...prev, user: { ...prev.user, ...u } }))}
          showToast={showToast}
        />
      )}
      {modal === "orders" && auth && (
        <OrdersModal auth={auth} onClose={closeModal} onReorder={reorder} onTrack={openTrack} />
      )}
      {modal === "track" && auth && (
        <TrackModal auth={auth} orderId={trackId} onClose={closeModal} onViewOrders={() => setModal("orders")} />
      )}
      {modal === "info" && <InfoModal kind={infoKind} onClose={closeModal} showToast={showToast} />}

      <section className="about-section" id="about">
        <div>
          <p className="subtitle">ABOUT FOODIEHUB</p>
          <h2>Good Food Makes<br />Every Moment Better</h2>
        </div>
        <p>
          FoodieHub is a food ordering website designed to help customers explore delicious meals in
          one convenient place. Find your favorite dishes, add them to your cart, and enjoy a simple
          ordering experience.
        </p>
      </section>

      <section className="contact-section" id="contact">
        <h2>Contact Us</h2>
        <p>Have questions? We would love to hear from you.</p>
        <p>Email: support@foodiehub.com</p>
      </section>

      <footer>
        <p>© 2026 FoodieHub.</p>
      </footer>

      <AssistantChat foods={foods} onAdd={addToCart} />

      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}