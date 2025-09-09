import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Animated, Easing } from "react-native";
import Button from "./Button";
import Input from "./Input";

export default function LoginScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(0)).current;
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start(() => {
      Animated.timing(moveAnim, { toValue: -150, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
        setShowLogin(true);
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: moveAnim }] }]}>
        <Image source={require("./icon.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>캠퍼스잇</Text>
      </Animated.View>

      {showLogin && (
        <View style={styles.loginContainer}>
          <Input placeholder="이메일" />
          <Input placeholder="비밀번호" secureTextEntry style={{ marginTop: 12 }} />
          <Button label="로그인" onPress={() => alert("로그인 시도")} style={{ marginTop: 12 }} />
          <Button label="회원가입" variant="secondary" onPress={() => alert("회원가입 이동")} style={{ marginTop: 8 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 24 },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  logo: { width: 80, height: 80 },
  title: { fontSize: 36, fontWeight: "800", marginTop: 8 },
  loginContainer: { width: "100%", marginTop: 40 },
});
