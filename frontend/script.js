// Food data
const foods = [
    {
        id: 1,
        name: "Chicken Biryani",
        category: "Biryani",
        price: 220,
        rating: 4.8,
        description: "Aromatic rice cooked with delicious chicken.",
        image: "https://th.bing.com/th/id/OIP.0csI89pXHQSxumqiZz_tIwHaE8?w=284&h=189&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3"
    },
    {
        id: 2,
        name: "Veg Biryani",
        category: "Biryani",
        price: 160,
        rating: 4.5,
        description: "Flavorful basmati rice with fresh vegetables.",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 3,
        name: "Margherita Pizza",
        category: "Pizza",
        price: 199,
        rating: 4.7,
        description: "Classic pizza with cheese and tomato.",
        image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 4,
        name: "Chicken Burger",
        category: "Burger",
        price: 150,
        rating: 4.6,
        description: "Juicy chicken burger with fresh vegetables.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 5,
        name: "Masala Dosa",
        category: "South Indian",
        price: 80,
        rating: 4.5,
        description: "Crispy dosa served with chutney and sambar.",
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 6,
        name: "Chocolate Cake",
        category: "Dessert",
        price: 120,
        rating: 4.9,
        description: "Rich chocolate cake for sweet lovers.",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 7,
        name: "Cheese Burger",
        category: "Burger",
        price: 130,
        rating: 4.4,
        description: "A tasty burger loaded with melted cheese.",
        image: "https://tornadoughalli.com/wp-content/uploads/2023/06/THE-BEST-CHEESEBURGER-RECIPE-FINALS-3-1.jpg"
    },
    {
        id: 8,
        name: "Paneer Pizza",
        category: "Pizza",
        price: 240,
        rating: 4.7,
        description: "Delicious pizza topped with paneer and cheese.",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 9,
        name: "Gulab Jamun",
        category: "Dessert",
        price: 70,
        rating: 4.6,
        description: "Soft, sweet dumplings in sugar syrup.",
        image: "https://www.bing.com/th/id/OIP.CGlAEcWrM3S0b_3-kdzLlQHaHa?w=193&h=193&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=ImgAns&rm=2"
    }
];

// Restore cart from Local Storage
let cart = [];
 
try {
    const savedCart = JSON.parse(
        localStorage.getItem("foodiehub-cart") || "[]"
    );
 
    if (Array.isArray(savedCart)) {
        cart = savedCart.filter(item =>
            foods.some(food => food.id === item.id) &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
        );
    }
} catch (error) {
    cart = [];
}
 
let selectedCategory = "All";
 
const MAX_QUANTITY = 10;
const FALLBACK_IMAGE =
    "data:image/svg+xml;utf8," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400">' +
        '<rect width="100%" height="100%" fill="#fff1e8"/>' +
        '<text x="50%" y="50%" font-size="80" text-anchor="middle" ' +
        'dominant-baseline="middle">🍽️</text></svg>'
    );
 
// Toast notification
let toastTimer;
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}
 
// Render food cards
function displayFoods(items) {
    const foodGrid = document.getElementById("food-grid");
    const emptyMessage = document.getElementById("empty-message");
 
    foodGrid.innerHTML = "";
 
    emptyMessage.hidden = items.length !== 0;
 
    items.forEach(food => {
        const card = document.createElement("article");
        card.className = "food-card";
 
        const image = document.createElement("img");
        image.src = food.image;
        image.alt = food.name;
        image.loading = "lazy";
 
        image.addEventListener("error", () => {
            image.src = FALLBACK_IMAGE;
        });
 
        const info = document.createElement("div");
        info.className = "food-info";
 
        const name = document.createElement("h3");
        name.textContent = food.name;
 
        const description = document.createElement("p");
        description.className = "food-description";
        description.textContent = food.description;
 
        const rating = document.createElement("p");
        rating.className = "food-rating";
        rating.textContent = `⭐ ${food.rating} / 5`;
 
        const bottom = document.createElement("div");
        bottom.className = "food-bottom";
 
        const price = document.createElement("span");
        price.className = "food-price";
        price.textContent = `₹${food.price}`;
 
        const button = document.createElement("button");
        button.className = "add-button";
        button.textContent = "Add +";
 
        button.addEventListener("click", () => {
            addToCart(food.id);
        });
 
        bottom.append(price, button);
        info.append(name, description, rating, bottom);
        card.append(image, info);
 
        foodGrid.appendChild(card);
    });
}
 
