import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardType,
  Platform,
  StyleSheet,
  useColorScheme,
  Appearance,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import * as Animatable from 'react-native-animatable';
import {useSession} from '../context/SessionContext';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import CustomPicker from './patientpicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome';
import PhoneInput from 'react-native-phone-number-input';
import CustomCountryPicker from './CustomCountryPicker';
const {width} = Dimensions.get('window');

type PatientRegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'PatientRegister'>;
};

interface PatientData {
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  referral_source: string;
  referral_details: string;
  formattedPhone: string;
}

const theme = {
  light: {
    background: '#f8f9fa',
    card: '#ffffff',
    primary: '#119FB3',
    secondary: '#119FB3',
    text: '#1f2937',
    inputBg: '#f3f4f6',
    inputBorder: '#03858c',
    placeholderText: '#9ca3af',
    error: '#ef4444',
    success: '#22c55e',
    mandatory: '#dc2626',
    optional: '#059669',
  },
  dark: {
    background: '#161c24',
    card: '#272d36',
    primary: '#11bed6',
    secondary: '#119FB3',
    text: '#f3f4f6',
    inputBg: '#282d33',
    inputBorder: '#03858c',
    placeholderText: '#9ca3af',
    error: '#f87171',
    success: '#34d399',
    mandatory: '#ef4444',
    optional: '#10b981',
  },
};

const initialPatientData: PatientData = {
  patient_first_name: '',
  patient_last_name: '',
  patient_email: '',
  patient_phone: '',
  referral_source: '',
  referral_details: '',
  formattedPhone: '',
};

interface FieldStatus {
  [key: string]: boolean;
}

const initialFieldStatus: FieldStatus = {
  patient_first_name: false,
  patient_last_name: false,
  patient_email: false,
  patient_phone: false,
  referral_source: false,
  referral_details: false,
};

interface Country {
  name: string;
  code: string;
  flag: string;
  callingCode: string;
}

