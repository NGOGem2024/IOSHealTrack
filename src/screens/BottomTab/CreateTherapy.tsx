import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ConfirmationPopup from './confirmationpopup';
import moment from 'moment-timezone';
import {useSession} from '../../context/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
import {handleError, showSuccessToast} from '../../utils/errorHandler';
import GoogleSignInButton from '../../components/googlebutton';
import axiosinstance from '../../utils/axiosConfig';
import LiveSwitchLoginButton from '../../components/liveswitchb';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateTherapy'>;

const CreateTherapy = ({route, navigation}: Props) => {
  const {colors} = useTheme();
  const {patientId} = route.params;
  const {session, updateAccessToken} = useSession();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>('In Clinic');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [therapyPlans, setTherapyPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLiveSwitchAccess, setHasLiveSwitchAccess] =
    useState<boolean>(false);
  const [showLiveSwitchLogin, setShowLiveSwitchLogin] =
    useState<boolean>(false);
  const [isGoogleSignInVisible, setIsGoogleSignInVisible] =
    useState<boolean>(true);

  const styles = createStyles(colors);

  const appointmentTypes = ['Liveswitch', 'In Clinic', 'In Home'];

  useEffect(() => {
    setShowLiveSwitchLogin(
      appointmentType === 'Liveswitch' && !hasLiveSwitchAccess,
    );
  }, [appointmentType, hasLiveSwitchAccess]);

  useEffect(() => {
    fetchDoctors();
    fetchTherapyPlans();
  }, []);

  useEffect(() => {
    checkLiveSwitchAccess();
  }, [session.accessToken]);

  const checkLiveSwitchAccess = async () => {
    const liveTokens = await AsyncStorage.getItem('LiveTokens');
    setHasLiveSwitchAccess(!!liveTokens);
    setShowLiveSwitchLogin(appointmentType === 'Liveswitch' && !liveTokens);
  };

  const handleLiveSwitchLoginSuccess = async () => {
    await checkLiveSwitchAccess();
    showSuccessToast('Signed in with LiveSwitch successfully');
  };

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const handleAppointmentTypeChange = (type: string) => {
    setAppointmentType(type);
    setShowLiveSwitchLogin(type === 'Liveswitch' && !hasLiveSwitchAccess);
  };

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await axiosinstance.get('/getalldoctor', {
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

  const fetchTherapyPlans = async () => {
    try {
      const response = await axiosinstance.get(`/get/plans/${patientId}`, {
        headers: {
          Authorization: `Bearer ${session.idToken}`,
        },
      });
      setTherapyPlans(response.data.therapy_plans);
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

  const fetchAvailableSlots = async (date: Date) => {
    if (!selectedDoctor) {
      handleError(new Error('Please select a doctor first.'));
      return;
    }

    setIsLoadingSlots(true);
    setError('');
    try {
      const response = await axiosinstance.post(
        '/availability',
        {
          date: moment(date).format('YYYY-MM-DD'),
          doctor_id: selectedDoctor._id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );
      setAvailableSlots(response.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const isSlotDisabled = (slot: any) => {
    const now = new Date();
    const slotDate = new Date(selectedDate);
    const [hours, minutes] = slot.start.split(':').map(Number);
    slotDate.setHours(hours, minutes, 0, 0);

    return slotDate < now || slot.status === 'occupied';
  };

  const handleGoogleSignIn = async () => {
    try {
      const handleSignInSuccess = async () => {
        const googleTokens = await AsyncStorage.getItem('googleTokens');
        if (googleTokens) {
          const {accessToken} = JSON.parse(googleTokens);
          if (accessToken) {
            await updateAccessToken(accessToken);
            setIsGoogleSignInVisible(false);
            showSuccessToast('Signed in with Google successfully');
          } else {
            throw new Error('No access token received');
          }
        } else {
          throw new Error('No Google tokens found');
        }
      };

      await handleSignInSuccess();
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
      handleError(error);
    }
  };

  const handleBookAppointment = async () => {
    try {
      if (!session.idToken) {
        throw new Error('Please log in to book an appointment.');
      }

      if (!selectedSlot) {
        throw new Error('Please select a time slot for the appointment.');
      }
      if (!selectedDoctor) {
        throw new Error('Please select a doctor for the appointment.');
      }
      if (!selectedPlan) {
        throw new Error('Please select a therapy plan for the appointment.');
      }
      setIsBooking(true);
      setError('');
      const requestBody = {
        contactId: patientId,
        message: 'Please click the following LiveSwitch conversation link.',
        type: 'LiveConversation',
        autoStartRecording: true,
        sendSmsNotification: true,
        therepy_type: appointmentType,
        therepy_date: selectedDate.toISOString().split('T')[0],
        therepy_start_time: availableSlots[selectedSlot].start,
        therepy_end_time: availableSlots[selectedSlot].end,
        doctor_id: selectedDoctor._id,
        doctor_name: `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`,
        plan_id: selectedPlan._id,
        doctor_email: selectedDoctor.doctor_email,
      };
      const response = await axiosinstance.post(
        '/therepy/create',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        showSuccessToast('Appointment booked successfully');
        navigation.goBack();
      } else {
        throw new Error('Failed to book appointment. Please try again.');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsBooking(false);
    }
  };

  const renderSlot = ({item, index}: {item: any; index: number}) => {
    const isDisabled = isSlotDisabled(item);
    const isSelected = selectedSlot === index;
    return (
      <TouchableOpacity
        style={[
          styles.slotButton,
          isDisabled && styles.slotButtonDisabled,
          isSelected && styles.slotButtonSelected,
        ]}
        onPress={() => setSelectedSlot(index)}
        disabled={isDisabled}>
        <Text
          style={[
            styles.slotButtonText,
            isDisabled && styles.slotButtonTextDisabled,
            isSelected && styles.slotButtonTextSelected,
          ]}>
          {item.start} - {item.end}
        </Text>
      </TouchableOpacity>
    );
  };
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Book Appointment</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Doctor</Text>
          <Picker
            selectedValue={selectedDoctor?._id}
            onValueChange={itemValue => {
              setSelectedDoctor(doctors.find(d => d._id === itemValue) || null);
              setAvailableSlots([]);
              setSelectedSlot(null);
            }}
            style={styles.picker}>
            <Picker.Item label="Select a doctor" value={null} />
            {doctors.map(doctor => (
              <Picker.Item
                key={doctor._id}
                label={`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
                value={doctor._id}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Therapy Plan</Text>
          <Picker
            selectedValue={selectedPlan?._id}
            onValueChange={itemValue =>
              setSelectedPlan(
                therapyPlans.find(p => p._id === itemValue) || null,
              )
            }
            style={styles.picker}>
            <Picker.Item label="Select a plan" value={null} />
            {therapyPlans.map(plan => (
              <Picker.Item
                key={plan._id}
                label={plan.therapy_name}
                value={plan._id}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Type</Text>
          <View style={styles.appointmentTypes}>
            {appointmentTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  appointmentType === type && styles.selectedTypeButton,
                ]}
                onPress={() => handleAppointmentTypeChange(type)}>
                <Text
                  style={[
                    styles.typeButtonText,
                    appointmentType === type && styles.selectedTypeButtonText,
                  ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {showLiveSwitchLogin && (
          <View style={styles.liveSwitchButtonContainer}>
            <Text style={styles.liveSwitchButtonText}>
              Sign in with LiveSwitch for video appointments
            </Text>
            <LiveSwitchLoginButton
              onLoginSuccess={handleLiveSwitchLoginSuccess}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <View style={styles.dateSelector}>
            <TouchableOpacity onPress={() => changeDate(-1)}>
              <Icon name="chevron-left" size={24} color="#119FB3" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeDate(1)}>
              <Icon name="chevron-right" size={24} color="#119FB3" />
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
          <Text style={styles.sectionTitle}>Available Slots</Text>
          {!selectedDoctor ? (
            <Text style={styles.infoText}>
              Please select a doctor to view available slots.
            </Text>
          ) : isLoadingSlots ? (
            <ActivityIndicator size="small" color="#119FB3" />
          ) : (
            <View style={styles.slotsContainer}>
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.slotButton,
                    isSlotDisabled(slot) && styles.slotButtonDisabled,
                    selectedSlot === index && styles.slotButtonSelected,
                  ]}
                  onPress={() => setSelectedSlot(index)}
                  disabled={isSlotDisabled(slot)}>
                  <Text
                    style={[
                      styles.slotButtonText,
                      isSlotDisabled(slot) && styles.slotButtonTextDisabled,
                      selectedSlot === index && styles.slotButtonTextSelected,
                    ]}>
                    {slot.start} - {slot.end}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>

      {isBooking && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#119FB3" />
        </View>
      )}

      <TouchableOpacity
        style={[styles.bookButton, isBooking && {opacity: 0.5}]}
        onPress={handleBookAppointment}
        disabled={isBooking}>
        <Text style={styles.bookButtonText}>
          {isBooking ? 'Booking...' : 'Book Appointment'}
        </Text>
      </TouchableOpacity>

      <ConfirmationPopup
        visible={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        appointmentDetails={{
          date: formatDate(selectedDate),
          time: selectedSlot !== null ? availableSlots[selectedSlot].start : '',
          type: appointmentType,
          doctor: selectedDoctor
            ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
            : '',
          plan: selectedPlan ? selectedPlan.therapy_name : '',
        }}
      />
    </View>
  );
};
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F0F8FF',
    },
    infoText: {
      color: '#666',
      textAlign: 'center',
      marginTop: 10,
    },
    bcontainer: {
      flex: 1,
      backgroundColor: '#F0F8FF',
      justifyContent: 'center', // Vertically center
      alignItems: 'center', // Horizontally center
    },
    googleButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    liveSwitchButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      elevation: 2,
    },
    liveSwitchButtonText: {
      marginBottom: 10,
      textAlign: 'center',
      color: '#333333',
    },
    googleButtonText: {
      marginBottom: 10,
      textAlign: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#119FB3',
      textAlign: 'center',
      marginBottom: 20,
      marginTop: 25,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1, // Ensure it appears above other content
    },
    bookButton: {
      backgroundColor: '#119FB3',
      padding: 16,
      alignItems: 'center',
      margin: 16,
      borderRadius: 10,
    },
    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    section: {
      padding: 16,
      backgroundColor: '#FFFFFF',
      marginBottom: 8,
      borderRadius: 10,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#119FB3',
      marginBottom: 12,
    },
    appointmentTypes: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    typeButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#119FB3',
    },
    selectedTypeButton: {
      backgroundColor: '#119FB3',
    },
    typeButtonText: {
      color: '#119FB3',
    },
    selectedTypeButtonText: {
      color: '#FFFFFF',
    },
    dateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333333',
    },
    slotsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
    },
    slotButton: {
      borderWidth: 1,
      borderColor: '#119FB3',
      borderRadius: 10,
      padding: 10,
      width: '40%',
    },
    slotButtonDisabled: {
      backgroundColor: '#E0E0E0',
      borderColor: '#A0A0A0',
    },
    slotButtonSelected: {
      backgroundColor: '#119FB3',
    },
    slotButtonText: {
      color: '#333333',
      textAlign: 'center',
    },
    slotButtonTextDisabled: {
      color: '#A0A0A0',
    },
    slotButtonTextSelected: {
      color: '#FFFFFF',
    },
    errorText: {
      color: 'red',
      textAlign: 'center',
      marginTop: 10,
    },
    picker: {
      backgroundColor: '#F0F8FF',
      borderRadius: 10,
      marginTop: 8,
    },
    pickerItem: {
      color: '#333333',
    },
  });

export default CreateTherapy;
