// apps/mobile/src/screens/SignUpScreen.js
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import Input from "../components/Input";
import Button from "../components/Button";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("회원가입 성공!");
      navigation.goBack(); // 로그인 화면으로 이동
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Input placeholder="이메일" value={email} onChangeText={setEmail} />
      <Input placeholder="비밀번호" value={password} secureTextEntry onChangeText={setPassword} style={{ marginTop: 12 }} />
      <Button label="회원가입" onPress={handleSignUp} style={{ marginTop: 12 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
});
