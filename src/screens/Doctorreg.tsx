import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  useColorScheme,
  Appearance,
  SafeAreaView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {GestureHandlerRootView, ScrollView} from 'react-native-gesture-handler';
import * as Animatable from 'react-native-animatable';
import {useSession} from '../context/SessionContext';
import {Picker} from '@react-native-picker/picker';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import BackTabTop from './BackTopTab';
import instance from '../utils/axiosConfig';

type DoctorRegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'DoctorRegister'>;
};

const DoctorRegister: React.FC<DoctorRegisterScreenProps> = ({navigation}) => {
  const {session} = useSession();
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  const [doctorData, setDoctorData] = useState({
    doctor_first_name: '',
    doctor_last_name: '',
    doctor_email: '',
    doctor_phone: '',
    qualification: '',
    is_admin: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(
      ({colorScheme: newColorScheme}) => {
        setIsDarkMode(newColorScheme === 'dark');
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Theme colors based on mode
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    primary: isDarkMode ? '#1FCAE8' : '#119FB3',
    inputBackground: isDarkMode ? '#2C2C2C' : '#FFFFFF',
    inputBorder: isDarkMode ? '#404040' : '#D9D9D9',
    error: isDarkMode ? '#FF6B6B' : '#FF0000',
    cardBackground: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    placeholderText: isDarkMode ? '#888888' : '#666666',
    shadow: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.25)',
  };

  // Themed styles
  const themedStyles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.inputBorder,
      borderWidth: isDarkMode ? 1 : 0,
      shadowColor: colors.shadow,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.inputBorder,
      color: colors.text,
    },
    text: {
      color: colors.text,
    },
    scrollContent: {
      backgroundColor: colors.background,
    },
  });

  const handleDoctorRegister = async () => {
    setIsLoading(true);
    try {
      if (!doctorData.doctor_first_name || !doctorData.doctor_last_name) {
        throw new Error('First name and last name are required');
      }
      if (doctorData.doctor_phone.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      const formattedData = {
        ...doctorData,
        doctor_phone: '+91' + doctorData.doctor_phone,
      };

      const response = await instance.post('/doctor/create', formattedData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.idToken}`,
        },
      });

      showSuccessToast('Doctor registered successfully');
      setDoctorData({
        doctor_first_name: '',
        doctor_last_name: '',
        doctor_email: '',
        doctor_phone: '',
        qualification: '',
        is_admin: false,
      });
      navigation.navigate('DoctorDashboard');
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setDoctorData({
        ...doctorData,
        doctor_phone: numericText,
      });
      setPhoneError(
        numericText.length === 10 ? '' : 'Phone number must be 10 digits.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={themedStyles.mainContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}>
          <GestureHandlerRootView style={{flex: 1}}>
            <BackTabTop screenName="Doctor" />

            <ScrollView
              contentContainerStyle={[
                styles.scrollContainer,
                themedStyles.scrollContent,
              ]}
              keyboardShouldPersistTaps="handled">
              <Animatable.View
                animation="fadeInUp"
                style={[styles.container, themedStyles.card]}>
                <Text style={[styles.title, {color: colors.primary}]}>
                  Register Doctor
                </Text>

                {/* First Name */}
                <Animatable.View
                  animation="fadeInUp"
                  style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, themedStyles.input]}
                    placeholder="First Name"
                    placeholderTextColor={colors.placeholderText}
                    value={doctorData.doctor_first_name}
                    onChangeText={text =>
                      setDoctorData({...doctorData, doctor_first_name: text})
                    }
                  />
                </Animatable.View>

                {/* Last Name */}
                <Animatable.View
                  animation="fadeInUp"
                  delay={200}
                  style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, themedStyles.input]}
                    placeholder="Last Name"
                    placeholderTextColor={colors.placeholderText}
                    value={doctorData.doctor_last_name}
                    onChangeText={text =>
                      setDoctorData({...doctorData, doctor_last_name: text})
                    }
                  />
                </Animatable.View>

                {/* Email */}
                <Animatable.View
                  animation="fadeInUp"
                  delay={400}
                  style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, themedStyles.input]}
                    placeholder="Email"
                    placeholderTextColor={colors.placeholderText}
                    value={doctorData.doctor_email}
                    onChangeText={text =>
                      setDoctorData({...doctorData, doctor_email: text})
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Animatable.View>

                {/* Phone */}
                <Animatable.View
                  animation="fadeInUp"
                  delay={600}
                  style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, themedStyles.input]}
                    placeholder="+91 Contact No."
                    placeholderTextColor={colors.placeholderText}
                    value={
                      doctorData.doctor_phone
                        ? '+91' + doctorData.doctor_phone
                        : ''
                    }
                    onChangeText={handlePhoneChange}
                    keyboardType="numeric"
                    maxLength={13}
                  />
                  {phoneError ? (
                    <Text style={[styles.errorText, {color: colors.error}]}>
                      {phoneError}
                    </Text>
                  ) : null}
                </Animatable.View>

                {/* Qualification */}
                <Animatable.View
                  animation="fadeInUp"
                  delay={800}
                  style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, themedStyles.input]}
                    placeholder="Qualification"
                    placeholderTextColor={colors.placeholderText}
                    value={doctorData.qualification}
                    onChangeText={text =>
                      setDoctorData({...doctorData, qualification: text})
                    }
                  />
                </Animatable.View>

                {/* Role Picker */}
                <Animatable.View
                  animation="fadeInUp"
                  delay={1000}
                  style={styles.inputContainer}>
                  <Text style={[styles.labelText, themedStyles.text]}>
                    Role:
                  </Text>
                  <View style={[styles.pickerContainer, themedStyles.input]}>
                    <Picker
                      selectedValue={doctorData.is_admin}
                      style={{color: colors.text}}
                      dropdownIconColor={colors.text}
                      onValueChange={itemValue =>
                        setDoctorData({...doctorData, is_admin: itemValue})
                      }>
                      <Picker.Item
                        label="Doctor"
                        value={false}
                        color={colors.text}
                      />
                      <Picker.Item
                        label="Admin"
                        value={true}
                        color={colors.text}
                      />
                    </Picker>
                  </View>
                </Animatable.View>

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.button, {backgroundColor: colors.primary}]}
                  onPress={handleDoctorRegister}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Register</Text>
                  )}
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity
                  style={[
                    styles.backButton,
                    {
                      backgroundColor: 'transparent',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => navigation.navigate('DoctorDashboard')}>
                  <Text
                    style={[styles.backButtonText, {color: colors.primary}]}>
                    Back to Home
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            </ScrollView>
          </GestureHandlerRootView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    overflow: 'hidden',
  },
  labelText: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 5,
    fontSize: 14,
  },
});

export default DoctorRegister;
