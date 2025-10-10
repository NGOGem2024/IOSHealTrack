import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import {useSession} from '../context/SessionContext';
import {RootStackNavProps} from '../types/types';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import BackTopTab from './BackTopTab';
import instance from '../utils/axiosConfig';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Location {
  locationId: string;
  name: string;
  address: string;
}

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
  is_active: boolean;
  assigned_at: string;
}

interface DoctorLocationAssignmentProps {
  navigation: any;
  route: {
    params: {
      doctorId: string;
      doctorName: string;
    };
  };
}

const DoctorLocationAssignment: React.FC<DoctorLocationAssignmentProps> = ({
  navigation,
  route,
}) => {
  const {doctorId, doctorName} = route.params;
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const {session} = useSession();

  const [locations, setLocations] = useState<Location[]>([]);
  const [assignedLocations, setAssignedLocations] = useState<
    AssignedLocation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [selectedAssignedLocation, setSelectedAssignedLocation] =
    useState<AssignedLocation | null>(null);

  const [scheduleData, setScheduleData] = useState<WorkingHours>({
    monday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
    tuesday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
    wednesday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
    thursday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
    friday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
    saturday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
    sunday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
  });

  const [hasFixedSchedule, setHasFixedSchedule] = useState(true);
  const [scheduleNotes, setScheduleNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchLocations(), fetchDoctorLocations()]);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    if (!session) return;
    try {
      const response = await instance.get('/get/orgLocations', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
      });
      setLocations(response.data.locations || []);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchDoctorLocations = async () => {
    if (!session) return;
    try {
      const response = await instance.get(`/getalldoctor`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
      });
      const doctor = response.data.doctors.find(
        (d: any) => d._id === doctorId,
      );
      if (doctor && doctor.assigned_locations) {
        setAssignedLocations(doctor.assigned_locations);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const assignLocation = async () => {
    if (!selectedLocation || !session) return;

    try {
      const response = await instance.post(
        `/assign/location/${doctorId}`,
        {
          location_id: selectedLocation.locationId,
          location_name: selectedLocation.name,
          has_fixed_schedule: hasFixedSchedule,
          schedule_notes: scheduleNotes,
          working_hours: scheduleData,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );

      showSuccessToast('Location assigned successfully');
      setShowLocationModal(false);
      setSelectedLocation(null);
      await fetchDoctorLocations();
    } catch (error) {
      handleError(error);
    }
  };

  const updateSchedule = async () => {
    if (!selectedAssignedLocation || !session) return;

    try {
      await instance.put(
        `/add/schedule/${doctorId}/${selectedAssignedLocation.location_id}`,
        {
          working_hours: scheduleData,
          has_fixed_schedule: hasFixedSchedule,
          schedule_notes: scheduleNotes,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );

      showSuccessToast('Schedule updated successfully');
      setShowScheduleModal(false);
      setSelectedAssignedLocation(null);
      await fetchDoctorLocations();
    } catch (error) {
      handleError(error);
    }
  };

  const openAssignModal = (location: Location) => {
    setSelectedLocation(location);
    setScheduleData({
      monday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
      tuesday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
      wednesday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
      thursday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
      friday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
      saturday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
      sunday: {enabled: false, slots: [{start: '09:00', end: '17:00'}]},
    });
    setHasFixedSchedule(true);
    setScheduleNotes('');
    setShowLocationModal(true);
  };

  const openScheduleModal = (assignedLocation: AssignedLocation) => {
    setSelectedAssignedLocation(assignedLocation);
    setScheduleData(assignedLocation.working_hours);
    setHasFixedSchedule(assignedLocation.has_fixed_schedule);
    setScheduleNotes(assignedLocation.schedule_notes || '');
    setShowScheduleModal(true);
  };

  const toggleDayEnabled = (day: keyof WorkingHours) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const isLocationAssigned = (locationId: string) => {
    return assignedLocations.some(al => al.location_id === locationId);
  };

  const renderScheduleEditor = () => {
    const days: Array<keyof WorkingHours> = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    return (
      <ScrollView style={styles.scheduleEditor}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.modalTitle}>
            {hasFixedSchedule ? 'Set Working Hours' : 'Flexible Schedule'}
          </Text>
          <View style={styles.fixedScheduleToggle}>
            <Text style={styles.toggleLabel}>Fixed Schedule</Text>
            <Switch
              value={hasFixedSchedule}
              onValueChange={setHasFixedSchedule}
              trackColor={{false: '#767577', true: '#119FB3'}}
              thumbColor={hasFixedSchedule ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {hasFixedSchedule ? (
          days.map(day => (
            <View key={day} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
                <Switch
                  value={scheduleData[day].enabled}
                  onValueChange={() => toggleDayEnabled(day)}
                  trackColor={{false: '#767577', true: '#119FB3'}}
                  thumbColor={scheduleData[day].enabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>
              {scheduleData[day].enabled && (
                <View style={styles.timeSlots}>
                  {scheduleData[day].slots.map((slot, index) => (
                    <View key={index} style={styles.timeSlot}>
                      <Text style={styles.timeText}>
                        {slot.start} - {slot.end}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Schedule Notes:</Text>
            <Text style={styles.notesText}>
              {scheduleNotes || 'No notes added'}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.safeArea}>
        <ImageBackground
          source={require('../assets/bac2.jpg')}
          style={styles.backgroundImage}>
          <BackTopTab screenName={`Locations - ${doctorName}`} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#119FB3" />
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ImageBackground
        source={require('../assets/bac2.jpg')}
        style={styles.backgroundImage}>
        <BackTopTab screenName={`Locations - ${doctorName}`} />

        <View style={styles.container}>
          {/* Assigned Locations Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Locations</Text>
            {assignedLocations.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="location-off" size={48} color="#999" />
                <Text style={styles.emptyText}>No locations assigned yet</Text>
              </View>
            ) : (
              <FlatList
                data={assignedLocations}
                keyExtractor={item => item.location_id}
                renderItem={({item}) => (
                  <View style={styles.assignedCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.locationInfo}>
                        <MaterialIcons
                          name="location-on"
                          size={20}
                          color="#119FB3"
                        />
                        <Text style={styles.locationName}>
                          {item.location_name}
                        </Text>
                      </View>
                      {item.is_active && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleLabel}>
                        {item.has_fixed_schedule
                          ? 'Fixed Schedule'
                          : 'Flexible Schedule'}
                      </Text>
                      {item.has_fixed_schedule &&
                        Object.entries(item.working_hours).map(
                          ([day, schedule]) =>
                            schedule.enabled && (
                              <Text key={day} style={styles.scheduleText}>
                                {day.charAt(0).toUpperCase() + day.slice(1)}:{' '}
                                {schedule.slots
                                  .map((s: { start: any; end: any; }) => `${s.start}-${s.end}`)
                                  .join(', ')}
                              </Text>
                            ),
                        )}
                    </View>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openScheduleModal(item)}>
                      <MaterialIcons name="edit" size={16} color="#ffffff" />
                      <Text style={styles.editButtonText}>Edit Schedule</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>

          {/* Available Locations Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Locations</Text>
            <FlatList
              data={locations.filter(
                loc => !isLocationAssigned(loc.locationId),
              )}
              keyExtractor={item => item.locationId}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.locationCard}
                  onPress={() => openAssignModal(item)}>
                  <View style={styles.locationCardContent}>
                    <MaterialIcons
                      name="add-location"
                      size={24}
                      color="#119FB3"
                    />
                    <View style={styles.locationDetails}>
                      <Text style={styles.locationCardName}>{item.name}</Text>
                      <Text style={styles.locationAddress}>
                        {item.address}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="arrow-forward-ios"
                    size={16}
                    color="#999"
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>

        {/* Assign Location Modal */}
        <Modal
          visible={showLocationModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLocationModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Assign: {selectedLocation?.name}
                </Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {renderScheduleEditor()}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowLocationModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={assignLocation}>
                  <Text style={styles.saveButtonText}>Assign Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Schedule Modal */}
        <Modal
          visible={showScheduleModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowScheduleModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Edit: {selectedAssignedLocation?.location_name}
                </Text>
                <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {renderScheduleEditor()}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowScheduleModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={updateSchedule}>
                  <Text style={styles.saveButtonText}>Update Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    container: {
      flex: 1,
      padding: 16,
    },
    backgroundImage: {
      flex: 1,
      resizeMode: 'cover',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    section: {
      flex: 1,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 12,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
    },
    emptyText: {
      color: '#999',
      marginTop: 8,
      fontSize: 14,
    },
    assignedCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      elevation: 4,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    locationName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    activeBadge: {
      backgroundColor: '#4CAF50',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    activeBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    scheduleInfo: {
      marginTop: 8,
      marginBottom: 12,
    },
    scheduleLabel: {
      fontSize: 12,
      color: '#119FB3',
      fontWeight: '600',
      marginBottom: 4,
    },
    scheduleText: {
      fontSize: 11,
      color: theme.colors.text,
      marginLeft: 8,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#119FB3',
      borderRadius: 6,
      padding: 8,
      gap: 4,
    },
    editButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
    },
    locationCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 2,
    },
    locationCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    locationDetails: {
      flex: 1,
    },
    locationCardName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    locationAddress: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      width: '90%',
      maxHeight: '80%',
      padding: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    scheduleEditor: {
      maxHeight: 400,
    },
    scheduleHeader: {
      marginBottom: 16,
    },
    fixedScheduleToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
    },
    toggleLabel: {
      fontSize: 14,
      color: '#333',
      fontWeight: '600',
    },
    dayContainer: {
      marginBottom: 12,
      padding: 12,
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dayName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
    },
    timeSlots: {
      marginTop: 8,
    },
    timeSlot: {
      backgroundColor: '#ffffff',
      padding: 8,
      borderRadius: 6,
      marginTop: 4,
    },
    timeText: {
      fontSize: 12,
      color: '#666',
    },
    notesContainer: {
      padding: 12,
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
    },
    notesLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginBottom: 8,
    },
    notesText: {
      fontSize: 12,
      color: '#666',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#119FB3',
      alignItems: 'center',
    },
    cancelButtonText: {
      color: '#119FB3',
      fontSize: 14,
      fontWeight: '600',
    },
    saveButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#119FB3',
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default DoctorLocationAssignment;