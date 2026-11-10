// Sample (dummy) content for the profile pages: Deals & Offers, Need Help, Terms & Conditions

export const OFFERS = [
  { code: "FIRST50", icon: "🎉", tag: "New users", title: "Flat 50% OFF up to ₹100", text: "On your first order above ₹199.", valid: "Valid till 31 Dec 2026" },
  { code: "BIRYANI20", icon: "🍚", tag: "Biryani", title: "20% OFF on all biryanis", text: "On orders above ₹250.", valid: "Valid till 30 Nov 2026" },
  { code: "FREEDEL", icon: "🛵", tag: "Delivery", title: "Free delivery", text: "On orders above ₹299.", valid: "Valid till 31 Dec 2026" },
  { code: "SWEET15", icon: "🍰", tag: "Desserts", title: "15% OFF on desserts", text: "Gulab Jamun, Rasmalai, Brownies and more.", valid: "Valid till 15 Dec 2026" },
  { code: "PIZZA100", icon: "🍕", tag: "Pizza", title: "₹100 OFF on pizzas", text: "When you order 2 or more pizzas.", valid: "Valid till 31 Dec 2026" },
  { code: "WEEKEND10", icon: "🎁", tag: "Weekend", title: "Extra 10% OFF on weekends", text: "Every Saturday and Sunday, on all dishes.", valid: "Every weekend" }
];

export const FAQS = [
  ["How do I track my order?", "Open the profile menu and tap Track Order, or press Track order on an active order in Order History. The status updates by itself every 30 seconds to 2 minutes."],
  ["How long does delivery take?", "In this demo an order goes from confirmed to delivered in about 10 minutes."],
  ["How do I reorder a meal?", "Open Order History and press Reorder. The same dishes are added back to your cart."],
  ["How do I rate my order?", "Once an order is delivered, press Rate order to rate each dish and your delivery partner."],
  ["Can I cancel an order?", "Cancellation is not available in this demo. Please contact support with your order ID."],
  ["Which payment methods can I use?", "UPI, Card and Cash on Delivery. Payments are a demo: nothing is charged and card details are never stored."],
  ["Why can't I change my verified email or mobile number?", "Verified contact details are used to log in, so they are locked. Contact support if you really need a change."]
];

export const CONTACT = {
  email: "support@foodiehub.com",
  phone: "+91 98765 43210",
  hours: "Every day, 9 AM to 11 PM"
};

export const TERMS = [
  ["1. Using FoodieHub", "By using this website you agree to these terms. FoodieHub is a demo project and the dishes, prices, offers and delivery times shown are samples."],
  ["2. Orders and payments", "An order is confirmed when you complete checkout. Payment options (UPI, Card, Cash on Delivery) are for demonstration only: no money is charged and card or UPI details are not stored."],
  ["3. Delivery", "Delivery times are estimates. In this demo an order is marked delivered about 10 minutes after it is placed. Please keep your phone reachable for your delivery partner."],
  ["4. Cancellations and refunds", "Orders cannot be cancelled in this demo. In a live service, refunds would follow the restaurant's policy and be shown here."],
  ["5. Accounts and OTP", "You sign up and log in with a one-time password sent to your mobile number or email. Do not share your OTP with anyone. A verified mobile number or email cannot be changed."],
  ["6. Location", "If you allow it, your location is used only to suggest a delivery address. You can type an address or choose a city instead."],
  ["7. Ratings", "You can rate the food and the delivery partner once an order is delivered. Ratings can be used to improve the service."],
  ["8. Changes to these terms", "These sample terms may change. Continuing to use the website means you accept the updated terms."]
];
