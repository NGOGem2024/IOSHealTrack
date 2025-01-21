// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Modal,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
//   Platform,
//   ScrollView as HorizontalScrollView,
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import moment from 'moment-timezone';
// import axios from 'axios';
// import {useSession} from '../context/SessionContext';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import {handleError, showSuccessToast} from '../utils/errorHandler';
// import axiosInstance from '../utils/axiosConfig';
// import {Picker} from '@react-native-picker/picker';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import LiveSwitchLoginButton from '../components/liveswitchb';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// interface Therapy {
//   _id: string;
//   plan_id: string;
//   patient_id: string;
//   therepy_id: string;
//   therepy_type: string;
//   therepy_remarks: string;
//   therepy_link: string;
//   therepy_date: string;
//   therepy_start_time: string;
//   therepy_end_time?: string;
//   status?: string;
//   therepy_cost?: string;
// }
// interface PickerItem {
//   _id: string;
//   label: string;
// }
// const SLOT_DURATION_OPTIONS = [
//   {value: 30, label: '30 minutes'},
//   {value: 60, label: '1 Hour'},
//   {value: 90, label: '1:30 Hour'},
//   {value: 120, label: '2 Hour'},
// ];
// interface TimeSlot {
//   start: string;
//   end: string;
//   status: string;
// }
// interface EditTherapyProps {
//   therapy: Therapy;
//   onUpdate: (updatedTherapy: Therapy) => Promise<void>;
//   onCancel: () => void;
// }

// const EditTherapy: React.FC<EditTherapyProps> = ({
//   therapy,
//   onUpdate,
//   onCancel,
// }) => {
//   const [editedTherapy, setEditedTherapy] = useState<Therapy>({...therapy});
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(
//     new Date(therapy.therepy_date),
//   );
//   const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
//   const [slotDuration, setSlotDuration] = useState<number>(30);
//   const [showSlotDurationPicker, setShowSlotDurationPicker] = useState(false);
//   const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
//   const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
//   const [appointmentType, setAppointmentType] = useState(therapy.therepy_type);
//   const [isLoadingSlots, setIsLoadingSlots] = useState(false);
//   const [showDoctorPicker, setShowDoctorPicker] = useState(false);
//   const [error, setError] = useState('');
//   const {session} = useSession();
//   const [doctors, setDoctors] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isUpdating, setisUpdating] = useState<boolean>(false);
//   const [therapyPlans, setTherapyPlans] = useState<any[]>([]);
//   const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
//   const [showLiveSwitchLogin, setShowLiveSwitchLogin] =
//     useState<boolean>(false);
//   const [hasLiveSwitchAccess, setHasLiveSwitchAccess] =
//     useState<boolean>(false);

//   const appointmentTypes = ['In Clinic', 'In Home', 'IP/ICU', 'Liveswitch'];
//   useEffect(() => {
//     fetchDoctors();
//   }, []);
//   useEffect(() => {
//     checkLiveSwitchAccess();
//   }, [session.accessToken]);
//   useEffect(() => {
//     if (selectedDoctor && selectedDate) {
//       fetchAvailableSlots(selectedDate);
//     }
//   }, [selectedDoctor, selectedDate, slotDuration]);
//   const checkLiveSwitchAccess = async () => {
//     const liveTokens = await AsyncStorage.getItem('LiveTokens');
//     setHasLiveSwitchAccess(!!liveTokens);
//     setShowLiveSwitchLogin(appointmentType === 'Liveswitch' && !liveTokens);
//   };
//   useEffect(() => {
//     setShowLiveSwitchLogin(
//       appointmentType === 'Liveswitch' && !hasLiveSwitchAccess,
//     );
//   }, [appointmentType, hasLiveSwitchAccess]);
//   const handleChange = (key: keyof Therapy, value: string) => {
//     setEditedTherapy(prev => ({...prev, [key]: value}));
//   };
//   const fetchDoctors = async () => {
//     try {
//       setIsLoading(true);
//       const response = await axiosInstance.get('/getalldoctor');
//       setDoctors(response.data.doctors);
//     } catch (error) {
//       handleError(error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDateChange = (event: any, selectedDate?: Date) => {
//     setShowDatePicker(Platform.OS === 'ios');
//     if (selectedDate) {
//       setSelectedDate(selectedDate);
//       setEditedTherapy(prev => ({
//         ...prev,
//         therepy_date: moment(selectedDate).format('YYYY-MM-DD'),
//       }));
//     }
//   };
//   useEffect(() => {
//     if (doctors.length > 0 && session.doctor_id) {
//       const defaultDoctor = doctors.find(
//         doctor => doctor._id === session.doctor_id,
//       );
//       if (defaultDoctor) {
//         setSelectedDoctor(defaultDoctor);
//       }
//     }
//   }, [doctors, session.doctor_id]);

//   const fetchAvailableSlots = async (date: Date) => {
//     if (!selectedDoctor) {
//       handleError(new Error('Please select a doctor first.'));
//       return;
//     }

//     setIsLoadingSlots(true);
//     setError('');
//     try {
//       const response = await axiosInstance.post(
//         '/availability',
//         {
//           date: moment(date).format('YYYY-MM-DD'),
//           doctor_id: selectedDoctor._id,
//           slot_duration: slotDuration, // Add slot duration to the request
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         },
//       );
//       setAvailableSlots(response.data);
//     } catch (error) {
//       handleError(error);
//     } finally {
//       setIsLoadingSlots(false);
//     }
//   };
//   const changeDate = (days: number) => {
//     const newDate = new Date(selectedDate);
//     newDate.setDate(newDate.getDate() + days);
//     setSelectedDate(newDate);
//   };
//   const renderSlotDurationPicker = () => {
//     if (Platform.OS === 'ios') {
//       return (
//         <>
//           {renderPickerField(
//             `${slotDuration} minutes`,
//             () => setShowSlotDurationPicker(true),
//             'Select slot duration',
//           )}
//           {renderIOSPicker(
//             showSlotDurationPicker,
//             () => setShowSlotDurationPicker(false),
//             (itemValue: string) => {
//               setSlotDuration(Number(itemValue));
//             },
//             slotDuration.toString(),
//             SLOT_DURATION_OPTIONS.map(option => ({
//               _id: option.value.toString(),
//               label: option.label,
//             })),
//             'Slot Duration',
//           )}
//         </>
//       );
//     }

