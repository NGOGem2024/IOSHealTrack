// ForgotPasswordModal.tsx
import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import axiosInstance from '../utils/axiosConfig';
import {ActivityIndicator} from 'react-native-paper';
import {useTheme} from '../screens/ThemeContext';
import {getTheme} from '../screens/Theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ForgotPasswordModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isVisible,
  onClose,
}) => {
  const {theme} = useTheme();
  const styles = getStyles(getTheme(theme.name));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Step 1: Send OTP using only the email field.
  const sendOtp = async () => {
    const lowerCaseEmail = email.toLowerCase();
    if (!isValidEmail(lowerCaseEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post('/sendOtp', {
        email: lowerCaseEmail,
      });
      if (response.data.message === 'OTP sent successfully') {
        setIsOtpSent(true);
        Alert.alert('Success', 'OTP has been sent to your email.');
      } else {
        Alert.alert('Error', 'Failed to send OTP.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and set up the new password.
  const verifyAndSetupPassword = async () => {
    const lowerCaseEmail = email.toLowerCase();
    if (!password || password.length < 6) {
      Alert.alert(
        'Invalid Password',
        'Please enter a valid password (at least 6 characters).',
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        '/otpVerification/passwordsetup',
        {
          email: lowerCaseEmail,
          otp,
          password,
        },
      );
      if (response.data.message === 'Password updated successfully') {
        Alert.alert('Success', 'Your password has been updated.', [
          {text: 'OK', onPress: onClose},
        ]);
      } else {
        Alert.alert('Error', 'OTP verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error setting up password:', error);
      Alert.alert(
        'Error',
        'Failed to verify OTP and setup password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <View style={styles.modalContent}>
            <View style={styles.headerSection}>
              <Image
                source={require('../assets/healtrack_logo2.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                {isOtpSent
                  ? 'Enter the OTP sent to your email along with your new password.'
                  : 'Enter your email to receive an OTP.'}
              </Text>

              {/* Before OTP is sent: Only show email input */}
              {!isOtpSent && (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <Icon name="email" size={20} style={styles.iconStyle} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={text => setEmail(text.toLowerCase())}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              )}

              {/* After OTP is sent: Show OTP field and new password fields */}
              {isOtpSent && (
                <>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Icon
                        name="shield-key"
                        size={20}
                        style={styles.iconStyle}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter 6-digit OTP"
                        placeholderTextColor="#999"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>
                  </View>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Icon name="lock" size={20} style={styles.iconStyle} />
                      <TextInput
                        style={styles.input}
                        placeholder="New Password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </View>
                  </View>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Icon
                        name="lock-check"
                        size={20}
                        style={styles.iconStyle}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Re-enter Password"
                        placeholderTextColor="#999"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.mainButton}
                onPress={isOtpSent ? verifyAndSetupPassword : sendOtp}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.mainButtonText}>
                    {isOtpSent ? 'Verify & Setup Password' : 'Send OTP'}
                  </Text>
                )}
              </TouchableOpacity>

              {isOtpSent && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    // Allow the user to change email if necessary.
                    setIsOtpSent(false);
                    setOtp('');
                  }}>
                  <Text style={styles.linkButtonText}>Change Email</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const {width} = Dimensions.get('window');
const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: width * 0.9,
      maxWidth: 400,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: theme.colors.card,
    },
    headerSection: {
      marginTop: 40,
      alignItems: 'center',
    },
    logo: {
      width: width * 0.5,
      height: 70,
    },
    formSection: {
      padding: 20,
      paddingTop: 40,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 24,
      textAlign: 'center',
    },
    inputWrapper: {
      marginBottom: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.colors.secondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 52,
      backgroundColor: theme.colors.secondary,
    },
    input: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    iconStyle: {
      color: '#007b8e',
    },
    mainButton: {
      backgroundColor: '#007b8e',
      height: 52,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      shadowColor: '#2a7fba',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    mainButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      marginTop: 16,
    },
    linkButtonText: {
      color: '#007b8e',
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default ForgotPasswordModal;
