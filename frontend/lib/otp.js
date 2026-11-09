import { useEffect, useState } from "react";

// Counts down from a number of seconds (used for the "Resend OTP" timer)
export function useCountdown() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return [left, setLeft];
}

export const fmt = seconds =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;