// Search and category filtering
function updateFoodDisplay() {
    const searchValue = document
        .getElementById("search-input")
        .value.trim()
        .toLowerCase();
 
    const filteredFoods = foods.filter(food => {
        const matchesCategory =
            selectedCategory === "All" ||
            food.category === selectedCategory;
 
        const matchesSearch =
            food.name.toLowerCase().includes(searchValue) ||
            food.description.toLowerCase().includes(searchValue);
 
        return matchesCategory && matchesSearch;
    });
 
    displayFoods(filteredFoods);
}
 
// Filter category
function filterCategory(category, button) {
    selectedCategory = category;
 
    document.querySelectorAll(".category-btn").forEach(btn => {
        btn.classList.remove("active");
    });
 
    button.classList.add("active");
 
    updateFoodDisplay();
}
 
// Save cart
function saveCart() {
    localStorage.setItem("foodiehub-cart", JSON.stringify(cart));
}
 
// Add food to cart
function addToCart(foodId) {
    const existingItem = cart.find(item => item.id === foodId);
 
    const food = foods.find(f => f.id === foodId);
 
    if (existingItem) {
        if (existingItem.quantity >= MAX_QUANTITY) {
            showToast(`Maximum ${MAX_QUANTITY} of each item per order`);
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            id: foodId,
            quantity: 1
        });
    }
 
    saveCart();
    updateCart();
 
    showToast(`${food.name} added to cart ✓`);
 
    const count = document.getElementById("cart-count");
    count.classList.remove("bump");
    void count.offsetWidth;
    count.classList.add("bump");
}
 
// Change quantity
function changeQuantity(foodId, change) {
    const item = cart.find(item => item.id === foodId);
 
    if (!item) return;
 
    if (change > 0 && item.quantity >= MAX_QUANTITY) {
        showToast(`Maximum ${MAX_QUANTITY} of each item per order`);
        return;
    }
 
    item.quantity += change;
 
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== foodId);
    }
 
    saveCart();
    updateCart();
}
 
// Remove item
function removeFromCart(foodId) {
    cart = cart.filter(item => item.id !== foodId);
 
    saveCart();
    updateCart();
}
 
// Clear cart
function clearCart() {
    if (cart.length === 0) return;
 
    if (confirm("Are you sure you want to clear your cart?")) {
        cart = [];
        saveCart();
        updateCart();
    }
}
 
// Render cart
function updateCart() {
    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");
 
    cartItems.innerHTML = "";
 
    const totalQuantity = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );
 
    const totalPrice = cart.reduce((total, item) => {
        const food = foods.find(food => food.id === item.id);
 
        return total + food.price * item.quantity;
    }, 0);
 
    cartCount.textContent = totalQuantity;
    cartTotal.textContent = `₹${totalPrice}`;
 
    if (cart.length === 0) {
        cartItems.textContent = "Your cart is empty.";
        return;
    }
 
    cart.forEach(item => {
        const food = foods.find(food => food.id === item.id);
 
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
 
        const details = document.createElement("div");
 
        const name = document.createElement("h4");
        name.textContent = food.name;
 
        const price = document.createElement("p");
        price.textContent = `₹${food.price * item.quantity}`;
 
        const controls = document.createElement("div");
        controls.className = "quantity-controls";
 
        const decrease = document.createElement("button");
        decrease.textContent = "−";
        decrease.setAttribute(
            "aria-label",
            `Decrease ${food.name} quantity`
        );
        decrease.addEventListener("click", () => {
            changeQuantity(food.id, -1);
        });
 
        const quantity = document.createElement("span");
        quantity.textContent = item.quantity;
 
        const increase = document.createElement("button");
        increase.textContent = "+";
        increase.setAttribute(
            "aria-label",
            `Increase ${food.name} quantity`
        );
        increase.addEventListener("click", () => {
            changeQuantity(food.id, 1);
        });
 
        controls.append(decrease, quantity, increase);
 
        const remove = document.createElement("button");
        remove.className = "remove-button";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
            removeFromCart(food.id);
        });
 
        details.append(name, price, controls, remove);
        cartItem.appendChild(details);
 
        cartItems.appendChild(cartItem);
    });
}
 
