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
  Modal,
  Dimensions,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import * as Animatable from 'react-native-animatable';
import {useSession} from '../context/SessionContext';
import {Picker} from '@react-native-picker/picker';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import BackTabTop from './BackTopTab';
import instance from '../utils/axiosConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

import CustomCountryPicker from './CustomCountryPicker';
import RolePicker from './RolePicker';

interface DoctorData {
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
  doctor_phone: string;
  qualification: string;
  is_admin: boolean;
}

interface Country {
  name: string;
  code: string;
  flag: string;
  callingCode: string;
}
const {width} = Dimensions.get('window');

type DoctorRegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'DoctorRegister'>;
};

const theme = {
  light: {
    background: '#f8f9fa',
    card: '#ffffff',
    primary: '#007B8E',
    secondary: '#007B8E',
    text: '#1f2937',
    inputBg: '#f3f4f6',
    inputBorder: '#03858c',
    placeholderText: '#9ca3af',
    error: '#ef4444',
    success: '#22c55e',
    mandatory: '#dc2626',
  },
  dark: {
    background: '#161c24',
    card: '#272d36',
    primary: '#007B8E',
    secondary: '#007B8E',
    text: '#f3f4f6',
    inputBg: '#282d33',
    inputBorder: '#03858c',
    placeholderText: '#9ca3af',
    error: '#f87171',
    success: '#34d399',
    mandatory: '#ef4444',
  },
};

