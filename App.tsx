import React from 'react';
import {SafeAreaView, Text, StyleSheet} from 'react-native';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // White background
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000', // Black text color
  },
});

export default App;