//     return (
//       <Picker
//         selectedValue={slotDuration.toString()}
//         onValueChange={(itemValue: string) => {
//           setSlotDuration(Number(itemValue));
//         }}
//         style={styles.picker}>
//         {SLOT_DURATION_OPTIONS.map(option => (
//           <Picker.Item
//             key={option.value}
//             label={option.label}
//             value={option.value.toString()}
//           />
//         ))}
//       </Picker>
//     );
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#119FB3" />
//       </View>
//     );
//   }
//   const renderPickerField = (
//     value: string | undefined,
//     onPress: () => void,
//     placeholder: string,
//   ) => {
//     return (
//       <TouchableOpacity style={styles.pickerField} onPress={onPress}>
//         <Text
//           style={[styles.pickerFieldText, !value && styles.pickerPlaceholder]}>
//           {value || placeholder}
//         </Text>
//       </TouchableOpacity>
//     );
//   };

//   const isSlotDisabled = (slot: any) => {
//     const now = new Date();
//     const slotDate = new Date(selectedDate);
//     const [hours, minutes] = slot.start.split(':').map(Number);
//     slotDate.setHours(hours, minutes, 0, 0);

//     return slotDate < now || slot.status === 'occupied';
//   };

//   const formatDate = (date: Date) => {
//     const options: Intl.DateTimeFormatOptions = {
//       weekday: 'short',
//       day: 'numeric',
//       month: 'short',
//       year: 'numeric',
//     };
//     return date.toLocaleDateString('en-US', options);
//   };
//   const renderIOSPicker = (
//     isVisible: boolean,
//     onClose: () => void,
//     onSelect: (value: string) => void,
//     selectedValue: string | undefined,
//     items: PickerItem[],
//     title: string,
//   ) => {
//     return (
//       <Modal visible={isVisible} transparent={true} animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.pickerContainer}>
//             <View style={styles.pickerHeader}>
//               <Text style={styles.pickerTitle}>{title}</Text>
//               <TouchableOpacity onPress={onClose} style={styles.doneButton}>
//                 <Text style={styles.doneButtonText}>Done</Text>
//               </TouchableOpacity>
//             </View>
//             <Picker
//               selectedValue={selectedValue ?? ''}
//               onValueChange={(itemValue: string) => {
//                 if (itemValue !== '') {
//                   onSelect(itemValue);
//                   onClose();
//                 }
//               }}
//               style={styles.iosPicker}>
//               <Picker.Item label={`Select a ${title.toLowerCase()}`} value="" />
//               {items.map(item => (
//                 <Picker.Item
//                   key={item._id}
//                   label={item.label}
//                   value={item._id}
//                 />
//               ))}
//             </Picker>
//           </View>
//         </View>
//       </Modal>
//     );
//   };
//   const handleAppointmentTypeChange = (type: string) => {
//     setAppointmentType(type);
//     setShowLiveSwitchLogin(type === 'Liveswitch' && !hasLiveSwitchAccess);
//   };
//   const renderDoctorPicker = () => {
//     if (Platform.OS === 'ios') {
//       const doctorName = selectedDoctor
//         ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
//         : undefined;

