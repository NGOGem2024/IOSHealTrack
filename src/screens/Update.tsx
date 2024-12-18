import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment-timezone';
import axios from 'axios';
import {useSession} from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';

interface Therapy {
  _id: string;
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

interface Slot {
  start: string;
  end: string;
  status?: string;
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
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState(therapy.therepy_type);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const {session} = useSession();

  const appointmentTypes = ['LiveSwitch', 'In Clinic', 'In Home'];

  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [selectedDate]);

  const handleChange = (key: keyof Therapy, value: string) => {
    setEditedTherapy(prev => ({...prev, [key]: value}));
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

  const fetchAvailableSlots = async (date: Date) => {
    setIsLoadingSlots(true);
    try {
      const response = await axiosInstance.post(
        '/availability',
        {
          date: moment(date).format('YYYY-MM-DD'),
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

  const isSlotDisabled = (slot: Slot) => {
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

  const handleUpdateTherapy = async () => {
    if (!selectedSlot && !editedTherapy.therepy_start_time) {
      handleError(new Error('Please select a time slot for the appointment.'));
      return;
    }

    try {
      const updatedTherapyData = {
        ...editedTherapy,
        therepy_type: appointmentType,
        therepy_date: moment(selectedDate).format('YYYY-MM-DD'),
        therepy_start_time: selectedSlot
          ? availableSlots[selectedSlot].start
          : editedTherapy.therepy_start_time,
        therepy_end_time: selectedSlot
          ? availableSlots[selectedSlot].end
          : editedTherapy.therepy_end_time,
      };

      await onUpdate(updatedTherapyData);
      showSuccessToast('Therapy session updated successfully');
      onCancel();
    } catch (error) {
      handleError(error);
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
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Therapy</Text>
            </View>
            <Text style={styles.label}>Therapy Type:</Text>
            <View style={styles.appointmentTypes}>
              {appointmentTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    appointmentType === type && styles.selectedTypeButton,
                  ]}
                  onPress={() => {
                    setAppointmentType(type);
                    setEditedTherapy(prev => ({
                      ...prev,
                      therepy_type: type,
                    }));
                  }}>
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

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.label}>Date:</Text>
              <View style={styles.dateDisplay}>
                <Icon name="date-range" size={24} color="#119FB3" />
                <Text>{formatDate(selectedDate)}</Text>
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            <Text style={styles.label}>Available Slots:</Text>
            {isLoadingSlots ? (
              <ActivityIndicator size="small" color="#119FB3" />
            ) : (
              <View style={styles.slotsContainer}>
                {availableSlots.map((slot: Slot, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.slotButton,
                      isSlotDisabled(slot) && styles.slotButtonDisabled,
                      selectedSlot === index && styles.slotButtonSelected,
                    ]}
                    onPress={() => {
                      setSelectedSlot(index);
                      setEditedTherapy(prev => ({
                        ...prev,
                        therepy_start_time: slot.start,
                        therepy_end_time: slot.end,
                      }));
                    }}
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={handleUpdateTherapy}>
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '95%',
    maxHeight: '80%',
  },
  //   modalTitle: {
  //     fontSize: 20,
  //     fontWeight: "bold",
  //     marginBottom: 15,
  //     color: "#119FB3",
  //     textAlign: "center",
  //   },
  dateDisplay: {
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: '#fff',
    elevation: 2,
    padding: 12,
    flex: 1,
    flexDirection: 'row',
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 2,
    color: '#119FB3',
    marginLeft: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#119FB3',
    marginBottom: 10,
    // textAlign: "center",
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    // borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: '100%',
    fontWeight: 'bold',
  },
  dateButton: {
    flexDirection: 'row',
    marginVertical: 10,
    // padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
    fontWeight: 'bold',
    // marginLeft: 30,
  },
  appointmentTypes: {
    flexDirection: 'row',
    marginTop: 5,
    // width: "60%",
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
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
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
  },
  slotButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    // margin: 5,
    backgroundColor: '#F0F8FF',
  },
  slotButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  slotButtonSelected: {
    backgroundColor: '#119FB3',
  },
  slotButtonText: {
    color: '#119FB3',
  },
  slotButtonTextDisabled: {
    color: '#ccc',
  },
  slotButtonTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
  },
  button: {
    padding: 12,
    borderRadius: 10,
    width: '45%',
  },
  cancelButton: {
    backgroundColor: '#2596be',
    marginLeft: 10,
  },
  updateButton: {
    backgroundColor: '#119FB3',
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default EditTherapy;
