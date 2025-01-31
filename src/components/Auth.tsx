import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {useSession} from '../context/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../utils/axiosConfig';
import {ActivityIndicator} from 'react-native-paper';
import {useTheme} from '../screens/ThemeContext';
import {getTheme} from '../screens/Theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const {width, height} = Dimensions.get('window');

const AuthModal: React.FC<AuthModalProps> = ({
  isVisible,
  onClose,
  onLoginSuccess,
}) => {
  const {setSession} = useSession();
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/otpVerify', {
        email: email.toLowerCase(),
        otp,
      });
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem(
          'is_admin',
          JSON.stringify(response.data.is_admin),
        );
        await AsyncStorage.setItem('doctor_id', response.data.doctor_id);

        const newSession = {
          isLoggedIn: true,
          idToken: response.data.token,
          accessToken: null,
          is_admin: response.data.is_admin,
          doctor_id: response.data.doctor_id,
        };
        setSession(newSession);
      } else {
        Alert.alert('Error', 'OTP verification failed');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetEmailInput = () => {
    setIsOtpSent(false);
    setOtp('');
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.headerSection}>
              <Image
                source={require('../assets/healtrack_logo2.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.title}>
                {!isOtpSent ? 'Sign In' : 'Verify OTP'}
              </Text>
              <Text style={styles.subtitle}>
                {!isOtpSent
                  ? 'Login with your email address'
                  : `Enter the verification code sent to ${email}`}
              </Text>

              {!isOtpSent ? (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <Icon name="email" size={20} style={styles.iconStyle} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter email address"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={text => setEmail(text.toLowerCase())}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <Icon name="lock" size={20} style={styles.iconStyle} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="#999"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.mainButton}
                onPress={!isOtpSent ? sendOtp : verifyOtp}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.mainButtonText}>
                    {!isOtpSent ? 'Send OTP' : 'Verify & Login'}
                  </Text>
                )}
              </TouchableOpacity>

              {isOtpSent && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={resetEmailInput}>
                    <Icon
                      name="arrow-left"
                      size={16}
                      style={styles.iconStyle}
                    />
                    <Text style={styles.linkButtonText}>Change Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={sendOtp}
                    disabled={loading}>
                    <Icon name="refresh" size={16} style={styles.iconStyle} />
                    <Text style={styles.linkButtonText}>Resend Code</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
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
      position: 'relative',
    },
    formSection: {
      padding: 20,
      paddingTop: 40,
    },
    iconStyle: {
      color: '#007b8e',
    },
    logo: {
      width: width * 0.5,
      height: 70,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 24,
    },
    inputWrapper: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#e1e1e1',
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 52,
      backgroundColor: '#fff',
    },
    input: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: '#333',
    },
    mainButton: {
      backgroundColor: '#007b8e',
      height: 52,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      shadowColor: '#2a7fba',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    mainButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    linkButtonText: {
      color: '#007b8e',
      marginLeft: 4,
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default AuthModal;
