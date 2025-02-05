import React from 'react';
import {View, StyleSheet, SafeAreaView, Image, StatusBar} from 'react-native';
import AuthModal from '../../src/components/Auth';

const AuthScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />
      <View style={styles.content}>
        <AuthModal
          isVisible={true}
          onClose={() => {}}
          onLoginSuccess={() => {}}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(110, 109, 109)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default AuthScreen;
