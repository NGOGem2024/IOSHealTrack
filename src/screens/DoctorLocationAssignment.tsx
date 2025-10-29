import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScaledSize,
  Image,
  Modal,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSession} from '../context/SessionContext';
import {RootStackNavProps} from '../types/types';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import BackTopTab from './BackTopTab';
import instance from '../utils/axiosConfig';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_phone: string;
  doctor_email: string;
  is_admin: boolean;
  organization_name: string;
  doctors_photo?: string;
  assigned_locations?: AssignedLocation[];
}

interface Location {
  locationId: string;
  name: string;
  address?: string;
}

interface AssignedLocation {
  location_id: string;
  location_name: string;
  is_active: boolean;
  assigned_at: Date;
}

// Skeleton animation component
const SkeletonAnimation = ({children}: {children: React.ReactNode}) => {
  const [opacity] = useState(new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return <Animated.View style={{opacity}}>{children}</Animated.View>;
};

// Doctor card skeleton component
const DoctorCardSkeleton = ({theme}: {theme: ReturnType<typeof getTheme>}) => {
  const styles = getStyles(theme);

  return (
    <View style={styles.doctorCard}>
      <View style={styles.doctorCardContent}>
        <View style={[styles.doctorImage, styles.skeletonBox]} />
        <View style={styles.doctorDetails}>
          <View
            style={[
              styles.skeletonLine,
              {width: '70%', height: 16, marginBottom: 8},
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              {width: '50%', height: 12, marginBottom: 4},
            ]}
          />
          <View style={[styles.skeletonLine, {width: '80%', height: 12}]} />
        </View>
      </View>
    </View>
  );
};

const DoctorLocationAssignment: React.FC<RootStackNavProps<'DoctorLocationAssignment'>> = ({
  navigation,
}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const currentTheme = getTheme(
    theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
  );
  const {session} = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(
    Dimensions.get('window'),
  );

  useEffect(() => {
    const updateDimensions = ({window}: {window: ScaledSize}) => {
      setScreenDimensions(window);
    };

    const subscription = Dimensions.addEventListener(
      'change',
      updateDimensions,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchDoctors(), fetchLocations()]);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    if (!session) return;
    try {
      const response = await instance.get('/getalldoctor', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
      });
      setDoctors(response.data.doctors);
    } catch (error) {
      handleError(error);
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
      setLocations(response.data.locations);
    } catch (error) {
      handleError(error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      handleError(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const toggleDoctorSelection = (doctorId: string) => {
    setSelectedDoctors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(doctorId)) {
        newSet.delete(doctorId);
      } else {
        newSet.add(doctorId);
      }
      return newSet;
    });
  };

  const selectAllDoctors = () => {
    if (selectedDoctors.size === doctors.length) {
      setSelectedDoctors(new Set());
    } else {
      setSelectedDoctors(new Set(doctors.map(d => d._id)));
    }
  };

  const openLocationModal = () => {
    if (selectedDoctors.size === 0) {
      Alert.alert('No Selection', 'Please select at least one doctor');
      return;
    }
    setModalVisible(true);
  };

  const assignLocationToDoctors = async () => {
    if (!selectedLocation) {
      Alert.alert('No Location', 'Please select a location');
      return;
    }

    setIsAssigning(true);
    try {
      const assignmentPromises = Array.from(selectedDoctors).map(doctorId =>
        instance.post(
          `/assign/location/${doctorId}`,
          {
            location_id: selectedLocation.locationId,
            location_name: selectedLocation.name,
            has_fixed_schedule: true,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + session?.idToken,
            },
          },
        ),
      );

      await Promise.all(assignmentPromises);

      showSuccessToast(
        `Successfully assigned ${selectedDoctors.size} doctor(s) to ${selectedLocation.name}`,
      );
      setModalVisible(false);
      setSelectedDoctors(new Set());
      setSelectedLocation(null);
      await fetchDoctors();
    } catch (error) {
      handleError(error);
    } finally {
      setIsAssigning(false);
    }
  };

  const isLocationAssigned = (doctor: Doctor, locationId: string): boolean => {
    return (
      doctor.assigned_locations?.some(
        loc => loc.location_id === locationId && loc.is_active,
      ) || false
    );
  };

  const renderDoctorCard = ({item}: {item: Doctor}) => {
    const isSelected = selectedDoctors.has(item._id);

    return (
      <TouchableOpacity
        onPress={() => toggleDoctorSelection(item._id)}
        activeOpacity={0.7}>
        <View
          style={[
            styles.doctorCard,
            isSelected && styles.doctorCardSelected,
          ]}>
          <View style={styles.doctorCardContent}>
            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </View>
            </View>
            <Image
              source={
                item.doctors_photo
                  ? {uri: item.doctors_photo}
                  : require('../assets/profile.png')
              }
              style={styles.doctorImage}
            />
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>
                {item.doctor_first_name} {item.doctor_last_name}
              </Text>
              <View style={styles.microicon}>
                <MaterialIcons name="email" size={12} color="#119FB3" />
                <Text style={styles.doctorInfo}>{item.doctor_email}</Text>
              </View>
              {item.assigned_locations && item.assigned_locations.length > 0 && (
                <View style={styles.locationBadgeContainer}>
                  <MaterialIcons name="location-on" size={12} color="#119FB3" />
                  <Text style={styles.locationCount}>
                    {item.assigned_locations.filter(loc => loc.is_active).length}{' '}
                    location(s)
                  </Text>
                </View>
              )}
            </View>
          </View>
          {item.is_admin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderLocationItem = ({item}: {item: Location}) => {
    const isSelected = selectedLocation?.locationId === item.locationId;
    const assignedDoctorsCount = Array.from(selectedDoctors).filter(doctorId => {
      const doctor = doctors.find(d => d._id === doctorId);
      return doctor && isLocationAssigned(doctor, item.locationId);
    }).length;

    return (
      <TouchableOpacity
        onPress={() => setSelectedLocation(item)}
        style={[
          styles.locationItem,
          isSelected && styles.locationItemSelected,
        ]}>
        <View style={styles.locationItemContent}>
          <View style={styles.locationIconContainer}>
            <MaterialIcons name="location-city" size={24} color="#119FB3" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{item.name}</Text>
            {item.address && (
              <Text style={styles.locationAddress}>{item.address}</Text>
            )}
            {assignedDoctorsCount > 0 && (
              <Text style={styles.alreadyAssignedText}>
                {assignedDoctorsCount} already assigned
              </Text>
            )}
          </View>
          <View
            style={[
              styles.radioButton,
              isSelected && styles.radioButtonSelected,
            ]}>
            {isSelected && <View style={styles.radioButtonInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.safeArea}>
        <ImageBackground
          source={require('../assets/bac2.jpg')}
          style={styles.backgroundImage}>
          <BackTopTab screenName="Assign Locations" />
          <View
            style={[styles.container, {height: screenDimensions.height * 0.9}]}>
            <SkeletonAnimation>
              <View>
                {[...Array(6)].map((_, index) => (
                  <DoctorCardSkeleton key={index} theme={currentTheme} />
                ))}
              </View>
            </SkeletonAnimation>
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
        <BackTopTab screenName="Assign Locations" />
        <View
          style={[styles.container, {height: screenDimensions.height * 0.9}]}>
          {/* Header with selection controls */}
          <View style={styles.headerContainer}>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionText}>
                {selectedDoctors.size} of {doctors.length} selected
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={selectAllDoctors}
                style={styles.selectAllButton}>
                <Text style={styles.selectAllButtonText}>
                  {selectedDoctors.size === doctors.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={openLocationModal}
                style={[
                  styles.assignButton,
                  selectedDoctors.size === 0 && styles.assignButtonDisabled,
                ]}
                disabled={selectedDoctors.size === 0}>
                <MaterialIcons name="add-location" size={20} color="#FFFFFF" />
                <Text style={styles.assignButtonText}>Assign Location</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Doctors List */}
          <FlatList
            data={doctors}
            keyExtractor={item => item._id}
            renderItem={renderDoctorCard}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="person-off" size={64} color="#999" />
                <Text style={styles.emptyText}>No doctors found</Text>
              </View>
            }
          />
        </View>

        {/* Location Selection Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Assigning to {selectedDoctors.size} doctor(s)
              </Text>

              <ScrollView style={styles.locationsList}>
                {locations.map(location => (
                  <View key={location.locationId}>
                    {renderLocationItem({item: location})}
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!selectedLocation || isAssigning) &&
                      styles.confirmButtonDisabled,
                  ]}
                  onPress={assignLocationToDoctors}
                  disabled={!selectedLocation || isAssigning}>
                  {isAssigning ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Assign</Text>
                  )}
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
      paddingLeft: 16,
      paddingRight: 16,
      backgroundColor: '#007B8E',
    },
    backgroundImage: {
      flex: 1,
      resizeMode: 'cover',
    },
    headerContainer: {
      marginBottom: 12,
      paddingTop: 8,
    },
    selectionInfo: {
      marginBottom: 8,
    },
    selectionText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    headerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    selectAllButton: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    selectAllButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    assignButton: {
      flex: 1,
      backgroundColor: '#119FB3',
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    assignButtonDisabled: {
      backgroundColor: '#999',
      opacity: 0.6,
    },
    assignButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    doctorCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 12,
      marginTop: 5,
      marginBottom: 5,
      elevation: 4,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    doctorCardSelected: {
      borderColor: '#119FB3',
      backgroundColor: theme.colors.card,
    },
    doctorCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkboxContainer: {
      marginRight: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#119FB3',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: '#119FB3',
    },
    doctorImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
      borderWidth: 1,
      borderColor: '#119FB3',
    },
    doctorDetails: {
      flex: 1,
    },
    doctorName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.colors.text,
    },
    doctorInfo: {
      fontSize: 12,
      marginTop: 0,
      marginBottom: 0,
      color: theme.colors.text,
      textAlign: 'left',
    },
    microicon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    locationBadgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    locationCount: {
      fontSize: 11,
      color: '#119FB3',
      fontWeight: '600',
    },
    adminBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: '#119FB3',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    adminBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    skeletonBox: {
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      borderColor: 'transparent',
    },
    skeletonLine: {
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      borderRadius: 4,
      marginVertical: 2,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: '#999',
      marginTop: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
    },
    modalSubtitle: {
      fontSize: 14,
      color: '#666',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    locationsList: {
      paddingHorizontal: 20,
      maxHeight: 400,
    },
    locationItem: {
      backgroundColor: '#F5F5F5',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    locationItemSelected: {
      borderColor: '#119FB3',
      backgroundColor: '#E6F7F9',
    },
    locationItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationIconContainer: {
      marginRight: 12,
    },
    locationInfo: {
      flex: 1,
    },
    locationName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 4,
    },
    locationAddress: {
      fontSize: 13,
      color: '#666',
    },
    alreadyAssignedText: {
      fontSize: 12,
      color: '#119FB3',
      marginTop: 4,
      fontStyle: 'italic',
    },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#119FB3',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioButtonSelected: {
      borderColor: '#119FB3',
    },
    radioButtonInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#119FB3',
    },
    modalFooter: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#F5F5F5',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: '#666',
      fontSize: 16,
      fontWeight: '600',
    },
    confirmButton: {
      flex: 1,
      backgroundColor: '#119FB3',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    confirmButtonDisabled: {
      backgroundColor: '#999',
      opacity: 0.6,
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default DoctorLocationAssignment;