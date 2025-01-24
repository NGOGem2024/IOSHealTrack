import React, {useState, useEffect, useCallback, memo} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  KeyboardTypeOptions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {ScrollView} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import {Picker} from '@react-native-picker/picker';
import DoctorPicker from './DoctorPickerUpdate';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

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

interface InputFieldProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  field: keyof PatientData;
}

// Memoized Input Field Component
const InputField = memo<InputFieldProps>(
  ({
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    editable = true,
  }) => (
    <View style={styles.inputWrapper}>
      <View style={styles.inputContainer}>
        <View style={styles.iconContainer}>{icon}</View>
        <TextInput
          style={[styles.input, !editable && styles.disabledInput]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor="#A0A0A0"
          editable={editable}
        />
      </View>
    </View>
  ),
);

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

  // Memoize text change handler
  const handleTextChange = useCallback(
    (field: keyof PatientData, value: string) => {
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
        // Fetch both patient and doctor data in parallel
        await Promise.all([fetchPatientData(), fetchDoctors()]);
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const handlePatientUpdate = useCallback(async () => {
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

  // Memoize input field creation
  const renderInputField = useCallback(
    (
      field: keyof PatientData,
      placeholder: string,
      icon: React.ReactNode,
      keyboardType: KeyboardTypeOptions = 'default',
    ) => (
      <InputField
        key={field}
        field={field}
        icon={icon}
        placeholder={placeholder}
        value={patientData[field]}
        onChangeText={text => handleTextChange(field, text)}
        keyboardType={keyboardType}
      />
    ),
    [patientData, handleTextChange],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTabTop screenName="Patient" />
      <KeyboardAwareScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={50}>
        <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
          <View style={styles.formContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Update Patient Profile</Text>
            </View>

            {renderInputField(
              'patient_first_name',
              'First Name',
              <Icon name="person" size={24} color="#007B8E" />,
            )}
            {renderInputField(
              'patient_last_name',
              'Last Name',
              <Icon name="person" size={24} color="#007B8E" />,
            )}
            {renderInputField(
              'patient_email',
              'Email Address',
              <Icon name="email" size={24} color="#007B8E" />,
            )}
            {renderInputField(
              'patient_phone',
              'Contact Number',
              <Icon name="phone" size={24} color="#007B8E" />,
              'numeric',
            )}
            <DoctorPicker
              doctors={doctors}
              selectedDoctorId={patientData.doctor_id}
              onDoctorSelect={handleDoctorChange}
              isLoading={isLoading}
            />
            {renderInputField(
              'patient_address1',
              'Primary Address',
              <Icon name="location-on" size={24} color="#007B8E" />,
            )}
            {renderInputField(
              'patient_address2',
              'Secondary Address',
              <Icon name="location-on" size={24} color="#007B8E" />,
            )}
            {renderInputField(
              'patient_age',
              'Age',
              <Icon name="tag" size={24} color="#007B8E" />,
              'numeric',
            )}
            <TouchableOpacity
              style={styles.saveButton}
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
    </SafeAreaView>
  );
};
const {width} = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollView: {
    backgroundColor: '#F0F4F8',
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
    backgroundColor: 'white',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007B8E',
    paddingHorizontal: 15,
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#333333',
    fontSize: 16,
    paddingVertical: 12,
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#888888',
  },
  saveButton: {
    backgroundColor: '#007B8E',
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
    marginLeft: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007B8E',
    margin: 5,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  picker: {
    flex: 1,
    marginLeft: 10,
    color: '#333333',
  },
});

export default UpdatePatient;
