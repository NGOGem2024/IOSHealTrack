import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {GestureHandlerRootView, ScrollView} from 'react-native-gesture-handler';
import axios from 'axios';
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
  const [doctorData, setDoctorData] = useState({
    doctor_first_name: '',
    doctor_last_name: '',
    doctor_email: '',
    doctor_phone: '',
    qualification: '',
    is_admin: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState(''); // New state for phone error

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
    const numericText = text.replace(/^\+91/, ''); // Remove "+91" if it's present
    if (/^\d{0,10}$/.test(numericText)) {
      setDoctorData({
        ...doctorData,
        doctor_phone: numericText,
      });
      setPhoneError(
        numericText.length < 10 ? 'Phone number must be 10 digits.' : '',
      );
    }
  };

  return (
    <ImageBackground
      source={require('../assets/bac2.jpg')}
      style={styles.backgroundImage}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <GestureHandlerRootView style={{flex: 1}}>
          <BackTabTop screenName="Doctor" />

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled">
            <Animatable.View animation="fadeInUp" style={styles.container}>
              <Text style={styles.title}>Register Doctor</Text>
              <Animatable.View
                animation="fadeInUp"
                style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={doctorData.doctor_first_name}
                  onChangeText={text =>
                    setDoctorData({...doctorData, doctor_first_name: text})
                  }
                />
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={200}
                style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={doctorData.doctor_last_name}
                  onChangeText={text =>
                    setDoctorData({...doctorData, doctor_last_name: text})
                  }
                />
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={400}
                style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={doctorData.doctor_email}
                  onChangeText={text =>
                    setDoctorData({...doctorData, doctor_email: text})
                  }
                />
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={600}
                style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="+91 Contact No."
                  value={'+91' + doctorData.doctor_phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="numeric"
                  maxLength={13} // Including the +91 prefix in the maxLength
                />
                {phoneError ? (
                  <Text style={styles.errorText}>{phoneError}</Text>
                ) : null}
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={800}
                style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Qualification"
                  value={doctorData.qualification}
                  onChangeText={text =>
                    setDoctorData({...doctorData, qualification: text})
                  }
                />
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={1000}
                style={styles.inputContainer}>
                <Text style={styles.labelText}>Role:</Text>
                <Picker
                  selectedValue={doctorData.is_admin}
                  style={styles.picker}
                  onValueChange={itemValue =>
                    setDoctorData({...doctorData, is_admin: itemValue})
                  }>
                  <Picker.Item label="Doctor" value={false} />
                  <Picker.Item label="Admin" value={true} />
                </Picker>
              </Animatable.View>
              <TouchableOpacity
                style={styles.button}
                onPress={handleDoctorRegister}
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
          </ScrollView>
        </GestureHandlerRootView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
  labelText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333333',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 5,
    padding: 10,
    color: '#333333',
    backgroundColor: '#FFFFFF',
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
  errorText: {
    color: 'red',
    marginTop: 5,
    fontSize: 14,
  },
});

export default DoctorRegister;