const PatientRegister: React.FC<PatientRegisterScreenProps> = ({
  navigation,
}) => {
  const {session} = useSession();
  const [patientData, setPatientData] =
    useState<PatientData>(initialPatientData);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldStatus, setFieldStatus] =
    useState<FieldStatus>(initialFieldStatus);
  const [isDarkMode, setIsDarkMode] = useState(useColorScheme() === 'dark');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const phoneInput = useRef<PhoneInput>(null);
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

  const validateField = (field: keyof PatientData, value: string): string => {
    switch (field) {
      case 'patient_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email address';
        }
        break;
      case 'patient_phone':
        if (phoneInput.current?.isValidNumber(value)) {
          return '';
        } else if (value) {
          return 'Invalid phone number';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (field: keyof PatientData, value: string) => {
    let newValue = value;
    if (field.includes('name')) {
      newValue = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (field === 'patient_phone') {
      newValue = value.replace(/[^0-9]/g, '');
    } else if (field === 'patient_email') {
      newValue = value.toLowerCase();
    }

    setPatientData(prev => ({...prev, [field]: newValue}));
    setFieldStatus(prev => ({...prev, [field]: newValue.length > 0}));

    const error = validateField(field, newValue);
    setErrors(prev => ({...prev, [field]: error}));
  };

  const handlePatientRegister = async () => {
    const newErrors: {[key: string]: string} = {};

    // Validation checks
    if (!patientData.patient_first_name) {
      newErrors.patient_first_name = 'First name is required';
    }
    if (!patientData.patient_last_name) {
      newErrors.patient_last_name = 'Last name is required';
    }
    if (!patientData.patient_phone) {
      newErrors.patient_phone = 'Phone number is required';
    }
    if (!patientData.referral_source) {
      newErrors.referral_source = 'Referral source is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const formattedData = {
        ...patientData,
        patient_phone: `+${selectedCountry.callingCode}${patientData.patient_phone}`,
      };

      const response = await axiosInstance.post(
        '/patient/registration',
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );

      showSuccessToast('Patient registered successfully');
      setPatientData(initialPatientData);
      setFieldStatus(initialFieldStatus);
      navigation.navigate('UpdatePatient', {
        patientId: response.data.patient._id,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    placeholder: string,
    field: keyof PatientData,
    keyboardType: KeyboardType = 'default',
    icon: string,
    isMandatory: boolean = false,
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
          value={patientData[field]}
          onChangeText={text => handleInputChange(field, text)}
          keyboardType={keyboardType}
          autoCapitalize={field === 'patient_email' ? 'none' : 'words'}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
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
          value={patientData.patient_phone}
          onChangeText={text => handleInputChange('patient_phone', text)}
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
      <BackTabTop screenName="Register Patient" />
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
              <Icon2 name="user-plus" size={25} color={colors.primary} />
            </View>

            {renderInput(
              'First Name',
              'Enter first name',
              'patient_first_name',
              'default',
              'account',
              true,
            )}

            {renderInput(
              'Last Name',
              'Enter last name',
              'patient_last_name',
              'default',
              'account',
              true,
            )}

            {renderInput(
              'Email',
              'Enter email address',
              'patient_email',
              'email-address',
              'email',
              false,
            )}

            {renderPhoneInput()}

            <Animatable.View
              animation="fadeInUp"
              duration={800}
              style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={[styles.label, {color: colors.text}]}>
                  Referral Source{' '}
                  <Text style={{color: colors.mandatory}}>*</Text>
                </Text>
              </View>
              <CustomPicker
                selectedValue={patientData.referral_source}
                onValueChange={(itemValue: string) =>
                  handleInputChange('referral_source', itemValue)
                }
                items={[
                  {label: 'Select Referral Source', value: ''},
                  {label: 'Social Media', value: 'Social Media'},
                  {label: 'Patient Reference', value: 'Patient Reference'},
                  {label: 'Hospital Reference', value: 'Hospital Reference'},
                  {label: 'Walk-in', value: 'walkin'},
                  {label: 'Doctor Reference', value: 'Doctor Reference'},
                  {label: 'Other', value: 'Other'},
                ]}
                placeholder="Select Referral Source"
                style={[
                  styles.picker,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: errors.referral_source
                      ? colors.error
                      : colors.inputBorder,
                  },
                ]}
                textColor={colors.text}
              />
            </Animatable.View>

            {patientData.referral_source &&
              patientData.referral_source !== 'walkin' && (
                <Animatable.View animation="fadeInUp" duration={800}>
                  {patientData.referral_source === 'Social Media' ? (
                    <View style={styles.inputContainer}>
                      <View style={styles.labelContainer}>
                        <Text style={[styles.label, {color: colors.text}]}>
                          Social Media Platform{' '}
                          <Text style={{color: colors.mandatory}}>*</Text>
                        </Text>
                      </View>
                      <CustomPicker
                        selectedValue={patientData.referral_details}
                        onValueChange={(itemValue: string) =>
                          handleInputChange('referral_details', itemValue)
                        }
                        items={[
                          {label: 'Select Platform', value: ''},
                          {label: 'Instagram', value: 'Instagram'},
                          {label: 'Facebook', value: 'Facebook'},
                          {label: 'WhatsApp', value: 'WhatsApp'},
                          {label: 'YouTube', value: 'YouTube'},
                          {label: 'Google', value: 'Google'},
                        ]}
                        placeholder="Select Social Media Platform"
                        style={[
                          styles.picker,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.inputBorder,
                          },
                        ]}
                        textColor={colors.text}
                      />
                    </View>
                  ) : (
                    renderInput(
                      'Referral Details',
                      'Enter referral details',
                      'referral_details',
                      'default',
                      'information',
                      true,
                    )
                  )}
                </Animatable.View>
              )}

            <Animatable.View
              animation="fadeInUp"
              duration={800}
              style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: colors.primary}]}
                onPress={handlePatientRegister}
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
                    <Text style={styles.buttonText}>Register Patient</Text>
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
    backgroundColor: 'Black',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex:1,
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
  callingCodeText: {
    fontSize: 16,
    paddingRight: 5,
  },
  flag: {
    fontSize: 20,
    marginRight: 4,
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
    paddingBottom: 20, 
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
    justifyContent: 'center', // Center the items horizontally
    marginVertical: 20, // Add spacing around the header
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 5, // Space between "Register" and the icon
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
  picker: {
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
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
  phonePrefix: {
    fontSize: 16,
    marginRight: 8,
  },
  mandatoryText: {
    color: '#ef4444',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    opacity: 0.2,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
});

export default PatientRegister;
