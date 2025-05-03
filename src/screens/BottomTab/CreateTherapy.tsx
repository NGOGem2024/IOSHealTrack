import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useTheme} from '../ThemeContext';
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
import BackTabTop from '../BackTopTab';
import NoPlanPopup from './noplan';
//import LoadingScreen from '../../components/loadingScreen';
import BookAppSkeletonLoader from '../../components/BookAppSkeletonLoader';
import {Bold} from 'lucide-react-native';
import AvailableSlots from '../AvailableSlots';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateTherapy'>;
interface PickerItem {
  _id: string;
  label: string;
}
const SLOT_DURATION_OPTIONS = [
  {value: 30, label: '30 minutes'},
  {value: 60, label: '1 Hour'},
  {value: 90, label: '1:30 Hour'},
  {value: 120, label: '2 Hour'},
];

const CreateTherapy = ({route, navigation}: Props) => {
  const {theme, isDarkMode} = useTheme();
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [therapyPlans, setTherapyPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedSlotDuration, setSelectedSlotDuration] = useState(30);

  const [hasLiveSwitchAccess, setHasLiveSwitchAccess] =
    useState<boolean>(false);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [showSlotDurationPicker, setShowSlotDurationPicker] = useState(false);

  const [showNoPlanPopup, setShowNoPlanPopup] = useState<boolean>(false);
  const [showLiveSwitchLogin, setShowLiveSwitchLogin] =
    useState<boolean>(false);
  const [isGoogleSignInVisible, setIsGoogleSignInVisible] =
    useState<boolean>(true);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [showTherapyPicker, setShowTherapyPicker] = useState(false);
  const styles = createStyles(theme.colors, isDarkMode);

  const appointmentTypes = ['In Clinic', 'In Home', 'IP/ICU', 'Online'];

  // Move these hooks to the top level (not inside renderDoctorPicker)
  const pickerRef = useRef<ScrollView>(null);
  // Create a ref for the ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // Reset scroll position when picker opens
  const resetScrollPosition = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: 0, animated: false});
    }
  };

  // Open picker and reset scroll position
  const openDoctorPicker = () => {
    setShowDoctorPicker(true);
    resetScrollPosition();
  };

  useEffect(() => {
    if (showDoctorPicker && pickerRef.current) {
      pickerRef.current.scrollTo({y: 0, animated: false});
    }
  }, [showDoctorPicker]);

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
    if (therapyPlans.length > 0) {
      const latestPlan = therapyPlans[therapyPlans.length - 1];
      setSelectedPlan(latestPlan);
    }
  }, [therapyPlans]);
  useEffect(() => {
    checkLiveSwitchAccess();
  }, [session.accessToken]);

  const checkLiveSwitchAccess = async () => {
    const liveTokens = await AsyncStorage.getItem('LiveTokens');
    setHasLiveSwitchAccess(!!liveTokens);
    setShowLiveSwitchLogin(appointmentType === 'Liveswitch' && !liveTokens);
  };
  // const renderSlotDurationPicker = () => {
  //   if (Platform.OS === 'ios') {
  //     return (
  //       <>
  //         {renderPickerField(
  //           `${slotDuration} minutes`,
  //           () => setShowSlotDurationPicker(true),
  //           'Select slot duration',
  //         )}
  //         {renderIOSPicker(
  //           showSlotDurationPicker,
  //           () => setShowSlotDurationPicker(false),
  //           (itemValue: string) => {
  //             setSlotDuration(Number(itemValue));
  //           },
  //           slotDuration.toString(),
  //           SLOT_DURATION_OPTIONS.map(option => ({
  //             _id: option.value.toString(),
  //             label: option.label,
  //           })),
  //           'Slot Duration',
  //         )}
  //       </>
  //     );
  //   }

  //   return (
  //     <Picker
  //       selectedValue={slotDuration.toString()}
  //       onValueChange={(itemValue: string) => {
  //         setSlotDuration(Number(itemValue));
  //       }}
  //       style={styles.picker}>
  //       {SLOT_DURATION_OPTIONS.map(option => (
  //         <Picker.Item
  //           key={option.value}
  //           label={option.label}
  //           value={option.value.toString()}
  //         />
  //       ))}
  //     </Picker>
  //   );
  // };
  const handleLiveSwitchLoginSuccess = async () => {
    await checkLiveSwitchAccess();
    showSuccessToast('Signed in with LiveSwitch successfully');
  };

  // useEffect(() => {
  //   if (selectedDoctor && selectedDate) {
  //     fetchAvailableSlots(selectedDate);
  //   }
  // }, [selectedDoctor, selectedDate, slotDuration]);

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
      if (
        !response.data.therapy_plans ||
        response.data.therapy_plans.length === 0
      ) {
        setShowNoPlanPopup(true);
      }
    } catch (error) {
      handleError(error);
    }
  };
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor={theme.colors.background}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <BackTabTop screenName="Therapy" />
        <BookAppSkeletonLoader theme={theme} isDarkMode={isDarkMode} />
      </SafeAreaView>
    );
  }

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
  const handleCreatePlan = () => {
    setShowNoPlanPopup(false);
    navigation.navigate('CreateTherapyPlan', {patientId});
  };

  // Ensure the fetchAvailableSlots function is properly defined in the component scope
  // const fetchAvailableSlots = async (date: Date) => {
  //   if (!selectedDoctor) {
  //     handleError(new Error('Please select a doctor first.'));
  //     return;
  //   }

  //   setIsLoadingSlots(true);
  //   setError('');
  //   try {
  //     const response = await axiosinstance.post(
  //       '/availability',
  //       {
  //         date: moment(date).format('YYYY-MM-DD'),
  //         doctor_id: selectedDoctor._id,
  //         slot_duration: slotDuration, // Add slot duration to the request
  //       },
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${session.idToken}`,
  //         },
  //       },
  //     );
  //     setAvailableSlots(response.data);
  //   } catch (error) {
  //     handleError(error);
  //   } finally {
  //     setIsLoadingSlots(false);
  //   }
  // };
  const isSlotDisabled = (slot: any) => {
    const now = new Date();
    const slotDate = new Date(selectedDate);
    const [hours, minutes] = slot.start.split(':').map(Number);
    slotDate.setHours(hours, minutes, 0, 0);

    return slotDate < now || slot.status === 'occupied';
  };

  const renderIOSPicker = (
    isVisible: boolean,
    onClose: () => void,
    onSelect: (value: string) => void,
    selectedValue: string | undefined,
    items: PickerItem[],
    title: string,
  ) => {
    return (
      <Modal visible={isVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={selectedValue ?? ''}
              onValueChange={(itemValue: string) => {
                if (itemValue !== '') {
                  onSelect(itemValue);
                  onClose();
                }
              }}
              style={styles.iosPicker}>
              <Picker.Item label={`Select a ${title.toLowerCase()}`} value="" />
              {items.map(item => (
                <Picker.Item
                  key={item._id}
                  label={item.label}
                  value={item._id}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    );
  };

  const generateAvailableSlots = (slotDuration: number = 30) => {
    // This should match the implementation in your AvailableSlots component
    // You could also consider moving this to a utility function that both components can import
    const now = moment.tz('Asia/Kolkata');
    const today = moment(now).startOf('day');

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

      // Only add future slots
      if (slotEnd.isAfter(now)) {
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
          onShow={resetScrollPosition} // Reset again when modal is fully shown
        >
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

  const renderTherapyPicker = () => {
    return (
      <>
        {renderPickerField(
          selectedPlan?.therapy_name,
          () => setShowTherapyPicker(true),
          'Select a therapy plan',
        )}
        <Modal
          visible={showTherapyPicker}
          transparent={true}
          animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Therapy Plan</Text>
                <TouchableOpacity
                  onPress={() => setShowTherapyPicker(false)}
                  style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.iosPickerContainer}
                contentContainerStyle={styles.scrollContentContainer}>
                {therapyPlans.map(plan => (
                  <TouchableOpacity
                    key={plan._id}
                    style={[
                      styles.doctorItem,
                      selectedPlan?._id === plan._id &&
                        styles.selectedDoctorItem,
                    ]}
                    onPress={() => {
                      setSelectedPlan(plan);
                      setShowTherapyPicker(false);
                    }}>
                    <Text
                      style={[
                        styles.doctorItemText,
                        selectedPlan?._id === plan._id &&
                          styles.selectedDoctorItemText,
                      ]}>
                      {plan.therapy_name}
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

  const handleBookAppointment = async () => {
    try {
      if (!session.idToken) {
        throw new Error('Please log in to book an appointment.');
      }

      if (selectedSlot === null || selectedSlot === undefined) {
        throw new Error('Select a time slot');
      }

      if (!selectedDoctor) {
        throw new Error('Please select a doctor for the appointment.');
      }

      if (!selectedPlan) {
        throw new Error('Please select a therapy plan for the appointment.');
      }

      setIsBooking(true);
      setError('');

      // Make sure availableSlots has been populated
      const slots = availableSlots.length
        ? availableSlots
        : generateAvailableSlots(selectedSlotDuration);

      const requestBody = {
        contactId: patientId,
        message: 'Please click the following LiveSwitch conversation link.',
        type: 'LiveConversation',
        autoStartRecording: true,
        sendSmsNotification: true,
        therepy_type: appointmentType,
        therepy_date: selectedDate.toISOString().split('T')[0],
        therepy_start_time: slots[selectedSlot].start,
        therepy_end_time: slots[selectedSlot].end,
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BackTabTop screenName="Therapy" />
        <ScrollView>
          <Text style={styles.title}>Book Appointment</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Doctor</Text>
            {renderDoctorPicker()}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Therapy Plan</Text>
            {renderTherapyPicker()}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointment Type</Text>
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
                    {marginRight: 10}, // Add some spacing between buttons
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
            </ScrollView>
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
                <Icon name="chevron-left" size={24} color="#007B8E" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
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
            <Picker
              selectedValue={selectedSlotDuration}
              onValueChange={value => setSelectedSlotDuration(value)}
              style={styles.label}
              dropdownIconColor="#007b8e" >
              <Picker.Item label="30 minutes" value={30} />
              <Picker.Item label="1 hour" value={60} />
              <Picker.Item label="1.5 hours" value={90} />
              <Picker.Item label="2 hours" value={120} />
            </Picker>
          </View> 

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Slots</Text>
            <AvailableSlots
              slotDuration={selectedSlotDuration}
              onSelectSlot={(slotIndex, slot) => {
                setSelectedSlot(slotIndex);
                // Store the selected slot data if you need it elsewhere
                if (!availableSlots.length) {
                  const generatedSlots =
                    generateAvailableSlots(selectedSlotDuration);
                  setAvailableSlots(generatedSlots);
                }
              }}
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
          onPress={handleBookAppointment}
          disabled={
            isBooking ||
            (appointmentType === 'Liveswitch' && !hasLiveSwitchAccess)
          }>
          <Text style={styles.bookButtonText}>
            {isBooking ? 'Booking...' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>

        <ConfirmationPopup
          visible={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          appointmentDetails={{
            date: formatDate(selectedDate),
            time:
              selectedSlot !== null ? availableSlots[selectedSlot].start : '',
            type: appointmentType,
            doctor: selectedDoctor
              ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
              : '',
            plan: selectedPlan ? selectedPlan.therapy_name : '',
          }}
        />
        <NoPlanPopup
          visible={showNoPlanPopup}
          onClose={() => setShowNoPlanPopup(false)}
          onCreatePlan={handleCreatePlan}
        />
      </View>
    </SafeAreaView>
  );
};
const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
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
    label: {
      color: colors.text,
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
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    infoText: {
      color: isDarkMode ? `${colors.text}99` : '#666666',
      textAlign: 'center',
      marginTop: 10,
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
      padding: 10,
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
    dateText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    slotButton: {
      borderWidth: 1,
      borderColor: '#007B8E',
      borderRadius: 10,
      padding: 10,
      width: '48%',
      marginBottom: 10,
      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
    },
    slotButtonDisabled: {
      backgroundColor: isDarkMode ? `${colors.border}80` : '#F5F5F5',
      borderColor: isDarkMode ? colors.border : '#E0E0E0',
    },
    slotButtonSelected: {
      backgroundColor: '#007B8E',
    },
    slotButtonText: {
      color: colors.text,
      textAlign: 'center',
    },
    slotButtonTextDisabled: {
      color: isDarkMode ? `${colors.text}40` : '#999999',
    },
    slotButtonTextSelected: {
      color: '#FFFFFF',
    },
    errorText: {
      color: isDarkMode ? '#FF6B6B' : '#FF0000',
      textAlign: 'center',
      marginTop: 10,
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
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDarkMode
        ? 'rgba(18, 18, 18, 0.8)'
        : 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    slotsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
    },
    dateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },

    bcontainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
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
      backgroundColor: colors.card,
      borderRadius: 10,
      elevation: 2,
    },
    liveSwitchButtonText: {
      marginBottom: 10,
      textAlign: 'center',
      color: colors.text,
    },
    googleButtonText: {
      marginBottom: 10,
      textAlign: 'center',
      color: colors.text,
    },

    appointmentTypes: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    pickerItem: {
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
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
      paddingBottom: 20, // Add some padding at the bottom
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

export default CreateTherapy;
