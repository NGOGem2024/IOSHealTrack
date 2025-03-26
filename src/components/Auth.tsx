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
import {useNavigation} from '@react-navigation/native';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
}

const {width, height} = Dimensions.get('window');

const AuthModal: React.FC<AuthModalProps> = ({
  isVisible,
  onClose,
  onLoginSuccess,
  onForgotPassword,
}) => {
  const {setSession} = useSession();
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordLogin, setIsPasswordLogin] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

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

  const loginWithPassword = async () => {
    const lowerCaseEmail = email.toLowerCase();
    if (!isValidEmail(lowerCaseEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Please enter a valid password.');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/verify/password', {
        email: lowerCaseEmail,
        password,
      });

      if (response.data.token) {
        // Store token and other basic info
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem(
          'is_admin',
          JSON.stringify(response.data.is_admin),
        );
        await AsyncStorage.setItem('doctor_id', response.data.doctor_id);

        // Download and store image if available
        if (response.data.doctor_photo) {
          try {
            const imageResponse = await fetch(response.data.doctor_photo);
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.blob();
              const base64Image: string = await new Promise<string>(
                (resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result;
                    if (typeof result === 'string') {
                      resolve(result);
                    } else {
                      reject(new Error('FileReader result is not a string'));
                    }
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(imageBlob);
                },
              );

              await AsyncStorage.setItem('doctor_photo', base64Image);
            } else {
              console.warn('Failed to download doctor photo');
            }
          } catch (imageError) {
            console.error('Error downloading doctor photo:', imageError);
            // Continue with login even if image download fails
          }
        }

        // Set session
        const newSession = {
          isLoggedIn: true,
          idToken: response.data.token,
          accessToken: null,
          is_admin: response.data.is_admin,
          doctor_id: response.data.doctor_id,
        };
        setSession(newSession);
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Error', 'Invalid email or password');
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
        // Store token and other basic info
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem(
          'is_admin',
          JSON.stringify(response.data.is_admin),
        );
        await AsyncStorage.setItem('doctor_id', response.data.doctor_id);

        // Download and store image if available
        if (response.data.doctor_photo) {
          try {
            const imageResponse = await fetch(response.data.doctor_photo);
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.blob();
              const base64Image = await new Promise<string>(
                (resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      resolve(reader.result);
                    } else {
                      reject(new Error('FileReader result is not a string'));
                    }
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(imageBlob);
                },
              );

              await AsyncStorage.setItem('doctor_photo', base64Image);
            } else {
              console.warn('Failed to download doctor photo');
            }
          } catch (imageError) {
            console.error('Error downloading doctor photo:', imageError);
            // Continue with login even if image download fails
          }
        }

        // Set session
        const newSession = {
          isLoggedIn: true,
          idToken: response.data.token,
          accessToken: null,
          is_admin: response.data.is_admin,
          doctor_id: response.data.doctor_id,
        };
        setSession(newSession);
        onLoginSuccess();
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
  const handleForgotPassword = () => {
    // Instead of navigating, simply call the onForgotPassword callback
    if (onForgotPassword) {
      onForgotPassword();
    }
  };
  const resetForm = () => {
    setIsOtpSent(false);
    setOtp('');
    setPassword('');
    setIsPasswordLogin(false);
  };

  const toggleLoginMethod = () => {
    setIsPasswordLogin(!isPasswordLogin);
    setIsOtpSent(false); // Reset OTP state when switching
    setOtp(''); // Clear OTP when switching
    // Don't clear email when switching methods
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}>
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
                {isPasswordLogin
                  ? 'Password Login'
                  : !isOtpSent
                  ? 'OTP Login'
                  : 'Verify OTP'}
              </Text>
              <Text style={styles.subtitle}>
                {isPasswordLogin
                  ? 'Login with your email and password'
                  : !isOtpSent
                  ? 'Login with your email address'
                  : `Enter the verification code sent to ${email}`}
              </Text>

              {!isOtpSent && (
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
              )}

              {isPasswordLogin && !isOtpSent && (
                <>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Icon name="lock" size={20} style={styles.iconStyle} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                      />
                      <TouchableOpacity onPress={togglePasswordVisibility}>
                        <Icon
                          name={isPasswordVisible ? "eye-off" : "eye"}
                          size={20}
                          style={styles.iconStyle}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={handleForgotPassword}>
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {isOtpSent && !isPasswordLogin && (
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
                onPress={
                  isPasswordLogin
                    ? loginWithPassword
                    : !isOtpSent
                    ? sendOtp
                    : verifyOtp
                }
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.mainButtonText}>
                    {isPasswordLogin
                      ? 'Login'
                      : !isOtpSent
                      ? 'Send OTP'
                      : 'Verify & Login'}
                  </Text>
                )}
              </TouchableOpacity>

              {!isOtpSent && (
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={toggleLoginMethod}>
                  <Text style={styles.switchButtonText}>
                    {isPasswordLogin ? 'Use OTP Login' : 'Use Password Login'}
                  </Text>
                </TouchableOpacity>
              )}

              {isOtpSent && !isPasswordLogin && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={resetForm}>
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
      </Modal>
    </SafeAreaView>
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
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginTop: -12,
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    forgotPasswordText: {
      color: '#007b8e',
      fontSize: 14,
      fontWeight: '500',
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
    switchButton: {
      marginTop: 16,
      padding: 8,
      alignItems: 'center',
    },
    switchButtonText: {
      color: '#007b8e',
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default AuthModal;