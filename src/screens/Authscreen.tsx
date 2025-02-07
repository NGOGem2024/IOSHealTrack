// AuthScreen.tsx
import React, {useState} from 'react';
import {View, StyleSheet, SafeAreaView, StatusBar} from 'react-native';
import AuthModal from '../../src/components/Auth';
import ForgotPasswordModal from './forgotpassword';

const AuthScreen: React.FC = () => {
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(true);
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] =
    useState(false);

  // Called when the user taps "Forgot Password" in the AuthModal.
  const handleForgotPassword = () => {
    setIsAuthModalVisible(false);
    setIsForgotPasswordModalVisible(true);
  };

  // Called when the forgot password process completes.
  const handleForgotPasswordComplete = () => {
    setIsForgotPasswordModalVisible(false);
    setIsAuthModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />
      <View style={styles.content}>
        {isAuthModalVisible && (
          <AuthModal
            isVisible={isAuthModalVisible}
            onClose={() => {}}
            onLoginSuccess={() => {}}
            onForgotPassword={handleForgotPassword} // Pass the callback to trigger forgot password modal
          />
        )}
        {isForgotPasswordModalVisible && (
          <ForgotPasswordModal
            isVisible={isForgotPasswordModalVisible}
            onClose={handleForgotPasswordComplete} // When done, call this to return to AuthModal
          />
        )}
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
