// Button.js
import React from "react";

export default function Button({ label, onClick, variant = "primary", className }) {
  return (
    <button
      onClick={onClick}
      className={`${variant === "primary" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"} px-4 py-2 rounded ${className}`}
    >
      {label}
    </button>
  );
}