//       return (
//         <>
//           {renderPickerField(
//             doctorName,
//             () => setShowDoctorPicker(true),
//             'Select a doctor',
//           )}
//           {renderIOSPicker(
//             showDoctorPicker,
//             () => setShowDoctorPicker(false),
//             (itemValue: string) => {
//               const doctor = doctors.find(d => d._id === itemValue);
//               setSelectedDoctor(doctor || null);
//               setAvailableSlots([]);
//               setSelectedSlot(null);
//             },
//             selectedDoctor?._id,
//             doctors.map(doctor => ({
//               _id: doctor._id,
//               label: `${doctor.doctor_first_name} ${doctor.doctor_last_name}`,
//             })),
//             'Doctor',
//           )}
//         </>
//       );
//     }

//     return (
//       <Picker
//         selectedValue={selectedDoctor?._id ?? ''}
//         onValueChange={(itemValue: string) => {
//           if (itemValue !== '') {
//             setSelectedDoctor(doctors.find(d => d._id === itemValue) || null);
//             setAvailableSlots([]);
//             setSelectedSlot(null);
//           }
//         }}
//         style={styles.picker}>
//         <Picker.Item label="Select a doctor" value="" />
//         {doctors.map(doctor => (
//           <Picker.Item
//             key={doctor._id}
//             label={`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
//             value={doctor._id}
//           />
//         ))}
//       </Picker>
//     );
//   };
//   const handleLiveSwitchLoginSuccess = async () => {
//     await checkLiveSwitchAccess();
//     showSuccessToast('Signed in with LiveSwitch successfully');
//   };

//   const handleUpdateTherapy = async () => {
//     if (!selectedSlot && !editedTherapy.therepy_start_time) {
//       handleError(new Error('Please select a time slot for the appointment.'));
//       return;
//     }
//     setisUpdating(true);
//     try {
//       const updatedTherapyData = {
//         ...editedTherapy,
//         therepy_type: appointmentType,
//         therepy_date: moment(selectedDate).format('YYYY-MM-DD'),
//         therepy_start_time:
//           selectedSlot !== null && availableSlots.length > 0
//             ? availableSlots[selectedSlot].start
//             : editedTherapy.therepy_start_time,
//         therepy_end_time:
//           selectedSlot !== null && availableSlots.length > 0
//             ? availableSlots[selectedSlot].end
//             : editedTherapy.therepy_end_time,
//         doctor_id: selectedDoctor?._id,
//         doctor_name: selectedDoctor
//           ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
//           : '',
//       };

