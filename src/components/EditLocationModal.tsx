import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Picker} from '@react-native-picker/picker';
import axiosInstance from '../utils/axiosConfig';
import {useSession} from '../context/SessionContext';
import {handleError} from '../utils/errorHandler';

const {width, height} = Dimensions.get('window');

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface AssignedLocation {
  location_id: string;
  location_name: string;
  working_hours: WorkingHours;
  has_fixed_schedule: boolean;
  schedule_notes: string;
  assigned_at: string;
  is_active: boolean;
  _id?: string;
}

interface Location {
  locationId: string;
  name: string;
  address?: string;
}

interface EditLocationModalProps {
  visible: boolean;
  location: AssignedLocation | null;
  onClose: () => void;
  onSave: (location: AssignedLocation) => void;
  isEdit: boolean;
  themeColors: {
    card: string;
    text: string;
    background: string;
  };
  assignedLocations: AssignedLocation[];
}

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const initialDaySchedule: DaySchedule = {
  enabled: false,
  slots: [],
};

const initialWorkingHours: WorkingHours = {
  monday: {...initialDaySchedule},
  tuesday: {...initialDaySchedule},
  wednesday: {...initialDaySchedule},
  thursday: {...initialDaySchedule},
  friday: {...initialDaySchedule},
  saturday: {...initialDaySchedule},
  sunday: {...initialDaySchedule},
};

