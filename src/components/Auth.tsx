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
} from 'react-native';
import {useSession} from '../context/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../utils/axiosConfig';
//import {useNavigation} from '@react-navigation/native';
import {ActivityIndicator} from 'react-native-paper';
import {useTheme} from '../screens/ThemeContext';
import {getTheme} from '../screens/Theme';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

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
  //const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // Email validation function using regex
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
        setSession(newSession); // This will trigger the navigation through AppNavigator
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
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Image
            source={require('../assets/logocolor.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Login</Text>
          {!isOtpSent ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={text => setEmail(text.toLowerCase())}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.button} onPress={sendOtp}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.button} onPress={verifyOtp}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={sendOtp}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Resend OTP</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetEmailInput}>
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      padding: 20,
      borderRadius: 10,
      width: '80%',
      maxHeight: '80%',
      overflow: 'hidden',
      alignItems: 'center',
    },
    logo: {
      width: 200,
      height: 70,
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 10,
      color: theme.colors.text,
      paddingHorizontal: 10,
      borderRadius: 5,
    },
    button: {
      backgroundColor: '#2a7fba',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginBottom: 15,
      width: '100%',
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginBottom: 10,
      width: '100%',
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: '#2a7fba',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

export default AuthModal;
