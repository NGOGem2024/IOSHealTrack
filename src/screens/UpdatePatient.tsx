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
    <View style={styles.inputContainer}>
      {icon}
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.scrollContent}>
          <BackTabTop screenName="Patient" />
          <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
            <Text style={styles.title}>Update Patient</Text>
            {renderInputField(
              'patient_first_name',
              'First Name',
              <Icon name="person" size={24} color="#119FB3" />,
            )}
            {renderInputField(
              'patient_last_name',
              'Last Name',
              <Icon name="person" size={24} color="#119FB3" />,
            )}
            {renderInputField(
              'patient_email',
              'Email',
              <Icon name="email" size={24} color="#119FB3" />,
            )}
            {renderInputField(
              'patient_phone',
              'Contact No',
              <Icon name="phone" size={24} color="#119FB3" />,
              'numeric',
            )}
            {renderInputField(
              'patient_address1',
              'Address 1',
              <Icon name="location-on" size={24} color="#119FB3" />,
            )}
            {renderInputField(
              'patient_address2',
              'Address 2',
              <Icon name="location-on" size={24} color="#119FB3" />,
            )}
            {renderInputField(
              'patient_age',
              'Age',
              <Icon name="tag" size={24} color="#119FB3" />,
              'numeric',
            )}
            <DoctorPicker
              doctors={doctors}
              selectedDoctorId={patientData.doctor_id}
              onDoctorSelect={handleDoctorChange}
              isLoading={isLoading}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handlePatientUpdate}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollView: {
    backgroundColor: '#F0F8FF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F8FF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#119FB3',
    textAlign: 'center',
    marginBottom: 20,
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#888888',
  },
  picker: {
    flex: 1,
    marginLeft: 10,
    color: '#333333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: '#333333',
    fontSize: 16,
    paddingVertical: 12,
  },
  saveButton: {
    backgroundColor: '#119FB3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UpdatePatient;
