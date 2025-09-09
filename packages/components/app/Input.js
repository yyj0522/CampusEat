import { TextInput, View, Text, StyleSheet } from "react-native";

export function Input({ error, style, ...props }) {
  return (
    <View style={{ width: "100%", marginBottom: 12 }}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});
