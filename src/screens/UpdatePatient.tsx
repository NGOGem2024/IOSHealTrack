import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Animated,
  Appearance,
  useColorScheme,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import DoctorPicker from './DoctorPickerUpdate';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

const themeColors = {
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
  },
};

interface PatientData {
  doctor_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  patient_gender: string;
  patient_address1: string;
  patient_address2: string;
  patient_age: string;
  patient_bloodGroup: string;
  patient_symptoms: string;
  therepy_category: string;
  patient_diagnosis: string;
  patient_therapy_type: string;
  therapy_duration: string;
  patient_id: string;
  doctor_name: string;
}

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
}

type UpdatePatientProps = StackScreenProps<RootStackParamList, 'UpdatePatient'>;

const UpdatePatient: React.FC<UpdatePatientProps> = ({navigation, route}) => {
  const {patientId} = route.params;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientData, setPatientData] = useState<PatientData>({
    patient_first_name: '',
    patient_last_name: '',
    patient_email: '',
    patient_phone: '',
    patient_gender: '',
    patient_address1: '',
    patient_address2: '',
    patient_age: '',
    patient_bloodGroup: '',
    patient_symptoms: '',
    therepy_category: '',
    patient_diagnosis: '',
    patient_therapy_type: '',
    therapy_duration: '',
    patient_id: '',
    doctor_name: '',
    doctor_id: '',
  });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [phoneError, setPhoneError] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<boolean>(false);
  // Theme handling similar to PatientRegister
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  const validateEmail = (email: string): boolean => {
    // If email is empty or just whitespace, it's valid (since it's optional)
    if (!email || email.trim() === '') {
      setEmailError(false); // Make sure to clear any error state
      return true;
    }

    // Otherwise, validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailError(!isValid);
    return isValid;
  };

  const validatePhone = (phone: string): boolean => {
    const isValid = phone.startsWith('+');
    setPhoneError(!isValid);
    return isValid;
  };

  // FIX: Updated handleTextChange to directly set the value rather than appending it
  const handleTextChange = useCallback(
    (field: keyof PatientData, value: string) => {
      if (field === 'patient_phone') {
        validatePhone(value);
      }
      if (field === 'patient_email') {
        validateEmail(value);
      }
      setPatientData(prev => ({
        ...prev,
        [field]: field === 'patient_email' ? value.toLowerCase() : value,
      }));
    },
    [],
  );

  const handleDoctorChange = useCallback(
    (doctorId: string) => {
      const selectedDoctor = doctors.find(doc => doc._id === doctorId);
      if (selectedDoctor) {
        setPatientData(prev => ({
          ...prev,
          doctor_id: doctorId,
          doctor_name: `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`,
        }));
      }
    },
    [doctors],
  );

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/getalldoctor');
      setDoctors(response.data.doctors);
    } catch (error) {
      handleError(error);
    }
  }, []);

  const fetchPatientData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/patient/${patientId}`);
      const patientInfo = response.data.patientData;
      const formattedPhone = patientInfo.patient_phone.replace(
        /^\+(\d{2})(\d+)/,
        '+$1 $2',
      );
      setPatientData(prevData => ({
        ...prevData,
        patient_first_name: patientInfo.patient_first_name || '',
        patient_last_name: patientInfo.patient_last_name || '',
        patient_email: patientInfo.patient_email || '',
        patient_phone: formattedPhone || '',
        patient_address1: patientInfo.patient_address1 || '',
        patient_address2: patientInfo.patient_address2 || '',
        patient_age: patientInfo.patient_age || '',
        patient_symptoms: patientInfo.patient_symptoms || '',
        patient_diagnosis: patientInfo.patient_diagnosis || '',
        patient_id: patientInfo.patient_id,
        doctor_id: patientInfo.doctor_id || '',
        doctor_name: patientInfo.doctor_name || '',
      }));
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const initializeData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchPatientData(), fetchDoctors()]);
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchPatientData, fetchDoctors, fadeAnim]);

  const handlePatientUpdate = useCallback(async () => {
    // Email validation - only validate if a value is provided (not empty)
    if (
      patientData.patient_email.trim() !== '' &&
      !validateEmail(patientData.patient_email)
    ) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address or leave it empty.',
        [{text: 'OK'}],
      );
      return;
    }

    if (!validatePhone(patientData.patient_phone)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid phone number with country code (e.g., +1, +44).',
        [{text: 'OK'}],
      );
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post(`/patient/update/${patientId}`, patientData);
      showSuccessToast('Patient updated successfully');
      navigation.navigate('AllPatients');
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [patientData, patientId, navigation]);

  return (
    <View
      style={[styles.safeArea, {backgroundColor: currentColors.background}]}>
      <BackTabTop screenName="Patient" />
      <KeyboardAwareScrollView
        style={[styles.scrollView, {backgroundColor: currentColors.background}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={50}>
        <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
          <View
            style={[
              styles.formContainer,
              {backgroundColor: currentColors.card},
            ]}>
            <View style={styles.headerContainer}>
              <Text style={[styles.title, {color: currentColors.primary}]}>
                Update Patient Profile
              </Text>
            </View>

            {/* First Name */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: currentColors.inputBorder,
                    backgroundColor: currentColors.inputBg,
                  },
                ]}>
                <View style={styles.iconContainer}>
                  <Icon name="person" size={24} color={currentColors.primary} />
                </View>
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="First Name"
                  value={patientData.patient_first_name}
                  onChangeText={text =>
                    handleTextChange('patient_first_name', text)
                  }
                  placeholderTextColor={currentColors.placeholderText}
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: currentColors.inputBorder,
                    backgroundColor: currentColors.inputBg,
                  },
                ]}>
                <View style={styles.iconContainer}>
                  <Icon name="person" size={24} color={currentColors.primary} />
                </View>
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="Last Name"
                  value={patientData.patient_last_name}
                  onChangeText={text =>
                    handleTextChange('patient_last_name', text)
                  }
                  placeholderTextColor={currentColors.placeholderText}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: emailError
                      ? currentColors.error
                      : currentColors.inputBorder,
                    backgroundColor: currentColors.inputBg,
                  },
                ]}>
                <View style={styles.iconContainer}>
                  <Icon
                    name="email"
                    size={24}
                    color={
                      emailError ? currentColors.error : currentColors.primary
                    }
                  />
                </View>
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="Enter Email"
                  value={patientData.patient_email}
                  onChangeText={value =>
                    handleTextChange('patient_email', value)
                  }
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {emailError && (
                <Text style={[styles.errorText, {color: currentColors.error}]}>
                  Please enter a valid email or leave it empty
                </Text>
              )}
            </View>

            {/* Contact Number */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: phoneError
                      ? currentColors.error
                      : currentColors.inputBorder,
                    backgroundColor: currentColors.inputBg,
                  },
                ]}>
                <View style={styles.iconContainer}>
                  <Icon
                    name="phone"
                    size={24}
                    color={
                      phoneError ? currentColors.error : currentColors.primary
                    }
                  />
                </View>
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="Contact Number"
                  value={patientData.patient_phone}
                  onChangeText={text => handleTextChange('patient_phone', text)}
                  keyboardType="phone-pad"
                  placeholderTextColor={
                    phoneError
                      ? currentColors.error
                      : currentColors.placeholderText
                  }
                />
              </View>
              {phoneError && (
                <Text style={[styles.errorText, {color: currentColors.error}]}>
                  Phone number must start with + (country code)
                </Text>
              )}
            </View>
            {/* Doctor Picker */}
            <DoctorPicker
              doctors={doctors}
              selectedDoctorId={patientData.doctor_id}
              onDoctorSelect={handleDoctorChange}
              isLoading={isLoading}
            />

            {/* Primary Address */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: currentColors.inputBorder,
                    backgroundColor: currentColors.inputBg,
                  },
                ]}>
                <View style={styles.iconContainer}>
                  <Icon
                    name="location-on"
                    size={24}
                    color={currentColors.primary}
                  />
                </View>
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="Primary Address"
                  value={patientData.patient_address1}
                  onChangeText={text =>
                    handleTextChange('patient_address1', text)
                  }
                  placeholderTextColor={currentColors.placeholderText}
                />
              </View>
            </View>

            {/* Secondary Address */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: currentColors.inputBorder,
                    backgroundColor: currentColors.inputBg,
                  },
                ]}>
                <View style={styles.iconContainer}>
                  <Icon
                    name="location-on"
                    size={24}
                    color={currentColors.primary}
                  />
                </View>
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="Secondary Address"
                  value={patientData.patient_address2}
                  onChangeText={text =>
                    handleTextChange('patient_address2', text)
                  }
                  placeholderTextColor={currentColors.placeholderText}
                />
              </View>
            </View>

            {/* Age */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: currentColors.inputBorder,
                    backgroundColor: currentColors.inputBg,
                  },
                ]}>
                <View style={styles.iconContainer}>
                  <Icon name="tag" size={24} color={currentColors.primary} />
                </View>
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="Age"
                  value={patientData.patient_age}
                  onChangeText={text => handleTextChange('patient_age', text)}
                  keyboardType="numeric"
                  placeholderTextColor={currentColors.placeholderText}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                {backgroundColor: currentColors.primary},
              ]}
              onPress={handlePatientUpdate}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.saveButtonText}>Update Patient</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const {width} = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    margin: 10,
  },
  formContainer: {
    borderRadius: 15,
    padding: 10,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    height: 50,
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#888888',
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 5,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
});

export default UpdatePatient;
