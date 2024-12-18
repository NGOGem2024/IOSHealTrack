import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  KeyboardType,
  Platform,
  StyleSheet,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {GestureHandlerRootView, ScrollView} from 'react-native-gesture-handler';
import axios from 'axios';
import * as Animatable from 'react-native-animatable';
import {useSession} from '../context/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

type PatientRegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'PatientRegister'>;
};

const initialPatientData = {
  patient_first_name: '',
  patient_last_name: '',
  patient_email: '',
  patient_phone: '',
  referral_source: '',
  referral_details: '',
};

interface FieldStatus {
  patient_first_name: boolean;
  patient_last_name: boolean;
  patient_email: boolean;
  patient_phone: boolean;
  referral_source: boolean;
  referral_details: boolean;
  [key: string]: boolean; // Index signature to avoid TypeScript error
}

const initialFieldStatus: FieldStatus = {
  patient_first_name: false,
  patient_last_name: false,
  patient_email: false,
  patient_phone: false,
  referral_source: false,
  referral_details: false,
};

const PatientRegister: React.FC<PatientRegisterScreenProps> = ({
  navigation,
}) => {
  const {session} = useSession();
  const [patientData, setPatientData] = useState(initialPatientData);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldStatus, setFieldStatus] = useState(initialFieldStatus);

  const handleInputChange = (field: string, value: string) => {
    let newValue = value;
    if (field === 'patient_first_name' || field === 'patient_last_name') {
      newValue = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (field === 'patient_phone') {
      newValue = value.replace(/[^0-9]/g, '');
    } else if (field === 'patient_email') {
      newValue = value.toLowerCase();
    }
    setPatientData({...patientData, [field]: newValue});
    setFieldStatus({...fieldStatus, [field]: newValue.length > 0});
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePatientRegister = async () => {
    if (!patientData.patient_first_name || !patientData.patient_last_name) {
      handleError(new Error('First name and last name are required'));
      return;
    }

    if (patientData.patient_phone.length !== 10) {
      handleError(new Error('Please enter a valid 10-digit phone number'));
      return;
    }

    if (patientData.patient_email && !isValidEmail(patientData.patient_email)) {
      handleError(new Error('Please enter a valid email address'));
      return;
    }

    if (!patientData.referral_source) {
      handleError(new Error('Please select a referral source'));
      return;
    }

    if (
      patientData.referral_source !== 'Social Media' &&
      !patientData.referral_details
    ) {
      handleError(new Error('Please enter referral details'));
      return;
    }

    setIsLoading(true);
    try {
      const liveSwitchToken = await AsyncStorage.getItem('liveSwitchToken');
      const formattedData = {
        ...patientData,
        patient_phone: '+91' + patientData.patient_phone,
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

  const getInputStyle = (field: string) => {
    const isMandatory = [
      'patient_first_name',
      'patient_last_name',
      'patient_phone',
      'referral_source',
    ].includes(field);
    if (fieldStatus[field]) {
      return [styles.input, styles.filledInput];
    }
    return [
      styles.input,
      isMandatory ? styles.mandatoryInput : styles.optionalInput,
    ];
  };

  const renderInput = (
    placeholder: string,
    value: string,
    field: string,
    keyboardType: KeyboardType = 'default',
    isMandatory: boolean = false,
  ) => (
    <Animatable.View animation="fadeInUp" style={styles.inputContainer}>
      <TextInput
        style={getInputStyle(field)}
        placeholder={placeholder}
        value={value}
        onChangeText={text => handleInputChange(field, text)}
        keyboardType={keyboardType}
        autoCapitalize={field === 'patient_email' ? 'none' : 'sentences'}
      />
    </Animatable.View>
  );

  return (
    <ImageBackground
      source={require('../assets/bac2.jpg')}
      style={styles.backgroundImage}>
      <BackTabTop screenName="Patient" />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid={true}
        enableAutomaticScroll={Platform.OS === 'ios'}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled">
        <View style={styles.centerContainer}>
          <Animatable.View animation="fadeInUp" style={styles.container}>
            <Text style={styles.title}>Register Patient</Text>
            {renderInput(
              'First Name',
              patientData.patient_first_name,
              'patient_first_name',
              'default',
              true,
            )}
            {renderInput(
              'Last Name',
              patientData.patient_last_name,
              'patient_last_name',
              'default',
              true,
            )}
            {renderInput(
              'Email',
              patientData.patient_email,
              'patient_email',
              'email-address',
            )}
            {/* Phone input */}
            <Animatable.View animation="fadeInUp" style={styles.inputContainer}>
              <View
                style={[
                  styles.phoneInputContainer,
                  getInputStyle('patient_phone'),
                ]}>
                <Text style={styles.phonePrefix}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Contact No."
                  value={patientData.patient_phone}
                  onChangeText={text =>
                    handleInputChange('patient_phone', text)
                  }
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </Animatable.View>
            {/* Referral source picker */}
            <Animatable.View animation="fadeInUp" style={styles.inputContainer}>
              <View style={getInputStyle('referral_source')}>
                <Picker
                  selectedValue={patientData.referral_source}
                  style={styles.picker}
                  onValueChange={itemValue =>
                    handleInputChange('referral_source', itemValue)
                  }>
                  <Picker.Item label="Select Referral Source" value="" />
                  <Picker.Item label="Social Media" value="Social Media" />
                  <Picker.Item
                    label="Patient Reference"
                    value="Patient Reference"
                  />
                  <Picker.Item
                    label="Hospital Reference"
                    value="Hospital Reference"
                  />
                  <Picker.Item
                    label="Doctor Reference"
                    value="Doctor Reference"
                  />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </Animatable.View>
            {/* Conditional referral details input */}
            {patientData.referral_source &&
              patientData.referral_source !== 'Social Media' && (
                <Animatable.View
                  animation="fadeInUp"
                  style={styles.inputContainer}>
                  <TextInput
                    style={getInputStyle('referral_details')}
                    placeholder="Referral Details"
                    value={patientData.referral_details}
                    onChangeText={text =>
                      handleInputChange('referral_details', text)
                    }
                  />
                </Animatable.View>
              )}
            {patientData.referral_source === 'Social Media' && (
              <Animatable.View
                animation="fadeInUp"
                style={styles.inputContainer}>
                <View style={getInputStyle('referral_details')}>
                  <Picker
                    selectedValue={patientData.referral_details}
                    style={styles.picker}
                    onValueChange={itemValue =>
                      handleInputChange('referral_details', itemValue)
                    }>
                    <Picker.Item
                      label="Select Social Media Platform"
                      value=""
                    />
                    <Picker.Item label="Instagram" value="Instagram" />
                    <Picker.Item label="Facebook" value="Facebook" />
                    <Picker.Item label="WhatsApp" value="WhatsApp" />
                    <Picker.Item label="YouTube" value="YouTube" />
                    <Picker.Item label="Google" value="Google" />
                  </Picker>
                </View>
              </Animatable.View>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={handlePatientRegister}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton1}
              onPress={() => navigation.navigate('DoctorDashboard')}>
              <Text style={styles.backButtonText1}>Back to Home</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  phoneInput: {
    flex: 1,
    padding: 5,
    color: '#333333',
  },
  picker: {
    height: 45,
    width: '100%',
    color: '#333333',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 10,
  },

  mandatoryInput: {
    borderColor: '#c30010', // Yellow for mandatory fields
  },
  optionalInput: {
    borderColor: '#90EE90', // Light green for optional fields
  },
  filledInput: {
    borderColor: '#90EE90', // Bright green for filled fields
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  phonePrefix: {
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#119FB3',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#119FB3',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 10, // Reduced from 20 to 10
  },
  button: {
    backgroundColor: '#119FB3',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  backButton1: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#119FB3',
  },
  backButtonText1: {
    color: '#119FB3',
    fontWeight: 'bold',
  },
  asterisk: {
    color: 'red',
    fontSize: 14,
    marginBottom: 2, // Reduced from 5 to 2
  },
});

export default PatientRegister;