//       await onUpdate(updatedTherapyData);
//       showSuccessToast('Therapy session updated successfully');
//       onCancel();
//     } catch (error) {
//       handleError(error);
//     } finally {
//       setisUpdating(false);
//     }
//   };
//   return (
//     <Modal
//       animationType="slide"
//       transparent={true}
//       visible={true}
//       onRequestClose={onCancel}>
//       <View style={styles.centeredView}>
//         <View style={styles.modalView}>
//           <ScrollView>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Update Session</Text>
//             </View>
//             {/* <Text style={styles.modalTitle}>Edit Therapy Session</Text> */}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Select Doctor</Text>
//               {renderDoctorPicker()}
//             </View>
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Appointment Type</Text>
//               <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.appointmentTypesScrollView}
//                 style={styles.appointmentTypesScrollViewContainer}>
//                 {appointmentTypes.map(type => (
//                   <TouchableOpacity
//                     key={type}
//                     style={[
//                       styles.typeButton,
//                       appointmentType === type && styles.selectedTypeButton,
//                       {marginRight: 10}, // Add some spacing between buttons
//                     ]}
//                     onPress={() => handleAppointmentTypeChange(type)}>
//                     <Text
//                       style={[
//                         styles.typeButtonText,
//                         appointmentType === type &&
//                           styles.selectedTypeButtonText,
//                       ]}>
//                       {type}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>
//             </View>
//             {showLiveSwitchLogin && (
//               <View style={styles.liveSwitchButtonContainer}>
//                 <Text style={styles.liveSwitchButtonText}>
//                   Sign in with LiveSwitch for video appointments
//                 </Text>
//                 <LiveSwitchLoginButton
//                   onLoginSuccess={handleLiveSwitchLoginSuccess}
//                 />
//               </View>
//             )}

//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Select Date</Text>
//               <View style={styles.dateSelector}>
//                 <TouchableOpacity onPress={() => changeDate(-1)}>
//                   <Icon name="chevron-left" size={24} color="#119FB3" />
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   onPress={() => setShowDatePicker(true)}
//                   style={styles.dateDisplayContainer}>
//                   <MaterialIcons
//                     name="calendar-month"
//                     size={20}
//                     color="#119FB3"
//                     style={styles.calendarIcon}
//                   />
//                   <Text style={styles.dateText}>
//                     {formatDate(selectedDate)}
//                   </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={() => changeDate(1)}>
//                   <Icon name="chevron-right" size={24} color="#119FB3" />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {showDatePicker && (
//               <DateTimePicker
//                 value={selectedDate}
//                 mode="date"
//                 display="default"
//                 onChange={handleDateChange}
//                 minimumDate={new Date()}
//               />
//             )}
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Slot Duration</Text>
//               {renderSlotDurationPicker()}
//             </View>
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Available Slots</Text>
//               {!selectedDoctor ? (
//                 <Text style={styles.infoText}>
//                   Please select a doctor to view available slots.
//                 </Text>
//               ) : isLoadingSlots ? (
//                 <ActivityIndicator size="small" color="#119FB3" />
//               ) : (
//                 <View style={styles.slotsContainer}>
//                   {availableSlots.map((slot, index) => (
//                     <TouchableOpacity
//                       key={index}
//                       style={[
//                         styles.slotButton,
//                         isSlotDisabled(slot) && styles.slotButtonDisabled,
//                         selectedSlot === index && styles.slotButtonSelected,
//                       ]}
//                       onPress={() => setSelectedSlot(index)}
//                       disabled={isSlotDisabled(slot)}>
//                       <Text
//                         style={[
//                           styles.slotButtonText,
//                           isSlotDisabled(slot) && styles.slotButtonTextDisabled,
//                           selectedSlot === index &&
//                             styles.slotButtonTextSelected,
//                         ]}>
//                         {slot.start} - {slot.end}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               )}
//               {error ? <Text style={styles.errorText}>{error}</Text> : null}
//             </View>

