// apps/mobile/src/screens/LoginScreen.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Animated, Easing } from "react-native";
import Button from "../components/Button"; // components 폴더 위치 확인
import Input from "../components/Input";   // components 폴더 위치 확인
import { auth } from "../firebase";       // firebase.js 경로 확인
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(0)).current;
  const [showLogin, setShowLogin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 로고 애니메이션
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(moveAnim, {
        toValue: -50,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setShowLogin(true);
      });
    });
  }, []);

  // 로그인 핸들러
  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("로그인 성공!");
      // TODO: 로그인 후 화면 이동
      // navigation.navigate("Home");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ translateY: moveAnim }] },
        ]}
      >
        {/* 로컬 이미지가 없으면 임시 URL 사용 가능 */}
        <Image
          source={
            require("../assets/icon.png") // 실제 파일 존재 여부 확인
            // 또는 테스트용: { uri: "https://via.placeholder.com/160" }
          }
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>캠퍼스잇</Text>
      </Animated.View>

      {showLogin && (
        <View style={styles.loginContainer}>
          <Input
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            placeholder="비밀번호"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            style={{ marginTop: 12 }}
          />
          <Button
            label="로그인"
            onPress={handleLogin}
            style={{ marginTop: 12 }}
          />
          <Button
            label="회원가입"
            variant="secondary"
            onPress={() => navigation.navigate("SignUp")}
            style={{ marginTop: 8 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 24 },
  logoContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, marginLeft: -55 },
  logo: { width: 160, height: 160 },
  title: { fontSize: 60, fontWeight: "800", marginLeft: -30 },
  loginContainer: { width: "100%", marginTop: 40 },
});
