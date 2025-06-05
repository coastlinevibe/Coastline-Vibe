import React from 'react';
import { View, StyleSheet } from 'react-native';
import SpinnerTest from './src/components/SpinnerTest';

export default function App() {
  return (
    <View style={styles.container}>
      <SpinnerTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 