//             <View style={styles.buttonContainer}>
//               <TouchableOpacity
//                 style={[styles.button, styles.cancelButton]}
//                 onPress={onCancel}>
//                 <Text style={styles.buttonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.bookButton, isUpdating && {opacity: 0.5}]}
//                 onPress={handleUpdateTherapy}
//                 disabled={
//                   isUpdating ||
//                   (appointmentType === 'Liveswitch' && !hasLiveSwitchAccess)
//                 }>
//                 <Text style={styles.bookButtonText}>
//                   {isUpdating ? 'updating...' : 'Update Appointment'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </ScrollView>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   centeredView: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   appointmentTypesScrollView: {
//     flexGrow: 1,
//     alignItems: 'center',
//     paddingRight: 16,
//   },
//   appointmentTypesScrollViewContainer: {
//     maxHeight: 60,
//   },
//   dateSelector: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//   },
//   datePickerButton: {
//     flex: 1,
//     marginHorizontal: 15,
//   },
//   dateContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 10,
//     borderRadius: 8,
//   },
//   dateDisplayContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     //backgroundColor: "#F0F8FF",
//     paddingVertical: 8,
//     paddingHorizontal: 15,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: 'white',
//   },
//   dateText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333333',
//     marginLeft: 12,
//   },
//   calendarIcon: {
//     marginRight: 8,
//   },
//   modalView: {
//     backgroundColor: 'white',
//     borderRadius: 20,
//     width: '100%',
//     maxHeight: '90%',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },

//   typeButton: {
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     marginRight: 10, // Add space between buttons
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#119FB3',
//   },
//   selectedTypeButton: {
//     backgroundColor: '#119FB3',
//   },
//   typeButtonText: {
//     color: '#119FB3',
//     fontSize: 14, // Optional: adjust font size if needed
//   },
//   selectedTypeButtonText: {
//     color: '#FFFFFF',
//   },
//   modalHeader: {
//     alignItems: 'center',
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#119FB3',
//   },
//   section: {
//     padding: 16,
//     backgroundColor: '#FFFFFF',
//     marginBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#119FB3',
//     marginBottom: 10,
//   },
//   slotsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     gap: 10,
//     marginBottom: 15,
//   },
//   slotButton: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     borderRadius: 10,
//     backgroundColor: '#F0F8FF',
//   },
//   slotButtonDisabled: {
//     backgroundColor: '#F5F5F5',
//   },
//   slotButtonSelected: {
//     backgroundColor: '#119FB3',
//   },
//   slotButtonText: {
//     color: '#119FB3',
//   },
//   slotButtonTextDisabled: {
//     color: '#ccc',
//   },
//   slotButtonTextSelected: {
//     color: '#FFFFFF',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     padding: 15,
//   },
//   button: {
//     padding: 16,
//     borderRadius: 10,
//     width: '45%',
//   },
//   cancelButton: {
//     backgroundColor: '#5d5e5e',
//   },
//   bookButton: {
//     backgroundColor: '#119FB3',
//     padding: 16,
//     alignItems: 'center',
//     borderRadius: 10,
//   },
//   bookButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   liveSwitchButtonContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 10,
//     padding: 16,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 10,
//     elevation: 2,
//   },

//   picker: {
//     backgroundColor: '#F0F8FF',
//     borderRadius: 10,
//     marginTop: 8,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   pickerContainer: {
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingBottom: 20,
//   },
//   pickerHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   pickerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333333',
//   },
//   doneButton: {
//     padding: 8,
//   },
//   errorText: {
//     color: 'red',
//     textAlign: 'center',
//     marginTop: 10,
//   },
//   doneButtonText: {
//     color: '#119FB3',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   iosPicker: {
//     backgroundColor: '#FFFFFF',
//     height: 215,
//   },
//   loadingContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 1, // Ensure it appears above other content
//   },

//   liveSwitchButtonText: {
//     marginBottom: 10,
//     textAlign: 'center',
//     color: '#333333',
//   },

