// Shown when a dish picture is missing or fails to load
export const FOOD_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#fff1e8"/><text x="50%" y="52%" font-size="90" text-anchor="middle" dominant-baseline="middle">🍽️</text></svg>'
  );

export const dishSrc = image => image || FOOD_FALLBACK;
