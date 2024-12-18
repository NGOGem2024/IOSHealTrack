import React from 'react';
import {View, StyleSheet, SafeAreaView, Image} from 'react-native';
import AuthModal from '../../src/components/Auth';

const AuthScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/logocolor.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 70,
    marginBottom: 30,
  },
});

export default AuthScreen;