//   pickerField: {
//     backgroundColor: '#F0F8FF',
//     borderRadius: 10,
//     padding: 12,
//     marginTop: 8,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   pickerFieldText: {
//     fontSize: 16,
//     color: '#333333',
//   },
//   pickerPlaceholder: {
//     color: '#999999',
//   },
//   input: {
//     borderWidth: 1,
//     // borderColor: "#ddd",
//     padding: 10,
//     borderRadius: 5,
//     marginBottom: 15,
//     width: '100%',
//     fontWeight: 'bold',
//   },

//   updateButton: {
//     backgroundColor: '#119FB3',
//     marginRight: 10,
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     textAlign: 'center',
//     fontSize: 16,
//   },
//   infoText: {
//     color: '#666',
//     textAlign: 'center',
//     marginTop: 10,
//   },
// });

// export default EditTherapy;
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView as HorizontalScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment-timezone';
import axios from 'axios';
import {useSession} from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import {Picker} from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LiveSwitchLoginButton from '../components/liveswitchb';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Therapy {
  _id: string;
  plan_id: string;
  patient_id: string;
  therepy_id: string;
  therepy_type: string;
  therepy_remarks: string;
  therepy_link: string;
  therepy_date: string;
  therepy_start_time: string;
  therepy_end_time?: string;
  status?: string;
  therepy_cost?: string;
}
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
interface TimeSlot {
  start: string;
  end: string;
  status: string;
}
interface EditTherapyProps {
  therapy: Therapy;
  onUpdate: (updatedTherapy: Therapy) => Promise<void>;
  onCancel: () => void;
}

