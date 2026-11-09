export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong.");
    err.data = data;
    throw err;
  }
  return data;
}