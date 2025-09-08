import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>CampusEat!</Text>
      <Text style={styles.subtitle}>대학생을 위한 종합 캠퍼스 플랫폼!</Text>
      <Text style={styles.subtitleSmall}>(맛집 추천, 번개 모임, 학식/셔틀, 커뮤니티)</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 5 },
  subtitleSmall: { fontSize: 14, fontWeight: '400', textAlign: 'center' },
});
