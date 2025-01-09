import React, { useState, useEffect } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment-timezone";
import axios from "axios";
import { useSession } from "../context/SessionContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { handleError, showSuccessToast } from "../utils/errorHandler";
import axiosInstance from "../utils/axiosConfig";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LiveSwitchLoginButton from "../components/liveswitchb";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

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
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 Hour" },
  { value: 90, label: "1:30 Hour" },
  { value: 120, label: "2 Hour" },
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
  const [editedTherapy, setEditedTherapy] = useState<Therapy>({ ...therapy });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date(therapy.therepy_date)
  );
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [showSlotDurationPicker, setShowSlotDurationPicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState(therapy.therepy_type);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [error, setError] = useState("");
  const { session } = useSession();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setisUpdating] = useState<boolean>(false);
  const [therapyPlans, setTherapyPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showLiveSwitchLogin, setShowLiveSwitchLogin] =
    useState<boolean>(false);
  const [hasLiveSwitchAccess, setHasLiveSwitchAccess] =
    useState<boolean>(false);

  const appointmentTypes = [ "In Clinic", "In Home", "IP/ICU","Liveswitch"];
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
    const liveTokens = await AsyncStorage.getItem("LiveTokens");
    setHasLiveSwitchAccess(!!liveTokens);
    setShowLiveSwitchLogin(appointmentType === "Liveswitch" && !liveTokens);
  };
  useEffect(() => {
    setShowLiveSwitchLogin(
      appointmentType === "Liveswitch" && !hasLiveSwitchAccess
    );
  }, [appointmentType, hasLiveSwitchAccess]);
  const handleChange = (key: keyof Therapy, value: string) => {
    setEditedTherapy((prev) => ({ ...prev, [key]: value }));
  };
  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/getalldoctor");
      setDoctors(response.data.doctors);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setEditedTherapy((prev) => ({
        ...prev,
        therepy_date: moment(selectedDate).format("YYYY-MM-DD"),
      }));
    }
  };
  useEffect(() => {
    if (doctors.length > 0 && session.doctor_id) {
      const defaultDoctor = doctors.find(
        (doctor) => doctor._id === session.doctor_id
      );
      if (defaultDoctor) {
        setSelectedDoctor(defaultDoctor);
      }
    }
  }, [doctors, session.doctor_id]);

  const fetchAvailableSlots = async (date: Date) => {
    if (!selectedDoctor) {
      handleError(new Error("Please select a doctor first."));
      return;
    }

    setIsLoadingSlots(true);
    setError("");
    try {
      const response = await axiosInstance.post(
        "/availability",
        {
          date: moment(date).format("YYYY-MM-DD"),
          doctor_id: selectedDoctor._id,
          slot_duration: slotDuration, // Add slot duration to the request
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setAvailableSlots(response.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoadingSlots(false);
    }
  };
  const renderSlotDurationPicker = () => {
    if (Platform.OS === "ios") {
      return (
        <>
          {renderPickerField(
            `${slotDuration} minutes`,
            () => setShowSlotDurationPicker(true),
            "Select slot duration"
          )}
          {renderIOSPicker(
            showSlotDurationPicker,
            () => setShowSlotDurationPicker(false),
            (itemValue: string) => {
              setSlotDuration(Number(itemValue));
            },
            slotDuration.toString(),
            SLOT_DURATION_OPTIONS.map((option) => ({
              _id: option.value.toString(),
              label: option.label,
            })),
            "Slot Duration"
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
        style={styles.picker}
      >
        {SLOT_DURATION_OPTIONS.map((option) => (
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
    placeholder: string
  ) => {
    return (
      <TouchableOpacity style={styles.pickerField} onPress={onPress}>
        <Text
          style={[styles.pickerFieldText, !value && styles.pickerPlaceholder]}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>
    );
  };

  const isSlotDisabled = (slot: any) => {
    const now = new Date();
    const slotDate = new Date(selectedDate);
    const [hours, minutes] = slot.start.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);

    return slotDate < now || slot.status === "occupied";
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };
  const renderIOSPicker = (
    isVisible: boolean,
    onClose: () => void,
    onSelect: (value: string) => void,
    selectedValue: string | undefined,
    items: PickerItem[],
    title: string
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
              selectedValue={selectedValue ?? ""}
              onValueChange={(itemValue: string) => {
                if (itemValue !== "") {
                  onSelect(itemValue);
                  onClose();
                }
              }}
              style={styles.iosPicker}
            >
              <Picker.Item label={`Select a ${title.toLowerCase()}`} value="" />
              {items.map((item) => (
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
    setShowLiveSwitchLogin(type === "Liveswitch" && !hasLiveSwitchAccess);
  };
  const renderDoctorPicker = () => {
    if (Platform.OS === "ios") {
      const doctorName = selectedDoctor
        ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
        : undefined;

      return (
        <>
          {renderPickerField(
            doctorName,
            () => setShowDoctorPicker(true),
            "Select a doctor"
          )}
          {renderIOSPicker(
            showDoctorPicker,
            () => setShowDoctorPicker(false),
            (itemValue: string) => {
              const doctor = doctors.find((d) => d._id === itemValue);
              setSelectedDoctor(doctor || null);
              setAvailableSlots([]);
              setSelectedSlot(null);
            },
            selectedDoctor?._id,
            doctors.map((doctor) => ({
              _id: doctor._id,
              label: `${doctor.doctor_first_name} ${doctor.doctor_last_name}`,
            })),
            "Doctor"
          )}
        </>
      );
    }

    return (
      <Picker
        selectedValue={selectedDoctor?._id ?? ""}
        onValueChange={(itemValue: string) => {
          if (itemValue !== "") {
            setSelectedDoctor(doctors.find((d) => d._id === itemValue) || null);
            setAvailableSlots([]);
            setSelectedSlot(null);
          }
        }}
        style={styles.picker}
      >
        <Picker.Item label="Select a doctor" value="" />
        {doctors.map((doctor) => (
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
    showSuccessToast("Signed in with LiveSwitch successfully");
  };

  const handleUpdateTherapy = async () => {
    if (!selectedSlot && !editedTherapy.therepy_start_time) {
      handleError(new Error("Please select a time slot for the appointment."));
      return;
    }
    setisUpdating(true);
    try {
      const updatedTherapyData = {
        ...editedTherapy,
        therepy_type: appointmentType,
        therepy_date: moment(selectedDate).format('YYYY-MM-DD'),
        therepy_start_time: selectedSlot !== null && availableSlots.length > 0
          ? availableSlots[selectedSlot].start
          : editedTherapy.therepy_start_time,
        therepy_end_time: selectedSlot !== null && availableSlots.length > 0
          ? availableSlots[selectedSlot].end
          : editedTherapy.therepy_end_time,
        doctor_id: selectedDoctor?._id,
        doctor_name: selectedDoctor ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}` : '',
      };

      await onUpdate(updatedTherapyData);
      showSuccessToast("Therapy session updated successfully");
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
      onRequestClose={onCancel}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Session</Text>
            </View>
            {/* <Text style={styles.modalTitle}>Edit Therapy Session</Text> */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Doctor</Text>
              {renderDoctorPicker()}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appointment Type</Text>
              <HorizontalScrollView 
                horizontal
                contentContainerStyle={styles.appointmentTypesContainer}
              >
              <View style={styles.appointmentTypes}>
                {appointmentTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      appointmentType === type && styles.selectedTypeButton,
                    ]}
                    onPress={() => handleAppointmentTypeChange(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        appointmentType === type &&
                          styles.selectedTypeButtonText,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              </HorizontalScrollView>
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
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.label}>Date:</Text>
              <View style={styles.dateDisplay}>
                <MaterialIcons name="date-range" size={24} color="#119FB3" />
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Slot Duration</Text>
              {renderSlotDurationPicker()}
            </View>
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
                      disabled={isSlotDisabled(slot)}
                    >
                      <Text
                        style={[
                          styles.slotButtonText,
                          isSlotDisabled(slot) && styles.slotButtonTextDisabled,
                          selectedSlot === index &&
                            styles.slotButtonTextSelected,
                        ]}
                      >
                        {slot.start} - {slot.end}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bookButton, isUpdating && { opacity: 0.5 }]}
                onPress={handleUpdateTherapy}
                disabled={
                  isUpdating ||
                  (appointmentType === "Liveswitch" && !hasLiveSwitchAccess)
                }
              >
                <Text style={styles.bookButtonText}>
                  {isUpdating ? "updating..." : "Update Appointment"}
                </Text>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  appointmentTypesContainer: {
    paddingRight: 16,
    paddingLeft: 16,
  },
  appointmentTypes: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 15,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10, // Add space between buttons
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#119FB3",
  },
  selectedTypeButton: {
    backgroundColor: "#119FB3",
  },
  typeButtonText: {
    color: "#119FB3",
    fontSize: 14, // Optional: adjust font size if needed
  },
  selectedTypeButtonText: {
    color: "#FFFFFF",
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#119FB3",
  },
  section: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#119FB3",
    marginBottom: 10,
  },
  slotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 15,
  },
  slotButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#F0F8FF",
  },
  slotButtonDisabled: {
    backgroundColor: "#F5F5F5",
  },
  slotButtonSelected: {
    backgroundColor: "#119FB3",
  },
  slotButtonText: {
    color: "#119FB3",
  },
  slotButtonTextDisabled: {
    color: "#ccc",
  },
  slotButtonTextSelected: {
    color: "#FFFFFF",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    width: "45%",
  },
  cancelButton: {
    backgroundColor: "#2596be",
  },
  bookButton: {
    backgroundColor: "#119FB3",
    padding: 16,
    alignItems: "center",
    borderRadius: 10,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  liveSwitchButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    elevation: 2,
  },

  picker: {
    backgroundColor: "#F0F8FF",
    borderRadius: 10,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  doneButton: {
    padding: 8,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "#119FB3",
    fontSize: 16,
    fontWeight: "600",
  },
  iosPicker: {
    backgroundColor: "#FFFFFF",
    height: 215,
  },

  dateDisplay: {
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: "#fff",
    elevation: 2,
    padding: 12,
    flex: 1,
    flexDirection: "row",
    borderRadius: 5,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1, // Ensure it appears above other content
  },

  liveSwitchButtonText: {
    marginBottom: 10,
    textAlign: "center",
    color: "#333333",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 2,
    color: "#119FB3",
    marginLeft: 5,
  },

  pickerField: {
    backgroundColor: "#F0F8FF",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  pickerFieldText: {
    fontSize: 16,
    color: "#333333",
  },
  pickerPlaceholder: {
    color: "#999999",
  },
  input: {
    borderWidth: 1,
    // borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: "100%",
    fontWeight: "bold",
  },
  dateButton: {
    flexDirection: "row",
    marginVertical: 10,
    // padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: "80%",
    alignItems: "center",
    fontWeight: "bold",
    // marginLeft: 30,
  },
  updateButton: {
    backgroundColor: "#119FB3",
    marginRight: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  infoText: {
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
});

export default EditTherapy;
