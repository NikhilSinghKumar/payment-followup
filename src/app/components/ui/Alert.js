"use client";

import { useEffect, useState } from "react";

export default function Alert({ success, error }) {
  const [hidden, setHidden] = useState(false);

  const message = error || success;

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!message || hidden) return null;

  return (
    <div
      className={`mb-2 p-2 rounded ${
        error ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
      }`}
    >
      {message}
    </div>
  );
}