// Show or hide cart
function toggleCart(forceOpen) {
    const panel = document.getElementById("cart-panel");
    const backdrop = document.getElementById("cart-backdrop");
    const open = typeof forceOpen === "boolean" ? forceOpen : panel.hidden;
 
    panel.hidden = !open;
    backdrop.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    document.getElementById("cart-button")
        .setAttribute("aria-expanded", String(open));
 
    if (open) {
        panel.querySelector(".close-button").focus();
    } else {
        document.getElementById("cart-button").focus();
    }
}
 
document.getElementById("cart-backdrop")
    .addEventListener("click", () => toggleCart(false));
 
document.addEventListener("keydown", event => {
    if (event.key === "Escape" &&
        !document.getElementById("cart-panel").hidden) {
        toggleCart(false);
    }
});
 
// Checkout
function getTotal() {
    return cart.reduce((sum, item) => {
        const food = foods.find(f => f.id === item.id);
        return sum + food.price * item.quantity;
    }, 0);
}
 
function checkout() {
    if (cart.length === 0) {
        showToast("Your cart is empty. Please add some food first.");
        return;
    }
 
    const summary = document.getElementById("order-summary");
    summary.innerHTML = "";
 
    cart.forEach(item => {
        const food = foods.find(f => f.id === item.id);
        const row = document.createElement("div");
        const label = document.createElement("span");
        const amount = document.createElement("span");
 
        label.textContent = `${food.name} × ${item.quantity}`;
        amount.textContent = `₹${food.price * item.quantity}`;
        row.append(label, amount);
        summary.appendChild(row);
    });
 
    const totalRow = document.createElement("div");
    totalRow.className = "summary-total";
    totalRow.innerHTML = "<span>Total</span><span></span>";
    totalRow.lastChild.textContent = `₹${getTotal()}`;
    summary.appendChild(totalRow);
 
    document.getElementById("checkout-form").hidden = false;
    document.getElementById("checkout-success").hidden = true;
    document.getElementById("form-error").textContent = "";
    updatePayUI();
 
    toggleCart(false);
    document.getElementById("checkout-modal").hidden = false;
    document.body.style.overflow = "hidden";
    document.querySelector("#checkout-form [name=name]").focus();
}
 
function closeCheckout() {
    document.getElementById("checkout-modal").hidden = true;
    document.body.style.overflow = "";
}
 
function updatePayUI() {
    const method = document.querySelector("[name=payment]:checked").value;
 
    ["upi", "card", "cod"].forEach(m => {
        document.getElementById(`pay-${m}`).hidden = m !== method;
    });
 
    document.getElementById("pay-button").textContent =
        method === "cod"
            ? `Place Order ₹${getTotal()}`
            : `Pay ₹${getTotal()}`;
}
 
function validateCheckout(form) {
    const f = form.elements;
    const method = f.payment.value;
 
    if (f.name.value.trim().length < 2) return "Please enter your full name.";
    if (!/^\d{10}$/.test(f.phone.value.trim())) return "Enter a valid 10-digit phone number.";
    if (f.address.value.trim().length < 5) return "Please enter your delivery address.";
 
    if (method === "upi" && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(f.upi.value.trim())) {
        return "Enter a valid UPI ID, like name@upi.";
    }
 
    if (method === "card") {
        if (f.cardNumber.value.replace(/\s/g, "").length !== 16) return "Card number must be 16 digits.";
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiry.value)) return "Enter expiry as MM/YY.";
        if (!/^\d{3}$/.test(f.cvv.value)) return "CVV must be 3 digits.";
    }
 
    return "";
}
 
const checkoutForm = document.getElementById("checkout-form");
 
checkoutForm.querySelectorAll("[name=payment]").forEach(radio => {
    radio.addEventListener("change", updatePayUI);
});
 
checkoutForm.elements.cardNumber.addEventListener("input", event => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
    event.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
});
 
