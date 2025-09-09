// Input.js
import React from "react";

export default function Input({ className, ...props }) {
  return (
    <input
      className={`w-full border border-gray-300 rounded px-3 py-2 ${className}`}
      {...props}
    />
  );
}