const EditLocationModal: React.FC<EditLocationModalProps> = ({
  visible,
  location,
  onClose,
  onSave,
  isEdit,
  themeColors,
  assignedLocations,
}) => {
  const {session} = useSession();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<AssignedLocation>({
    location_id: '',
    location_name: '',
    working_hours: initialWorkingHours,
    has_fixed_schedule: true,
    schedule_notes: '',
    assigned_at: new Date().toISOString(),
    is_active: true,
  });

  useEffect(() => {
    if (visible) {
      fetchLocations();
      if (location) {
        setCurrentLocation(location);
      } else {
        setCurrentLocation({
          location_id: '',
          location_name: '',
          working_hours: initialWorkingHours,
          has_fixed_schedule: true,
          schedule_notes: '',
          assigned_at: new Date().toISOString(),
          is_active: true,
        });
      }
    }
  }, [visible, location]);

  useEffect(() => {
    if (locations.length > 0) {
      const assignedIds = assignedLocations.map(loc => loc.location_id);
      let excludeIds = assignedIds;
      if (isEdit && location) {
        excludeIds = assignedIds.filter(id => id !== location.location_id);
      }
      const filtered = locations.filter(loc => !excludeIds.includes(loc.locationId));
      setFilteredLocations(filtered);
    }
  }, [locations, assignedLocations, isEdit, location]);

  const fetchLocations = async () => {
    if (!session) return;
    
    setIsLoadingLocations(true);
    try {
      const response = await axiosInstance.get('/get/orgLocations', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
      });
      setLocations(response.data.locations || []);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    const selectedLoc = filteredLocations.find(loc => loc.locationId === locationId);
    if (selectedLoc) {
      setCurrentLocation(prev => ({
        ...prev,
        location_id: selectedLoc.locationId,
        location_name: selectedLoc.name,
      }));
    } else if (locationId === '') {
      setCurrentLocation(prev => ({
        ...prev,
        location_id: '',
        location_name: '',
      }));
    }
  };

  const handleDayToggle = (day: string) => {
    setCurrentLocation(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof WorkingHours],
          enabled: !prev.working_hours[day as keyof WorkingHours].enabled,
        },
      },
    }));
  };

  const handleAddTimeSlot = (day: string) => {
    setCurrentLocation(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof WorkingHours],
          slots: [
            ...prev.working_hours[day as keyof WorkingHours].slots,
            {start: '09:00', end: '17:00'},
          ],
        },
      },
    }));
  };

  const handleRemoveTimeSlot = (day: string, slotIndex: number) => {
    setCurrentLocation(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof WorkingHours],
          slots: prev.working_hours[day as keyof WorkingHours].slots.filter(
            (_, i) => i !== slotIndex,
          ),
        },
      },
    }));
  };

  const handleTimeChange = (
    day: string,
    slotIndex: number,
    type: 'start' | 'end',
    value: string,
  ) => {
    const updatedSlots = [
      ...currentLocation.working_hours[day as keyof WorkingHours].slots,
    ];
    updatedSlots[slotIndex] = {
      ...updatedSlots[slotIndex],
      [type]: value,
    };

    setCurrentLocation(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof WorkingHours],
          slots: updatedSlots,
        },
      },
    }));
  };

  const handleSave = () => {
    if (!currentLocation.location_name.trim()) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    onSave(currentLocation);
    onClose();
  };

  const styles = getStyles(themeColors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Edit Location' : 'Add Location'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={28} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}>
            {/* Location Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Location <Text style={styles.requiredStar}>*</Text>
              </Text>
              {isLoadingLocations ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#119FB3" />
                  <Text style={styles.loadingText}>Loading locations...</Text>
                </View>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={currentLocation.location_id}
                    onValueChange={handleLocationSelect}
                    style={styles.picker}
                    dropdownIconColor="#119FB3">
                    <Picker.Item label="Select a location" value="" />
                    {filteredLocations.map(loc => (
                      <Picker.Item
                        key={loc.locationId}
                        label={loc.name}
                        value={loc.locationId}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            {/* Schedule Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Schedule Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={currentLocation.schedule_notes}
                onChangeText={text =>
                  setCurrentLocation(prev => ({
                    ...prev,
                    schedule_notes: text,
                  }))
                }
                placeholder="Add any schedule notes"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Active Toggle */}
            <View style={styles.switchContainer}>
              <Text style={styles.label}>Active Status</Text>
              <Switch
                value={currentLocation.is_active}
                onValueChange={value =>
                  setCurrentLocation(prev => ({
                    ...prev,
                    is_active: value,
                  }))
                }
                trackColor={{false: '#767577', true: '#119FB3'}}
                thumbColor={currentLocation.is_active ? '#fff' : '#f4f3f4'}
              />
            </View>

            {/* Working Hours Section */}
            <Text style={styles.sectionTitle}>Working Hours</Text>
            <Text style={styles.sectionSubtitle}>
              Configure weekly schedule for this location
            </Text>

            {/* Weekdays */}
            {DAYS_OF_WEEK.map(day => (
              <View key={day} style={styles.dayContainer}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Text>
                  <Switch
                    value={
                      currentLocation.working_hours[day as keyof WorkingHours]
                        .enabled
                    }
                    onValueChange={() => handleDayToggle(day)}
                    trackColor={{false: '#767577', true: '#119FB3'}}
                    thumbColor={
                      currentLocation.working_hours[day as keyof WorkingHours]
                        .enabled
                        ? '#fff'
                        : '#f4f3f4'
                    }
                  />
                </View>

                {currentLocation.working_hours[day as keyof WorkingHours]
                  .enabled && (
                  <View style={styles.slotsContainer}>
                    {currentLocation.working_hours[
                      day as keyof WorkingHours
                    ].slots.map((slot, slotIndex) => (
                      <View key={slotIndex} style={styles.timeSlotContainer}>
                        <TextInput
                          style={styles.timeInput}
                          value={slot.start}
                          onChangeText={text =>
                            handleTimeChange(day, slotIndex, 'start', text)
                          }
                          placeholder="09:00"
                          placeholderTextColor="#999"
                        />
                        <Text style={styles.timeSeparator}>to</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={slot.end}
                          onChangeText={text =>
                            handleTimeChange(day, slotIndex, 'end', text)
                          }
                          placeholder="17:00"
                          placeholderTextColor="#999"
                        />
                        <TouchableOpacity
                          onPress={() => handleRemoveTimeSlot(day, slotIndex)}
                          style={styles.removeSlotButton}>
                          <Icon name="trash-outline" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addSlotButton}
                      onPress={() => handleAddTimeSlot(day)}>
                      <Icon name="add-circle-outline" size={20} color="#119FB3" />
                      <Text style={styles.addSlotText}>Add Time Slot</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isEdit ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (themeColors: {card: string; text: string; background: string}) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: themeColors.card,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      height: height * 0.9,
      display: 'flex',
      flexDirection: 'column',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#119FB3',
    },
    closeButton: {
      padding: 5,
    },
    modalBody: {
      flex: 1,
      paddingHorizontal: 20,
    },
    modalBodyContent: {
      paddingTop: 15,
      paddingBottom: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      color: '#119FB3',
      marginBottom: 8,
      fontWeight: '600',
    },
    requiredStar: {
      color: 'red',
      fontWeight: 'bold',
    },
    pickerContainer: {
      backgroundColor: themeColors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#119FB3',
      overflow: 'hidden',
    },
    picker: {
      height: 50,
      color: themeColors.text,
    },
    input: {
      backgroundColor: themeColors.background,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: '#119FB3',
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: themeColors.background,
      borderRadius: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#119FB3',
      marginTop: 10,
      marginBottom: 5,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: themeColors.text,
      opacity: 0.7,
      marginBottom: 15,
    },
    dayContainer: {
      marginBottom: 15,
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 15,
      borderWidth: 1,
      borderColor: '#119FB3',
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    dayName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
    },
    slotsContainer: {
      marginTop: 8,
    },
    timeSlotContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    timeInput: {
      flex: 1,
      backgroundColor: themeColors.card,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: '#119FB3',
    },
    timeSeparator: {
      fontSize: 14,
      color: themeColors.text,
      fontWeight: '600',
      paddingHorizontal: 5,
    },
    removeSlotButton: {
      padding: 8,
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      borderRadius: 8,
    },
    addSlotButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(17, 159, 179, 0.1)',
      borderRadius: 8,
      padding: 12,
      marginTop: 5,
      borderWidth: 1,
      borderColor: '#119FB3',
      borderStyle: 'dashed',
    },
    addSlotText: {
      color: '#119FB3',
      marginLeft: 8,
      fontWeight: '600',
      fontSize: 14,
    },
    modalFooter: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: '#119FB3',
      backgroundColor: themeColors.card,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#119FB3',
    },
    cancelButtonText: {
      color: themeColors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    saveButton: {
      flex: 1,
      backgroundColor: '#119FB3',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      backgroundColor: themeColors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#119FB3',
    },
    loadingText: {
      marginLeft: 10,
      color: themeColors.text,
      fontSize: 14,
    },
  });

export default EditLocationModal;