const DoctorRegister: React.FC<DoctorRegisterScreenProps> = ({navigation}) => {
  const {session} = useSession();
  const [isDarkMode, setIsDarkMode] = useState(useColorScheme() === 'dark');
  const [doctorData, setDoctorData] = useState<DoctorData>({
    doctor_first_name: '',
    doctor_last_name: '',
    doctor_email: '',
    doctor_phone: '',
    qualification: '',
    is_admin: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [callingCode, setCallingCode] = useState('91');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    callingCode: '91',
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const colors = theme[isDarkMode ? 'dark' : 'light'];

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'doctor_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email address';
        }
        break;
      case 'doctor_phone':
        if (value.length !== 10) {
          return 'Phone number must be 10 digits';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (field: string, value: string) => {
    let newValue = value;
    if (field.includes('name')) {
      newValue = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (field === 'doctor_phone') {
      newValue = value.replace(/[^0-9]/g, '');
    } else if (field === 'doctor_email') {
      newValue = value.toLowerCase();
    }

    setDoctorData(prev => ({...prev, [field]: newValue}));
    const error = validateField(field, newValue);
    setErrors(prev => ({...prev, [field]: error}));
  };

  const renderInput = (
    label: string,
    placeholder: string,
    field: keyof Omit<DoctorData, 'is_admin'>,
    icon: string,
    keyboardType: 'default' | 'email-address' | 'numeric' = 'default',
    isMandatory: boolean = true,
  ) => (
    <Animatable.View
      animation="fadeInUp"
      duration={800}
      style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, {color: colors.text}]}>
          {label}
          {isMandatory && <Text style={{color: colors.mandatory}}> *</Text>}
        </Text>
      </View>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: errors[field] ? colors.error : colors.inputBorder,
          },
        ]}>
        <Icon
          name={icon}
          size={20}
          color={colors.secondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, {color: colors.text}]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholderText}
          value={doctorData[field]} // Now TypeScript knows this is a string
          onChangeText={text => handleInputChange(field, text)}
          keyboardType={keyboardType}
          autoCapitalize={field === 'doctor_email' ? 'none' : 'words'}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </Animatable.View>
  );

  const renderRolePicker = () => (
    <Animatable.View
      animation="fadeInUp"
      duration={800}
      style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, {color: colors.text}]}>
          Role <Text style={{color: colors.mandatory}}>*</Text>
        </Text>
      </View>
      <RolePicker
        value={doctorData.is_admin.toString()}
        onChange={(itemValue: string) => {
          setDoctorData(prev => ({
            ...prev,
            is_admin: itemValue === 'true',
          }));
        }}
        colors={colors}
        styles={styles}
      />
    </Animatable.View>
  );

  const renderPhoneInput = () => (
    <Animatable.View
      animation="fadeInUp"
      duration={800}
      style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, {color: colors.text}]}>
          Phone Number <Text style={{color: colors.mandatory}}>*</Text>
        </Text>
      </View>
      <View style={styles.phoneInputContainer}>
        <TouchableOpacity
          style={[
            styles.countryPickerButton,
            {
              backgroundColor: colors.inputBg,
              borderColor: errors.doctor_phone
                ? colors.error
                : colors.inputBorder,
            },
          ]}
          onPress={() => setShowCountryPicker(true)}>
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={[styles.callingCodeText, {color: colors.text}]}>
            +{selectedCountry.callingCode}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.phoneInput,
            {
              backgroundColor: colors.inputBg,
              borderColor: errors.doctor_phone
                ? colors.error
                : colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholder="Phone Number"
          placeholderTextColor={colors.placeholderText}
          value={doctorData.doctor_phone}
          onChangeText={text => handleInputChange('doctor_phone', text)}
          keyboardType="numeric"
          maxLength={10}
        />

        <CustomCountryPicker
          selectedCountry={selectedCountry}
          onSelect={(country: Country) => {
            setSelectedCountry(country);
          }}
          visible={showCountryPicker}
          onClose={() => setShowCountryPicker(false)}
          theme={colors}
        />
      </View>
      {errors.doctor_phone && (
        <Text style={styles.errorText}>{errors.doctor_phone}</Text>
      )}
    </Animatable.View>
  );

  const handleDoctorRegister = async () => {
    const newErrors: {[key: string]: string} = {};

    if (!doctorData.doctor_first_name) {
      newErrors.doctor_first_name = 'First name is required';
    }
    if (!doctorData.doctor_last_name) {
      newErrors.doctor_last_name = 'Last name is required';
    }
    if (!doctorData.doctor_phone) {
      newErrors.doctor_phone = 'Phone number is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const formattedData = {
        ...doctorData,
        doctor_phone: `+${selectedCountry.callingCode} ${doctorData.doctor_phone}`,
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <BackTabTop screenName="Register Doctor" />
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          enableOnAndroid={true}
          enableAutomaticScroll={Platform.OS === 'ios'}
          extraScrollHeight={140}
          keyboardShouldPersistTaps="handled">
          <Animatable.View
            animation="fadeInUp"
            duration={1000}
            style={[styles.card, {backgroundColor: colors.card}]}>
            <View style={styles.headerContainer}>
              <Text style={[styles.title, {color: colors.primary}]}>
                Register
              </Text>
              <Icon2 name="user-md" size={25} color={colors.primary} />
            </View>

            {renderInput(
              'First Name',
              'Enter first name',
              'doctor_first_name',
              'account',
              'default',
              true,
            )}

            {renderInput(
              'Last Name',
              'Enter last name',
              'doctor_last_name',
              'account',
              'default',
              true,
            )}

            {renderInput(
              'Email',
              'Enter email address',
              'doctor_email',
              'email',
              'email-address',
              true,
            )}

            {renderPhoneInput()}

            {renderInput(
              'Qualification',
              'Enter qualification',
              'qualification',
              'school',
              'default',
              true,
            )}

            {renderRolePicker()}

            <Animatable.View
              animation="fadeInUp"
              duration={800}
              style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: colors.primary}]}
                onPress={handleDoctorRegister}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon
                      name="check-circle"
                      size={20}
                      color="#FFFFFF"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>Register Doctor</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, {borderColor: colors.primary}]}
                onPress={() => navigation.navigate('DoctorDashboard')}>
                <Icon
                  name="home"
                  size={20}
                  color={colors.primary}
                  style={styles.buttonIcon}
                />
                <Text
                  style={[styles.secondaryButtonText, {color: colors.primary}]}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </Animatable.View>
          </Animatable.View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 5,
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 50,
    height: 50,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  flag: {
    fontSize: 20,
    marginRight: 4,
  },
  callingCodeText: {
    fontSize: 16,
    paddingRight: 5,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingBottom: 20, // Add extra padding at the bottom
  },
  card: {
    width: width * 0.9,
    alignSelf: 'center',
    borderRadius: 15,
    padding: 15,
    marginBottom: 5, 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  labelContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  roleButtonText: {
    flex: 1,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: 20,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingLeft: 12,
  },
  picker: {
    flex: 1,
    marginLeft: -10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerDoneButton: {
    padding: 4,
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default DoctorRegister;