checkoutForm.addEventListener("submit", event => {
    event.preventDefault();
 
    const error = validateCheckout(checkoutForm);
    document.getElementById("form-error").textContent = error;
    if (error) return;
 
    const total = getTotal();
    const method = checkoutForm.elements.payment.value;
    const methodName = { upi: "UPI", card: "Card", cod: "Cash on Delivery" }[method];
    const orderId = "FH" + Date.now().toString().slice(-6);
 
    document.getElementById("success-text").textContent =
        `Order ${orderId} · ₹${total} · ${methodName}. ` +
        "Your food is on its way (demo)!";
 
    orders.unshift({
        id: orderId,
        date: new Date().toISOString(),
        items: cart.map(item => {
            const food = foods.find(f => f.id === item.id);
            return { id: food.id, name: food.name, quantity: item.quantity };
        }),
        total: total,
        method: methodName
    });
    orders = orders.slice(0, 50);
    saveOrders();
 
    cart = [];
    saveCart();
    updateCart();
    checkoutForm.reset();
 
    checkoutForm.hidden = true;
    document.getElementById("checkout-success").hidden = false;
});
 
document.getElementById("checkout-modal").addEventListener("click", event => {
    if (event.target.id === "checkout-modal") closeCheckout();
});
 
document.addEventListener("keydown", event => {
    if (event.key === "Escape" &&
        !document.getElementById("checkout-modal").hidden) {
        closeCheckout();
    }
});
 
// Order history
let orders = [];
 
try {
    const savedOrders = JSON.parse(
        localStorage.getItem("foodiehub-orders") || "[]"
    );
 
    if (Array.isArray(savedOrders)) {
        orders = savedOrders.filter(order =>
            order && order.id && Array.isArray(order.items)
        );
    }
} catch (error) {
    orders = [];
}
 
function saveOrders() {
    localStorage.setItem("foodiehub-orders", JSON.stringify(orders));
}
 
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
 
function renderOrders() {
    const list = document.getElementById("orders-list");
    list.innerHTML = "";
    document.getElementById("clear-orders").hidden = orders.length === 0;
 
    if (orders.length === 0) {
        list.appendChild(
            el("p", "orders-empty", "You haven't placed any orders yet.")
        );
        return;
    }
 
    orders.forEach(order => {
        const card = el("div", "order-card");
 
        const head = el("div", "order-head");
        head.append(el("strong", "", order.id), el("span", "order-status", "✓ Placed"));
 
        const date = el("p", "order-date", new Date(order.date).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }));
 
        const items = el("ul", "order-items");
        order.items.forEach(item => {
            items.appendChild(el("li", "", `${item.name} × ${item.quantity}`));
        });
 
        const foot = el("div", "order-foot");
        const reorder = el("button", "add-button", "Reorder");
        reorder.addEventListener("click", () => reorderItems(order));
        foot.append(el("span", "order-total", `₹${order.total} · ${order.method}`), reorder);
 
        card.append(head, date, items, foot);
        list.appendChild(card);
    });
}
 
function openOrders() {
    if (!document.getElementById("cart-panel").hidden) toggleCart(false);
 
    renderOrders();
    document.getElementById("orders-modal").hidden = false;
    document.body.style.overflow = "hidden";
}
 
function closeOrders() {
    document.getElementById("orders-modal").hidden = true;
    document.body.style.overflow = "";
}
 
function clearOrders() {
    if (confirm("Delete your entire order history?")) {
        orders = [];
        saveOrders();
        renderOrders();
    }
}
 
function reorderItems(order) {
    let added = 0;
 
    order.items.forEach(item => {
        if (!foods.some(food => food.id === item.id)) return;
 
        const existing = cart.find(c => c.id === item.id);
 
        if (existing) {
            existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + item.quantity);
        } else {
            cart.push({ id: item.id, quantity: Math.min(MAX_QUANTITY, item.quantity) });
        }
        added++;
    });
 
    if (added === 0) {
        showToast("Those items are no longer available.");
        return;
    }
 
    saveCart();
    updateCart();
    closeOrders();
    toggleCart(true);
    showToast("Items added to your cart ✓");
}
 
document.getElementById("orders-modal").addEventListener("click", event => {
    if (event.target.id === "orders-modal") closeOrders();
});
 
document.addEventListener("keydown", event => {
    if (event.key === "Escape" &&
        !document.getElementById("orders-modal").hidden) {
        closeOrders();
    }
});
 
// Search event
document
    .getElementById("search-input")
    .addEventListener("input", updateFoodDisplay);
 
// Initial page setup
displayFoods(foods);
updateCart();
 