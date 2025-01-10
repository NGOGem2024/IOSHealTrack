import React, {useState, useEffect} from 'react';
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
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import * as Animatable from 'react-native-animatable';
import {useSession} from '../context/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import CustomPicker from './patientpicker';

type PatientRegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'PatientRegister'>;
};

// Define theme colors
const theme = {
  light: {
    background: '#FFFFFF',
    text: '#333333',
    primary: '#119FB3',
    cardBackground: '#FFFFFF',
    inputBackground: '#FFFFFF',
    inputText: '#333333',
    inputBorder: '#D9D9D9',
    placeholderText: '#666666',
    mandatoryField: '#c30010',
    optionalField: '#90EE90',
    filledField: '#90EE90',
  },
  dark: {
    background: '#121212',
    text: '#FFFFFF',
    primary: '#1FCAE8',
    cardBackground: '#1E1E1E',
    inputBackground: '#2C2C2C',
    inputText: '#FFFFFF',
    inputBorder: '#404040',
    placeholderText: '#888888',
    mandatoryField: '#FF6B6B',
    optionalField: '#2E7D32',
    filledField: '#2E7D32',
  },
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

const PatientRegister: React.FC<PatientRegisterScreenProps> = ({
  navigation,
}) => {
  const {session} = useSession();
  const [patientData, setPatientData] = useState(initialPatientData);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldStatus, setFieldStatus] = useState(initialFieldStatus);
  const [isDarkMode, setIsDarkMode] = useState(useColorScheme() === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const colors = theme[isDarkMode ? 'dark' : 'light'];

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
      patientData.referral_source !== 'walkin' &&
      !patientData.referral_details
    ) {
      handleError(new Error('Please enter referral details'));
      return;
    }

    setIsLoading(true);
    try {
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

    const baseStyle = {
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
      borderColor: colors.inputBorder,
    };

    if (fieldStatus[field]) {
      return [
        styles.input,
        {
          ...baseStyle,
          borderColor: colors.filledField,
        },
      ];
    }
    return [
      styles.input,
      {
        ...baseStyle,
        borderColor: isMandatory ? colors.mandatoryField : colors.optionalField,
      },
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
        placeholderTextColor={colors.placeholderText}
        value={value}
        onChangeText={text => handleInputChange(field, text)}
        keyboardType={keyboardType}
        autoCapitalize={field === 'patient_email' ? 'none' : 'sentences'}
      />
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../assets/bac2.jpg')}
        style={styles.backgroundImage}>
        <BackTabTop screenName="Patient" />
        <KeyboardAwareScrollView
          contentContainerStyle={[styles.scrollContainer]}
          enableOnAndroid={true}
          enableAutomaticScroll={Platform.OS === 'ios'}
          extraScrollHeight={100}
          keyboardShouldPersistTaps="handled">
          <View style={styles.centerContainer}>
            <Animatable.View
              animation="fadeInUp"
              style={[
                styles.container,
                {
                  backgroundColor: colors.cardBackground,
                  shadowColor: isDarkMode ? '#000000' : '#000000',
                },
              ]}>
              <Text style={[styles.title, {color: colors.primary}]}>
                Register Patient
              </Text>

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

              <Animatable.View
                animation="fadeInUp"
                style={styles.inputContainer}>
                <View
                  style={[
                    styles.phoneInputContainer,
                    getInputStyle('patient_phone'),
                  ]}>
                  <Text style={{color: colors.text}}>+91</Text>
                  <TextInput
                    style={[styles.phoneInput, {color: colors.inputText}]}
                    placeholder="Contact No."
                    placeholderTextColor={colors.placeholderText}
                    value={patientData.patient_phone}
                    onChangeText={text =>
                      handleInputChange('patient_phone', text)
                    }
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </Animatable.View>

              <Animatable.View
                animation="fadeInUp"
                style={styles.inputContainer}>
                <CustomPicker
                  selectedValue={patientData.referral_source}
                  onValueChange={itemValue =>
                    handleInputChange('referral_source', itemValue)
                  }
                  items={[
                    {label: 'Select Referral Source', value: ''},
                    {label: 'Social Media', value: 'Social Media'},
                    {label: 'Patient Reference', value: 'Patient Reference'},
                    {
                      label: 'Hospital Reference',
                      value: 'Hospital Reference',
                    },
                    {label: 'walkin', value: 'walkin'},
                    {label: 'Doctor Reference', value: 'Doctor Reference'},
                    {label: 'Other', value: 'Other'},
                  ]}
                  placeholder="Select Referral Source"
                  style={getInputStyle('referral_source')}
                  textColor={colors.inputText}
                />
              </Animatable.View>

              {patientData.referral_source &&
                patientData.referral_source !== 'Social Media' &&
                patientData.referral_source !== 'walkin' && (
                  <Animatable.View
                    animation="fadeInUp"
                    style={styles.inputContainer}>
                    <TextInput
                      style={getInputStyle('referral_details')}
                      placeholder="Referral Details"
                      placeholderTextColor={colors.placeholderText}
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
                    <CustomPicker
                      selectedValue={patientData.referral_details}
                      onValueChange={itemValue =>
                        handleInputChange('referral_details', itemValue)
                      }
                      items={[
                        {label: 'Select Social Media Platform', value: ''},
                        {label: 'Instagram', value: 'Instagram'},
                        {label: 'Facebook', value: 'Facebook'},
                        {label: 'WhatsApp', value: 'WhatsApp'},
                        {label: 'YouTube', value: 'YouTube'},
                        {label: 'Google', value: 'Google'},
                      ]}
                      placeholder="Select Social Media Platform"
                      style={getInputStyle('referral_details')}
                      textColor={colors.inputText}
                    />
                  </Animatable.View>
              )}

              <TouchableOpacity
                style={[styles.button, {backgroundColor: colors.primary}]}
                onPress={handlePatientRegister}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.backButton1,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => navigation.navigate('DoctorDashboard')}>
                <Text style={[styles.backButtonText1, {color: colors.primary}]}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </Animatable.View>
          </View>
        </KeyboardAwareScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
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

// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   KeyboardType,
//   Platform,
//   StyleSheet,
//   useColorScheme,
//   Appearance,
//   ImageBackground,
//   SafeAreaView,
// } from 'react-native';
// import {StackNavigationProp} from '@react-navigation/stack';
// import {RootStackParamList} from '../types/types';
// import {GestureHandlerRootView} from 'react-native-gesture-handler';
// import * as Animatable from 'react-native-animatable';
// import {useSession} from '../context/SessionContext';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {Picker} from '@react-native-picker/picker';
// import {handleError, showSuccessToast} from '../utils/errorHandler';
// import axiosInstance from '../utils/axiosConfig';
// import BackTabTop from './BackTopTab';
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
// import CustomPicker from './patientpicker';

// type PatientRegisterScreenProps = {
//   navigation: StackNavigationProp<RootStackParamList, 'PatientRegister'>;
// };

// // Define theme colors
// const theme = {
//   light: {
//     background: '#FFFFFF',
//     text: '#333333',
//     primary: '#119FB3',
//     cardBackground: '#FFFFFF',
//     inputBackground: '#FFFFFF',
//     inputText: '#333333',
//     inputBorder: '#D9D9D9',
//     placeholderText: '#666666',
//     mandatoryField: '#c30010',
//     optionalField: '#90EE90',
//     filledField: '#90EE90',
//   },
//   dark: {
//     background: '#121212',
//     text: '#FFFFFF',
//     primary: '#1FCAE8',
//     cardBackground: '#1E1E1E',
//     inputBackground: '#2C2C2C',
//     inputText: '#FFFFFF',
//     inputBorder: '#404040',
//     placeholderText: '#888888',
//     mandatoryField: '#FF6B6B',
//     optionalField: '#2E7D32',
//     filledField: '#2E7D32',
//   },
// };

// const initialPatientData = {
//   patient_first_name: '',
//   patient_last_name: '',
//   patient_email: '',
//   patient_phone: '',
//   referral_source: '',
//   referral_details: '',
// };

// interface FieldStatus {
//   patient_first_name: boolean;
//   patient_last_name: boolean;
//   patient_email: boolean;
//   patient_phone: boolean;
//   referral_source: boolean;
//   referral_details: boolean;
//   [key: string]: boolean;
// }

// const initialFieldStatus: FieldStatus = {
//   patient_first_name: false,
//   patient_last_name: false,
//   patient_email: false,
//   patient_phone: false,
//   referral_source: false,
//   referral_details: false,
// };

// const PatientRegister: React.FC<PatientRegisterScreenProps> = ({
//   navigation,
// }) => {
//   const {session} = useSession();
//   const [patientData, setPatientData] = useState(initialPatientData);
//   const [isLoading, setIsLoading] = useState(false);
//   const [fieldStatus, setFieldStatus] = useState(initialFieldStatus);
//   const [isDarkMode, setIsDarkMode] = useState(useColorScheme() === 'dark');

//   useEffect(() => {
//     const subscription = Appearance.addChangeListener(({colorScheme}) => {
//       setIsDarkMode(colorScheme === 'dark');
//     });

//     return () => {
//       subscription.remove();
//     };
//   }, []);

//   const colors = theme[isDarkMode ? 'dark' : 'light'];

//   const handleInputChange = (field: string, value: string) => {
//     let newValue = value;
//     if (field === 'patient_first_name' || field === 'patient_last_name') {
//       newValue = value.replace(/[^a-zA-Z\s]/g, '');
//     } else if (field === 'patient_phone') {
//       newValue = value.replace(/[^0-9]/g, '');
//     } else if (field === 'patient_email') {
//       newValue = value.toLowerCase();
//     }
//     setPatientData({...patientData, [field]: newValue});
//     setFieldStatus({...fieldStatus, [field]: newValue.length > 0});
//   };

//   const isValidEmail = (email: string) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const handlePatientRegister = async () => {
//     if (!patientData.patient_first_name || !patientData.patient_last_name) {
//       handleError(new Error('First name and last name are required'));
//       return;
//     }

//     if (patientData.patient_phone.length !== 10) {
//       handleError(new Error('Please enter a valid 10-digit phone number'));
//       return;
//     }

//     if (patientData.patient_email && !isValidEmail(patientData.patient_email)) {
//       handleError(new Error('Please enter a valid email address'));
//       return;
//     }

//     if (!patientData.referral_source) {
//       handleError(new Error('Please select a referral source'));
//       return;
//     }

//     if (
//       patientData.referral_source !== 'Social Media' &&
//       patientData.referral_source !== 'walkin' &&
//       !patientData.referral_details
//     ) {
//       handleError(new Error('Please enter referral details'));
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const formattedData = {
//         ...patientData,
//         patient_phone: '+91' + patientData.patient_phone,
//       };

//       const response = await axiosInstance.post(
//         '/patient/registration',
//         formattedData,
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: 'Bearer ' + session.idToken,
//           },
//         },
//       );
//       showSuccessToast('Patient registered successfully');
//       setPatientData(initialPatientData);
//       setFieldStatus(initialFieldStatus);
//       navigation.navigate('UpdatePatient', {
//         patientId: response.data.patient._id,
//       });
//     } catch (error) {
//       handleError(error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getInputStyle = (field: string) => {
//     const isMandatory = [
//       'patient_first_name',
//       'patient_last_name',
//       'patient_phone',
//       'referral_source',
//     ].includes(field);

//     const baseStyle = {
//       backgroundColor: colors.inputBackground,
//       color: colors.inputText,
//       borderColor: colors.inputBorder,
//     };

//     if (fieldStatus[field]) {
//       return [
//         styles.input,
//         {
//           ...baseStyle,
//           borderColor: colors.filledField,
//         },
//       ];
//     }
//     return [
//       styles.input,
//       {
//         ...baseStyle,
//         borderColor: isMandatory ? colors.mandatoryField : colors.optionalField,
//       },
//     ];
//   };

//   // const renderInput = (
//   //   placeholder: string,
//   //   value: string,
//   //   field: string,
//   //   keyboardType: KeyboardType = 'default',
//   //   isMandatory: boolean = false,
//   // ) => (
//   //   <Animatable.View animation="fadeInUp" style={styles.inputContainer}>
//   //     <TextInput
//   //       style={getInputStyle(field)}
//   //       placeholder={placeholder}
//   //       placeholderTextColor={colors.placeholderText}
//   //       value={value}
//   //       onChangeText={text => handleInputChange(field, text)}
//   //       keyboardType={keyboardType}
//   //       autoCapitalize={field === 'patient_email' ? 'none' : 'sentences'}
//   //     />
//   //   </Animatable.View>
//   // );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       {/* <ImageBackground
//         source={require('../assets/bac2.jpg')}
//         style={styles.backgroundImage}> */}
//       <BackTabTop screenName="Patient" />
//       <KeyboardAwareScrollView
//         contentContainerStyle={styles.scrollContainer}
//         enableOnAndroid={true}
//         enableAutomaticScroll={Platform.OS === 'ios'}
//         keyboardShouldPersistTaps="handled">
//         <View style={styles.formContainer}>
//           <Text style={styles.title}>Register Patient</Text>

//           <View style={styles.inputWrapper}>
//             <TextInput
//               style={styles.input}
//               placeholder="First Name"
//               placeholderTextColor="#A0A0A0"
//               value={patientData.patient_first_name}
//               onChangeText={text =>
//                 handleInputChange('patient_first_name', text)
//               }
//             />
//           </View>

//           <View style={styles.inputWrapper}>
//             <TextInput
//               style={styles.input}
//               placeholder="Last Name"
//               placeholderTextColor="#A0A0A0"
//               value={patientData.patient_last_name}
//               onChangeText={text =>
//                 handleInputChange('patient_last_name', text)
//               }
//             />
//           </View>

//           <View style={styles.inputWrapper}>
//             <TextInput
//               style={styles.input}
//               placeholder="Email (Optional)"
//               placeholderTextColor="#A0A0A0"
//               keyboardType="email-address"
//               value={patientData.patient_email}
//               onChangeText={text => handleInputChange('patient_email', text)}
//               autoCapitalize="none"
//             />
//           </View>

//           <View style={styles.inputWrapper}>
//             <View style={styles.phoneContainer}>
//               <Text style={styles.phonePrefix}>+91</Text>
//               <TextInput
//                 style={styles.phoneInput}
//                 placeholder="Phone Number"
//                 placeholderTextColor="#A0A0A0"
//                 keyboardType="numeric"
//                 maxLength={10}
//                 value={patientData.patient_phone}
//                 onChangeText={text => handleInputChange('patient_phone', text)}
//               />
//             </View>
//           </View>

//           <View style={styles.inputWrapper}>
//             <CustomPicker
//               selectedValue={patientData.referral_source}
//               onValueChange={itemValue =>
//                 handleInputChange('referral_source', itemValue)
//               }
//               items={[
//                 {label: 'Select Referral Source', value: ''},
//                 {label: 'Social Media', value: 'Social Media'},
//                 {label: 'Patient Reference', value: 'Patient Reference'},
//                 {label: 'Hospital Reference', value: 'Hospital Reference'},
//                 {label: 'walkin', value: 'walkin'},
//                 {label: 'Doctor Reference', value: 'Doctor Reference'},
//                 {label: 'Other', value: 'Other'},
//               ]}
//               placeholder="Select Referral Source"
//               style={styles.picker}
//             />
//           </View>

//           {patientData.referral_source &&
//             patientData.referral_source !== 'Social Media' &&
//             patientData.referral_source !== 'walkin' && (
//               <View style={styles.inputWrapper}>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Referral Details"
//                   placeholderTextColor="#A0A0A0"
//                   value={patientData.referral_details}
//                   onChangeText={text =>
//                     handleInputChange('referral_details', text)
//                   }
//                 />
//               </View>
//             )}

//           {patientData.referral_source === 'Social Media' && (
//             <View>
//               <CustomPicker
//                 selectedValue={patientData.referral_details}
//                 onValueChange={itemValue =>
//                   handleInputChange('referral_details', itemValue)
//                 }
//                 items={[
//                   {label: 'Select Social Media Platform', value: ''},
//                   {label: 'Instagram', value: 'Instagram'},
//                   {label: 'Facebook', value: 'Facebook'},
//                   {label: 'WhatsApp', value: 'WhatsApp'},
//                   {label: 'YouTube', value: 'YouTube'},
//                   {label: 'Google', value: 'Google'},
//                 ]}
//                 placeholder="Select Social Media Platform"
//                 style={getInputStyle('referral_details')}
//                 textColor={colors.inputText}
//               />
//             </View>
//           )}

//           <TouchableOpacity
//             style={styles.button}
//             onPress={handlePatientRegister}
//             disabled={isLoading}>
//             {isLoading ? (
//               <ActivityIndicator size="small" color="#FFFFFF" />
//             ) : (
//               <Text style={styles.buttonText}>Register</Text>
//             )}
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.backButton1}
//             onPress={() => navigation.navigate('DoctorDashboard')}>
//             <Text style={styles.backButtonText1}>Back to Home</Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAwareScrollView>
//       {/* </ImageBackground> */}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   backgroundImage: {
//     flex: 1,
//     resizeMode: 'cover',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     paddingTop: 40,
//   },
//   formContainer: {
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 20,
//     marginTop: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#14a0b3',
//     marginBottom: 30,
//     textAlign: 'center',
//   },
//   inputWrapper: {
//     marginBottom: 16,
//   },
//   input: {
//     backgroundColor: '#F5F5F5',
//     borderRadius: 10,
//     padding: 15,
//     fontSize: 16,
//     color: '#333',
//     width: '100%',
//   },
//   inputContainer: {
//     color: 'pink',
//   },
//   phoneContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F5F5F5',
//     borderRadius: 10,
//     paddingHorizontal: 15,
//   },
//   phonePrefix: {
//     fontSize: 16,
//     color: '#333',
//     marginRight: 10,
//   },
//   phoneInput: {
//     flex: 1,
//     padding: 15,
//     fontSize: 16,
//     color: '#333',
//   },
//   picker: {
//     backgroundColor: '#F5F5F5',
//     borderRadius: 10,
//     width: '100%',
//   },
//   button: {
//     backgroundColor: '#14a0b3',
//     borderRadius: 10,
//     padding: 15,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 15,
//     fontWeight: '600',
//   },
//   backButton1: {
//     backgroundColor: '#119FB3',
//     paddingVertical: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   backButtonText1: {
//     color: 'white',
//     fontSize: 15,
//     fontWeight: '600',
//   },
// });

// export default PatientRegister;
