import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import {Picker} from '@react-native-picker/picker';
import BackTopTab from '../screens/BackTopTab';
import {useTheme} from '../screens/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LocationPicker from './BottomTab/HospitalLocation';
import moment from 'moment-timezone';
import {useFocusEffect} from '@react-navigation/native';
import AvailableSlots from '../screens/AvailableSlots';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import BookAppSkeletonLoader from '../components/BookAppSkeletonLoader';

type CreateConsultationScreenProps = StackScreenProps<
  RootStackParamList,
  'SetupConsultation'
>;

const SLOT_DURATION_OPTIONS = [
  {value: 30, label: '30 minutes'},
  {value: 60, label: '1 Hour'},
  {value: 90, label: '1:30 Hour'},
  {value: 120, label: '2 Hour'},
];

const SetupConsultationScreen: React.FC<CreateConsultationScreenProps> = ({
  navigation,
  route,
}) => {
  const {patientId, appointmentId} = route.params;
  const {session} = useSession();
  const {theme, isDarkMode} = useTheme();
  const styles = createStyles(theme.colors, isDarkMode);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>('In Clinic');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [therapyPlans, setTherapyPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedSlotDuration, setSelectedSlotDuration] = useState(30);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [showSlotDurationPicker, setShowSlotDurationPicker] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [showTherapyPicker, setShowTherapyPicker] = useState(false);

  // Consultation specific fields
  const [patientSymptoms, setPatientSymptoms] = useState<string>('');
  const [therapyReason, setTherapyReason] = useState<string>('');

  const appointmentTypes = ['In Clinic', 'In Home', 'IP/ICU', 'Online'];

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  const resetScrollPosition = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: 0, animated: false});
    }
  };

  const openDoctorPicker = () => {
    setShowDoctorPicker(true);
    resetScrollPosition();
  };

  // Initial data fetching
  useEffect(() => {
    fetchDoctors();
    fetchTherapyPlans();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTherapyPlans();
      return () => {};
    }, [patientId, session.idToken]),
  );

  useEffect(() => {
    if (therapyPlans.length > 0) {
      const latestPlan = therapyPlans[therapyPlans.length - 1];
      setSelectedPlan(latestPlan);
    }
  }, [therapyPlans]);

  useEffect(() => {
    if (doctors.length > 0 && session.doctor_id) {
      const defaultDoctor = doctors.find(
        doctor => doctor._id === session.doctor_id,
      );
      if (defaultDoctor) {
        setSelectedDoctor(defaultDoctor);
      }
    }
  }, [doctors, session.doctor_id]);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/getalldoctor', {
        headers: {
          Authorization: `Bearer ${session.idToken}`,
        },
      });
      setDoctors(response.data.doctors);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTherapyPlans = async () => {
    try {
      const response = await axiosInstance.get(`/get/plans/${patientId}`, {
        headers: {
          Authorization: `Bearer ${session.idToken}`,
        },
      });
      setTherapyPlans(response.data.therapy_plans || []);
    } catch (error) {
      handleError(error);
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  const generateAvailableSlots = (
    slotDuration: number = 30,
    selectedDate?: Date,
  ) => {
    const now = moment.tz('Asia/Kolkata');
    const today = moment(now).startOf('day');

    const isToday = selectedDate
      ? moment(selectedDate).format('YYYY-MM-DD') === today.format('YYYY-MM-DD')
      : true;

    const workingHours = {
      start: moment(today).hour(9).minute(0),
      end: moment(today).hour(21).minute(0),
    };

    const slots = [];
    let currentSlotTime = moment(workingHours.start);

    while (currentSlotTime.isBefore(workingHours.end)) {
      const slotStart = moment(currentSlotTime);
      const slotEnd = moment(currentSlotTime).add(slotDuration, 'minutes');

      if (slotEnd.isAfter(workingHours.end)) break;

      if (!isToday || slotEnd.isAfter(now)) {
        slots.push({
          start: slotStart.format('HH:mm'),
          end: slotEnd.format('HH:mm'),
          duration: slotDuration,
          status: 'free',
        });
      }

      currentSlotTime.add(slotDuration >= 60 ? 30 : slotDuration, 'minutes');
    }

    return slots;
  };

  const renderPickerField = (
    value: string | undefined,
    onPress: () => void,
    placeholder: string,
  ) => {
    return (
      <TouchableOpacity style={styles.pickerField} onPress={onPress}>
        <Text
          style={[styles.pickerFieldText, !value && styles.pickerPlaceholder]}>
          {value || placeholder}
        </Text>
        <Icon name="arrow-drop-down" size={24} color="#007B8E" />
      </TouchableOpacity>
    );
  };

  const renderSlotDurationPicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          {renderPickerField(
            `${selectedSlotDuration} minutes`,
            () => setShowSlotDurationPicker(true),
            'Select slot duration',
          )}
          <Modal
            visible={showSlotDurationPicker}
            transparent={true}
            animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Duration</Text>
                  <TouchableOpacity
                    onPress={() => setShowSlotDurationPicker(false)}
                    style={styles.doneButton}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={selectedSlotDuration}
                  onValueChange={itemValue => {
                    setSelectedSlotDuration(itemValue);
                  }}
                  style={styles.iosPicker}>
                  {SLOT_DURATION_OPTIONS.map(option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      color={isDarkMode ? '#FFFFFF' : undefined}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </Modal>
        </>
      );
    }

    return (
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedSlotDuration}
          onValueChange={itemValue => setSelectedSlotDuration(itemValue)}
          style={styles.picker}
          dropdownIconColor="#007b8e">
          {SLOT_DURATION_OPTIONS.map(option => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>
    );
  };

  const renderDoctorPicker = () => {
    const doctorName = selectedDoctor
      ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
      : undefined;

    return (
      <>
        {renderPickerField(doctorName, openDoctorPicker, 'Select a doctor')}
        <Modal
          visible={showDoctorPicker}
          transparent={true}
          animationType="slide"
          onShow={resetScrollPosition}>
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Doctor</Text>
                <TouchableOpacity
                  onPress={() => setShowDoctorPicker(false)}
                  style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                ref={scrollViewRef}
                style={styles.iosPickerContainer}
                contentContainerStyle={styles.scrollContentContainer}>
                {doctors.map(doctor => (
                  <TouchableOpacity
                    key={doctor._id}
                    style={[
                      styles.doctorItem,
                      selectedDoctor?._id === doctor._id &&
                        styles.selectedDoctorItem,
                    ]}
                    onPress={() => {
                      setSelectedDoctor(doctor);
                      setShowDoctorPicker(false);
                      setAvailableSlots([]);
                      setSelectedSlot(null);
                    }}>
                    <Text
                      style={[
                        styles.doctorItemText,
                        selectedDoctor?._id === doctor._id &&
                          styles.selectedDoctorItemText,
                      ]}>
                      {`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  };


  const handleBookConsultation = async () => {
    try {
      if (!session.idToken) {
        throw new Error('Please log in to book a consultation.');
      }

      if (selectedSlot === null || selectedSlot === undefined) {
        throw new Error('Select a time slot');
      }

      if (!selectedDoctor) {
        throw new Error('Please select a doctor for the consultation.');
      }

      if (!selectedLocation) {
        throw new Error('Please select a location for the consultation.');
      }

      setIsBooking(true);

      const slots = availableSlots.length
        ? availableSlots
        : generateAvailableSlots(selectedSlotDuration);

      const requestBody = {
        contactId: patientId,
        therepy_type: appointmentType,
        therepy_date: selectedDate.toISOString().split('T')[0],
        therepy_start_time: slots[selectedSlot].start,
        therepy_end_time: slots[selectedSlot].end,
        doctor_id: selectedDoctor._id,
        doctor_name: `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`,
        doctor_email: selectedDoctor.doctor_email,
        plan_id: selectedPlan?._id,
        location_id: selectedLocation?._id,
        location_name: selectedLocation?.name,
        location_address: selectedLocation?.address,
        appointmentId: appointmentId || null,
        // Consultation-specific fields (now optional)
        patientSymptoms: patientSymptoms.trim() || '',
        therapy_reason: therapyReason.trim() || '',
      };

      const response = await axiosInstance.post(
        `/patient/${patientId}/consultations`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        showSuccessToast('Consultation booked successfully');
        navigation.goBack();
      } else {
        throw new Error('Failed to book consultation. Please try again.');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.safeArea}>
        <StatusBar
          backgroundColor={theme.colors.background}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <BackTopTab screenName="Create Consultation" />
        <BookAppSkeletonLoader theme={theme} isDarkMode={isDarkMode} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      style={{flex: 1}}>
      <View style={styles.safeArea}>
        <View style={styles.container}>
          <BackTopTab screenName="Create Consultation" />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Book Consultation</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Doctor</Text>
              {renderDoctorPicker()}
            </View>


            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Consultation Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.appointmentTypesScrollView}
                style={styles.appointmentTypesScrollViewContainer}>
                {appointmentTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      appointmentType === type && styles.selectedTypeButton,
                      {marginRight: 10},
                    ]}
                    onPress={() => setAppointmentType(type)}>
                    <Text
                      style={[
                        styles.typeButtonText,
                        appointmentType === type &&
                          styles.selectedTypeButtonText,
                      ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Location</Text>
              <LocationPicker
                selectedLocation={selectedLocation}
                onLocationSelect={location => setSelectedLocation(location)}
                disabled={false}
                showSetAsDefault={true}
                autoSelectPreferred={true}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Date</Text>
              <View style={styles.dateSelector}>
                <TouchableOpacity onPress={() => changeDate(-1)}>
                  <Icon name="chevron-left" size={24} color="#007B8E" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>
                    {formatDate(selectedDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeDate(1)}>
                  <Icon name="chevron-right" size={24} color="#007B8E" />
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Slot Duration</Text>
              {renderSlotDurationPicker()}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Slots</Text>
              <AvailableSlots
                slotDuration={selectedSlotDuration}
                selectedDate={selectedDate}
                onSelectSlot={(slotIndex, slot) => {
                  setSelectedSlot(slotIndex);
                  if (!availableSlots.length) {
                    const generatedSlots = generateAvailableSlots(
                      selectedSlotDuration,
                      selectedDate,
                    );
                    setAvailableSlots(generatedSlots);
                  }
                }}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Patient Symptoms 
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={patientSymptoms}
                onChangeText={setPatientSymptoms}
                placeholder="Describe patient symptoms (optional)"
                placeholderTextColor={`${theme.colors.text}80`}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Therapy Reason
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={therapyReason}
                onChangeText={setTherapyReason}
                placeholder="Describe the reason for therapy (optional)"
                placeholderTextColor={`${theme.colors.text}80`}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>

          {isBooking && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007B8E" />
            </View>
          )}

          <TouchableOpacity
            style={[styles.bookButton, isBooking && {opacity: 0.5}]}
            onPress={handleBookConsultation}
            disabled={isBooking}>
            <Text style={styles.bookButtonText}>
              {isBooking ? 'Booking...' : 'Book Consultation'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#007B8E',
      textAlign: 'center',
      marginBottom: 20,
      marginTop: 25,
    },
    section: {
      padding: 16,
      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
      marginBottom: 8,
      borderRadius: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      marginHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#007B8E',
      marginBottom: 12,
    },
    required: {
      color: '#FF0000',
    },
    optional: {
      color: '#888888',
      fontWeight: 'normal',
      fontSize: 14,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
    },
    pickerWrapper: {
      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? colors.border : '#E0E0E0',
      marginTop: 8,
      overflow: 'hidden',
    },
    picker: {
      backgroundColor: 'transparent',
      color: colors.text,
      paddingVertical: 8,
      marginTop: 0,
      marginBottom: 0,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    doneButton: {
      padding: 8,
    },
    doneButtonText: {
      color: '#007B8E',
      fontSize: 16,
      fontWeight: '600',
    },
    iosPicker: {
      backgroundColor: colors.card,
      height: 215,
    },
    pickerField: {
      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
      borderRadius: 10,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? colors.border : '#E0E0E0',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pickerFieldText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    pickerPlaceholder: {
      color: `${colors.text}80`,
    },
    typeButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#007B8E',
      marginRight: 10,
      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
    },
    selectedTypeButton: {
      backgroundColor: '#007B8E',
    },
    typeButtonText: {
      color: '#007B8E',
    },
    selectedTypeButtonText: {
      color: '#FFFFFF',
    },
    dateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    dateText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    input: {
      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDarkMode ? colors.border : '#E0E0E0',
      borderRadius: 10,
      padding: 12,
      marginTop: 8,
      color: colors.text,
      fontSize: 16,
    },
    multilineInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDarkMode
        ? 'rgba(18, 18, 18, 0.8)'
        : 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    bookButton: {
      backgroundColor: '#007B8E',
      padding: 16,
      alignItems: 'center',
      margin: 16,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    appointmentTypesScrollView: {
      flexGrow: 1,
      alignItems: 'center',
      paddingRight: 16,
    },
    appointmentTypesScrollViewContainer: {
      maxHeight: 80,
    },
    iosPickerContainer: {
      maxHeight: 300,
      width: '100%',
    },
    scrollContentContainer: {
      paddingBottom: 20,
    },
    doctorItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedDoctorItem: {
      backgroundColor: '#007B8E20',
    },
    doctorItemText: {
      fontSize: 16,
      color: colors.text,
    },
    selectedDoctorItemText: {
      color: '#007B8E',
      fontWeight: 'bold',
    },
  });

export default SetupConsultationScreen;