const EditTherapy: React.FC<EditTherapyProps> = ({
  therapy,
  onUpdate,
  onCancel,
}) => {
  const [editedTherapy, setEditedTherapy] = useState<Therapy>({...therapy});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date(therapy.therepy_date),
  );
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [showSlotDurationPicker, setShowSlotDurationPicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState(therapy.therepy_type);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [error, setError] = useState('');
  const {session} = useSession();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setisUpdating] = useState<boolean>(false);
  const [therapyPlans, setTherapyPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showLiveSwitchLogin, setShowLiveSwitchLogin] =
    useState<boolean>(false);
  const [hasLiveSwitchAccess, setHasLiveSwitchAccess] =
    useState<boolean>(false);

  const appointmentTypes = ['In Clinic', 'In Home', 'IP/ICU', 'Liveswitch'];
  useEffect(() => {
    fetchDoctors();
  }, []);
  useEffect(() => {
    checkLiveSwitchAccess();
  }, [session.accessToken]);
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDoctor, selectedDate, slotDuration]);
  const checkLiveSwitchAccess = async () => {
    const liveTokens = await AsyncStorage.getItem('LiveTokens');
    setHasLiveSwitchAccess(!!liveTokens);
    setShowLiveSwitchLogin(appointmentType === 'Liveswitch' && !liveTokens);
  };
  useEffect(() => {
    setShowLiveSwitchLogin(
      appointmentType === 'Liveswitch' && !hasLiveSwitchAccess,
    );
  }, [appointmentType, hasLiveSwitchAccess]);
  const handleChange = (key: keyof Therapy, value: string) => {
    setEditedTherapy(prev => ({...prev, [key]: value}));
  };
  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/getalldoctor');
      setDoctors(response.data.doctors);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setEditedTherapy(prev => ({
        ...prev,
        therepy_date: moment(selectedDate).format('YYYY-MM-DD'),
      }));
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

  const fetchAvailableSlots = async (date: Date) => {
    if (!selectedDoctor) {
      handleError(new Error('Please select a doctor first.'));
      return;
    }

    setIsLoadingSlots(true);
    setError('');
    try {
      const response = await axiosInstance.post(
        '/availability',
        {
          date: moment(date).format('YYYY-MM-DD'),
          doctor_id: selectedDoctor._id,
          slot_duration: slotDuration, // Add slot duration to the request
        },
        {
          headers: {
            'Content-Type': 'application/json',
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
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };
  const renderSlotDurationPicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          {renderPickerField(
            `${slotDuration} minutes`,
            () => setShowSlotDurationPicker(true),
            'Select slot duration',
          )}
          {renderIOSPicker(
            showSlotDurationPicker,
            () => setShowSlotDurationPicker(false),
            (itemValue: string) => {
              setSlotDuration(Number(itemValue));
            },
            slotDuration.toString(),
            SLOT_DURATION_OPTIONS.map(option => ({
              _id: option.value.toString(),
              label: option.label,
            })),
            'Slot Duration',
          )}
        </>
      );
    }

    return (
      <Picker
        selectedValue={slotDuration.toString()}
        onValueChange={(itemValue: string) => {
          setSlotDuration(Number(itemValue));
        }}
        style={styles.picker}>
        {SLOT_DURATION_OPTIONS.map(option => (
          <Picker.Item
            key={option.value}
            label={option.label}
            value={option.value.toString()}
          />
        ))}
      </Picker>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
      </View>
    );
  }
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
      </TouchableOpacity>
    );
  };

  const isSlotDisabled = (slot: any) => {
    const now = new Date();
    const slotDate = new Date(selectedDate);
    const [hours, minutes] = slot.start.split(':').map(Number);
    slotDate.setHours(hours, minutes, 0, 0);

    return slotDate < now || slot.status === 'occupied';
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
  const handleAppointmentTypeChange = (type: string) => {
    setAppointmentType(type);
    setShowLiveSwitchLogin(type === 'Liveswitch' && !hasLiveSwitchAccess);
  };
  const renderDoctorPicker = () => {
    if (Platform.OS === 'ios') {
      const doctorName = selectedDoctor
        ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
        : undefined;

      return (
        <>
          {renderPickerField(
            doctorName,
            () => setShowDoctorPicker(true),
            'Select a doctor',
          )}
          {renderIOSPicker(
            showDoctorPicker,
            () => setShowDoctorPicker(false),
            (itemValue: string) => {
              const doctor = doctors.find(d => d._id === itemValue);
              setSelectedDoctor(doctor || null);
              setAvailableSlots([]);
              setSelectedSlot(null);
            },
            selectedDoctor?._id,
            doctors.map(doctor => ({
              _id: doctor._id,
              label: `${doctor.doctor_first_name} ${doctor.doctor_last_name}`,
            })),
            'Doctor',
          )}
        </>
      );
    }

    return (
      <Picker
        selectedValue={selectedDoctor?._id ?? ''}
        onValueChange={(itemValue: string) => {
          if (itemValue !== '') {
            setSelectedDoctor(doctors.find(d => d._id === itemValue) || null);
            setAvailableSlots([]);
            setSelectedSlot(null);
          }
        }}
        style={styles.picker}>
        <Picker.Item label="Select a doctor" value="" />
        {doctors.map(doctor => (
          <Picker.Item
            key={doctor._id}
            label={`${doctor.doctor_first_name} ${doctor.doctor_last_name}`}
            value={doctor._id}
          />
        ))}
      </Picker>
    );
  };
  const handleLiveSwitchLoginSuccess = async () => {
    await checkLiveSwitchAccess();
    showSuccessToast('Signed in with LiveSwitch successfully');
  };

  const handleUpdateTherapy = async () => {
    if (!selectedSlot && !editedTherapy.therepy_start_time) {
      handleError(new Error('Please select a time slot for the appointment.'));
      return;
    }
    setisUpdating(true);
    try {
      const updatedTherapyData = {
        ...editedTherapy,
        therepy_type: appointmentType,
        therepy_date: moment(selectedDate).format('YYYY-MM-DD'),
        therepy_start_time:
          selectedSlot !== null && availableSlots.length > 0
            ? availableSlots[selectedSlot].start
            : editedTherapy.therepy_start_time,
        therepy_end_time:
          selectedSlot !== null && availableSlots.length > 0
            ? availableSlots[selectedSlot].end
            : editedTherapy.therepy_end_time,
        doctor_id: selectedDoctor?._id,
        doctor_name: selectedDoctor
          ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
          : '',
      };

      await onUpdate(updatedTherapyData);
      showSuccessToast('Therapy session updated successfully');
      onCancel();
    } catch (error) {
      handleError(error);
    } finally {
      setisUpdating(false);
    }
  };
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onCancel}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Appointment</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Doctor Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Doctor</Text>
              <View style={styles.sectionContent}>{renderDoctorPicker()}</View>
            </View>

            {/* Appointment Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type of Appointment</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.appointmentTypesContainer}>
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
                        appointmentType === type &&
                          styles.selectedTypeButtonText,
                      ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* LiveSwitch Login */}
            {showLiveSwitchLogin && (
              <View style={styles.liveSwitchSection}>
                <Text style={styles.liveSwitchText}>
                  Sign in to enable video appointments
                </Text>
                <LiveSwitchLoginButton
                  onLoginSuccess={handleLiveSwitchLoginSuccess}
                />
              </View>
            )}

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appointment Date</Text>
              <View style={styles.dateSelector}>
                <TouchableOpacity
                  style={styles.dateArrowButton}
                  onPress={() => changeDate(-1)}>
                  <Icon name="chevron-left" size={24} color="#119FB3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePicker}
                  onPress={() => setShowDatePicker(true)}>
                  <MaterialIcons
                    name="calendar-month"
                    size={20}
                    color="#119FB3"
                  />
                  <Text style={styles.dateText}>
                    {formatDate(selectedDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateArrowButton}
                  onPress={() => changeDate(1)}>
                  <Icon name="chevron-right" size={24} color="#119FB3" />
                </TouchableOpacity>
              </View>
              {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
            </View>

            {/* Slot Duration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.sectionContent}>
                {renderSlotDurationPicker()}
              </View>
            </View>

            {/* Available Slots */}
            <View style={[styles.section, styles.slotsSection]}>
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
              {!selectedDoctor ? (
                <Text style={styles.infoText}>
                  Select a doctor to view available slots
                </Text>
              ) : isLoadingSlots ? (
                <ActivityIndicator size="small" color="#119FB3" />
              ) : (
                <View style={styles.slotsGrid}>
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
                          selectedSlot === index &&
                            styles.slotButtonTextSelected,
                        ]}>
                        {slot.start} - {slot.end}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.updateButton,
                (isUpdating ||
                  (appointmentType === 'Liveswitch' && !hasLiveSwitchAccess)) &&
                  styles.disabledButton,
              ]}
              onPress={handleUpdateTherapy}
              disabled={
                isUpdating ||
                (appointmentType === 'Liveswitch' && !hasLiveSwitchAccess)
              }>
              <Text style={styles.updateButtonText}>
                {isUpdating ? 'Updating...' : 'Update Appointment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end', // Modal slides up from bottom
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  slotsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#261e1d',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  appointmentTypesContainer: {
    paddingVertical: 8,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#119FB3',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerField: {
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerFieldText: {
    fontSize: 16,
    color: '#333333',
  },
  pickerPlaceholder: {
    color: '#999999',
  },
  doneButton: {
    padding: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    color: '#119FB3',
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    backgroundColor: '#FFFFFF',
    height: 215,
  },
  selectedTypeButton: {
    backgroundColor: '#119FB3',
    borderColor: '#119FB3',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#119FB3',
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateArrowButton: {
    padding: 8,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 12,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  slotButtonSelected: {
    backgroundColor: '#119FB3',
    borderColor: '#119FB3',
  },
  slotButtonDisabled: {
    backgroundColor: '#E9ECEF',
    borderColor: '#DEE2E6',
  },
  slotButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  slotButtonTextSelected: {
    color: '#FFFFFF',
  },
  slotButtonTextDisabled: {
    color: '#ADB5BD',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'gray',
    marginRight: 8,
  },
  updateButton: {
    backgroundColor: '#119FB3',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  liveSwitchSection: {
    backgroundColor: '#E8F4FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  liveSwitchText: {
    color: '#0066CC',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  infoText: {
    textAlign: 'center',
    color: '#6C757D',
    fontSize: 14,
  },
  picker: {
    backgroundColor: '#F8F9FA',
  },
});

export default EditTherapy;
