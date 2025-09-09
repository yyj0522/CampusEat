import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";

export function Button({ label, onPress, variant = "primary", style, textStyle }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <Text style={[styles.text, variant === "primary" ? styles.textPrimary : styles.textSecondary, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  primary: {
    backgroundColor: "#2563EB",
  },
  secondary: {
    backgroundColor: "#E5E7EB",
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
  },
  textPrimary: {
    color: "#FFFFFF",
  },
  textSecondary: {
    color: "#111827",
  },
});
