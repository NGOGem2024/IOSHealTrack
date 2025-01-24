import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ImageBackground,
  Alert,
  RefreshControl,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import {useSession} from '../context/SessionContext';
import EditTherapy from './Update';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import BackTabTop from './BackTopTab';
import AppointmentDetails from './AppointmentDetails';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
  doctor_name?: string;
}

type TherapyHistoryScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'TherapyHistory'>;
  route: {params: {patientId: string}};
};

const TherapyHistory: React.FC<TherapyHistoryScreenProps> = ({
  navigation,
  route,
}) => {
  const {session} = useSession();
  const patientId = route.params?.patientId;

  const [therapies, setTherapies] = useState<Therapy[] | undefined>(undefined);
  const [pastTherapies, setPastTherapies] = useState<Therapy[]>([]);
  const [upcomingTherapies, setUpcomingTherapies] = useState<Therapy[]>([]);
  const [showPastTherapies, setShowPastTherapies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTherapy, setEditingTherapy] = useState<Therapy | null>(null);
  const [showRemarksPopup, setShowRemarksPopup] = useState(false);
  const [selectedTherapyId, setSelectedTherapyId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [improvements, setImprovements] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [therapyToDelete, setTherapyToDelete] = useState<Therapy | null>(null);
  const [showNewUserPopup, setShowNewUserPopup] = useState(false);
  const popupScale = useSharedValue(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedView, setSelectedView] = useState<'all' | 'past' | 'upcoming'>(
    'all',
  );

  const selectTherapyType = (type: 'all' | 'past' | 'upcoming') => {
    setSelectedView(type);
    setIsDropdownOpen(false);
  };

  const getDisplayedTherapies = () => {
    switch (selectedView) {
      case 'all':
        return [...upcomingTherapies, ...pastTherapies];
      case 'past':
        return pastTherapies;
      case 'upcoming':
        return upcomingTherapies;
      default:
        return [];
    }
  };

  useEffect(() => {
    if (!patientId) {
      setError('No patient ID provided.');
      return;
    }

    fetchTherapies();
  }, [patientId, session]);

  const fetchTherapies = async () => {
    setIsLoading(true);

    try {
      const response = await axiosInstance.get(`/therepy/${patientId}`, {
        headers: {
          Authorization: 'Bearer ' + session.idToken,
        },
      });

      if (response.status === 404) {
        setShowNewUserPopup(true);
        popupScale.value = withSpring(1);
        return;
      }

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = response.data;
      if (data.therepys && Array.isArray(data.therepys)) {
        const now = new Date();
        const past = data.therepys.filter((therapy: Therapy) => {
          const therapyEndTime = new Date(
            `${therapy.therepy_date}T${therapy.therepy_end_time}`,
          );
          return therapyEndTime < now || therapy.status === 'completed';
        });
        const upcoming = data.therepys.filter((therapy: Therapy) => {
          const therapyEndTime = new Date(
            `${therapy.therepy_date}T${therapy.therepy_end_time}`,
          );
          return therapyEndTime >= now && therapy.status !== 'completed';
        });

        setPastTherapies(past);
        setUpcomingTherapies(upcoming);
      } else {
        setShowNewUserPopup(true);
        popupScale.value = withSpring(1);
        return;
      }
    } catch (error) {
      handleError(error);
      if (error instanceof Error && error.message === 'No therapies found') {
        showSuccessToast('You are new. No therapies found.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  const openInAppBrowser = async (url: string) => {
    try {
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.open(url, {
          // iOS Properties
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#007B8E',
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android Properties
          showTitle: true,
          toolbarColor: '#007B8E',
          secondaryToolbarColor: 'black',
          navigationBarColor: 'black',
          navigationBarDividerColor: 'white',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
        });
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      handleError(error);
      // Fallback to normal linking if in-app browser fails
      try {
        await Linking.openURL(url);
      } catch (linkError) {
        handleError(linkError);
      }
    }
  };
  const handleDeleteTherapy = (therapy: Therapy) => {
    setTherapyToDelete(therapy);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteTherapy = async () => {
    if (!therapyToDelete) return;

    setIsDeleting(true); // Start loading
    try {
      const response = await axiosInstance.delete(
        `/therapy/delete/${therapyToDelete._id}`,
      );

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove the deleted therapy from the state
      setUpcomingTherapies(prevTherapies =>
        prevTherapies.filter(therapy => therapy._id !== therapyToDelete._id),
      );

      showSuccessToast('Therapy deleted successfully');
    } catch (error) {
      handleError(error);
    } finally {
      setIsDeleting(false); // Stop loading
      setShowDeleteConfirmation(false);
      setTherapyToDelete(null);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleRecTherapy = async (therepy_id: string) => {
    const recordingUrl = `https://app.contact.liveswitch.com/conversations/${therepy_id}`;
    try {
      await openInAppBrowser(recordingUrl);
    } catch (error) {
      handleError(error);
    }
  };

  const handleJoinSession = (joinUrl: string) => {
    openInAppBrowser(joinUrl);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTherapies();
    } catch (error) {
      handleError(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleEditTherapy = (therapy: Therapy) => {
    setEditingTherapy(therapy);
  };

  const handleUpdateTherapy = async (updatedTherapy: Therapy) => {
    try {
      const liveSwitchToken = await AsyncStorage.getItem('liveSwitchToken');

      // Wait for the response
      const response = await axiosInstance.patch(
        `/therepy/update/${updatedTherapy._id}`,
        updatedTherapy, // Send the data directly, no need for JSON.stringify
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );

      // Check if the response is successful
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the updated data from response
      const updatedData = response.data;

      // Update the local state with the response data
      setTherapies(prevTherapies =>
        prevTherapies?.map(therapy =>
          therapy._id === updatedData.therapy._id
            ? updatedData.therapy
            : therapy,
        ),
      );

      // Close the edit modal
      setEditingTherapy(null);

      // Show success message only after successful update
      showSuccessToast('Therapy updated successfully');

      // Refresh the therapies list
      await fetchTherapies();
    } catch (error) {
      handleError(error);
      showErrorToast('Failed to update therapy');
    }
  };
  const [selectedAppointment, setSelectedAppointment] =
    useState<Therapy | null>(null);

  const handleShowAppointmentDetails = (appointment: Therapy) => {
    setSelectedAppointment(appointment);
  };
  const handleTherapyDone = (therapy: Therapy) => {
    setSelectedTherapyId(therapy._id);
    setRemarks(therapy.therepy_remarks || '');
    setImprovements('');
    setShowRemarksPopup(true);
  };

  const handleSaveRemarks = async () => {
    try {
      const response = await axiosInstance.patch(
        ` /therepy/update/${selectedTherapyId}`,

        {
          therepy_remarks: remarks,
          improvements: improvements,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.idToken}`,
            //auth: `Bearer ${session.tokens.accessToken}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the local state
      setTherapies(prevTherapies =>
        prevTherapies?.map(therapy =>
          therapy._id === selectedTherapyId
            ? {
                ...therapy,
                therepy_remarks: remarks,
                improvements: improvements,
              }
            : therapy,
        ),
      );

      setShowRemarksPopup(false);
      showSuccessToast('Remarks and improvements saved successfully');
    } catch (error) {
      handleError(error);
    }
  };

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{scale: popupScale.value}],
    };
  });

  const closeNewUserPopup = () => {
    popupScale.value = withSpring(0);
    setTimeout(() => setShowNewUserPopup(false), 300);
  };

  const renderTherapyItem = ({item}: {item: Therapy}) => {
    const now = new Date();
    const therapyDate = new Date(item.therepy_date);
    const therapyStartTime = new Date(
      `${item.therepy_date}T${item.therepy_start_time}`,
    );
    const therapyEndTime = new Date(
      `${item.therepy_date}T${item.therepy_end_time}`,
    );

    const isToday =
      now.getFullYear() === therapyDate.getFullYear() &&
      now.getMonth() === therapyDate.getMonth() &&
      now.getDate() === therapyDate.getDate();

    const isUpcoming = therapyStartTime > now && item.status !== 'completed';
    const isOngoing =
      now >= therapyStartTime &&
      now <= therapyEndTime &&
      item.status !== 'completed';
    const isPast = now > therapyEndTime || item.status === 'completed';
    const canStart =
      (isToday || (now >= therapyStartTime && now < therapyEndTime)) &&
      item.status !== 'completed';

    return (
      <View style={styles.therapyCard}>
        {item.status !== 'completed' && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditTherapy(item)}>
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={24}
                color="#007B8E"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTherapy(item)}>
              <MaterialIcons name="delete" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.therapyHeader}>
          <MaterialIcons name="event" size={24} color="#007B8E" />
          <Text style={styles.therapyType}>{item.therepy_type}</Text>
        </View>
        <View style={styles.therapyDetails}>
          <Text style={styles.therapyText}>Date: {item.therepy_date}</Text>
          <Text style={styles.therapyText}>
            Doctor Name: {item.doctor_name}
          </Text>
          <Text style={styles.therapyText}>
            Start Time: {item.therepy_start_time}
          </Text>
          <Text style={styles.therapyText}>
            End Time: {item.therepy_end_time}
          </Text>
          {!isPast && (
            <Text style={styles.therapyText}>
              Remarks: {item.therepy_remarks}
            </Text>
          )}
        </View>
        <View style={styles.buttonContainer}>
          {!isPast && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.joinButton,
                !canStart && styles.disabledButton,
              ]}
              onPress={() => handleShowAppointmentDetails(item)}
              disabled={!canStart}>
              <Text style={styles.buttonText}>
                {canStart ? 'Start Therapy' : 'Upcoming'}
              </Text>
            </TouchableOpacity>
          )}
          {isPast && item.therepy_id && (
            <TouchableOpacity
              style={[styles.actionButton, styles.recordButton]}
              onPress={() => handleRecTherapy(item.therepy_id)}>
              <Text style={styles.buttonText}>Get Recording</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <BackTabTop screenName="Appointments" />
        <View style={styles.container}>
          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={toggleDropdown}
            style={styles.dropdownButton}>
            <Text style={styles.dropdownButtonText}>
              {selectedView === 'all'
                ? 'All Appointments'
                : selectedView === 'past'
                ? 'Past Appointments'
                : 'Upcoming Appointments'}
            </Text>
            <Icon
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#007B8E"
            />
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownContent}>
              <TouchableOpacity
                onPress={() => selectTherapyType('all')}
                style={[
                  styles.dropdownItem,
                  selectedView === 'all' && styles.selectedDropdownItem,
                ]}>
                <Text
                  style={
                    selectedView === 'all'
                      ? styles.selectedDropdownText
                      : styles.dropdownText
                  }>
                  All Appointments
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectTherapyType('past')}
                style={[
                  styles.dropdownItem,
                  selectedView === 'past' && styles.selectedDropdownItem,
                ]}>
                <Text
                  style={
                    selectedView === 'past'
                      ? styles.selectedDropdownText
                      : styles.dropdownText
                  }>
                  Past Appointments
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectTherapyType('upcoming')}
                style={[
                  styles.dropdownItem,
                  selectedView === 'upcoming' && styles.selectedDropdownItem,
                ]}>
                <Text
                  style={
                    selectedView === 'upcoming'
                      ? styles.selectedDropdownText
                      : styles.dropdownText
                  }>
                  Upcoming Appointments
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading ? (
            <Text style={styles.loadingText}>Loading therapies...</Text>
          ) : (
            <FlatList
              data={getDisplayedTherapies()}
              keyExtractor={item => item._id}
              renderItem={renderTherapyItem}
              ListEmptyComponent={
                <Text style={styles.noTherapyText}>
                  No {selectedView === 'all' ? '' : selectedView} Appointments
                  available
                </Text>
              }
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
        {editingTherapy && (
          <EditTherapy
            therapy={editingTherapy}
            onUpdate={handleUpdateTherapy}
            onCancel={() => setEditingTherapy(null)}
          />
        )}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showRemarksPopup}
          onRequestClose={() => setShowRemarksPopup(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Therapy Ended</Text>

              <Text style={styles.inputLabel}>Remarks:</Text>
              <TextInput
                style={styles.input}
                multiline
                numberOfLines={5}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Enter remarks here"
              />

              <Text style={styles.inputLabel}>Improvements:</Text>
              <TextInput
                style={styles.input}
                multiline
                numberOfLines={4}
                value={improvements}
                onChangeText={setImprovements}
                placeholder="Enter Improvements"
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setShowRemarksPopup(false)}>
                  <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSave]}
                  onPress={handleSaveRemarks}>
                  <Text style={styles.textStyle}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="fade"
          transparent={true}
          visible={showDeleteConfirmation}
          onRequestClose={() => setShowDeleteConfirmation(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Confirm Deletion</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete this therapy?
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setShowDeleteConfirmation(false)}>
                  <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonDelete]}
                  onPress={confirmDeleteTherapy}
                  disabled={isDeleting} // Disable button during loading
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.textStyle}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          transparent={true}
          visible={showNewUserPopup}
          onRequestClose={closeNewUserPopup}>
          <View style={styles.centeredView}>
            <Animated.View style={[styles.newUserPopup, animatedStyles]}>
              <Text style={styles.newUserTitle}>Welcome!</Text>
              <Text style={styles.newUserText}>
                The patient is new here. Create your first therapy session to
                get started!
              </Text>
              <TouchableOpacity
                style={styles.createTherapyButton}
                onPress={() => {
                  closeNewUserPopup();
                  // Navigate to create therapy screen or open create therapy modal
                  navigation.navigate('CreateTherapyPlan', {
                    patientId: patientId,
                  });
                }}>
                <Text style={styles.createTherapyButtonText}>
                  Create First Therapy
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
        {selectedAppointment && (
          <View style={styles.fullScreenModal}>
            <AppointmentDetails
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
            />
          </View>
        )}
    </SafeAreaView>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  selectedDropdownItem: {
    backgroundColor: 'rgba(17, 159, 179, 0.1)',
  },
  therapyCard: {
    backgroundColor: '#f0fbfc', // Changed from rgba to solid color
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  modalView: {
    backgroundColor: '#FFFFFF', // Changed from white to solid color
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
    maxWidth: 400,
  },

  newUserPopup: {
    backgroundColor: '#FFFFFF', // Changed from white to solid color
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
    maxWidth: 400,
  },

  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white', // Changed from rgba to solid color
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedDropdownText: {
    color: '#007B8E',
    fontWeight: 'bold',
  },
  dropdownText: {
    color: '#333333',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#007B8E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
    marginTop: 20,
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  error: {
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 1,
  },
  editButton: {
    marginRight: 10,
  },
  deleteButton: {
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  buttonDelete: {
    backgroundColor: '#FF6B6B',
  },
  doneButton: {
    backgroundColor: '#007B8E',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  newUserTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007B8E',
    marginBottom: 15,
  },
  newUserText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  createTherapyButton: {
    backgroundColor: '#007B8E',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  createTherapyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
  },
  buttonSave: {
    backgroundColor: '#007B8E',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#007B8E',
    borderRadius: 5,
    height: 40,
    marginBottom: 20,
    width: '100%',
    padding: 10,
    textAlignVertical: 'top',
  },

  therapyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  therapyType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007B8E',
    marginLeft: 8,
  },
  therapyDetails: {
    marginBottom: 12,
  },
  therapyText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: windowWidth > 360 ? 150 : '50%',
    elevation: 2,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#007B8E',
  },
  recordButton: {
    backgroundColor: '#2596be',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: windowWidth > 360 ? 16 : 14,
  },
  noTherapyText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  dropdownButtonText: {
    color: '#007B8E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007B8E',
  },
  modalText: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  remarksText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: 100,
  },
  buttonClose: {
    backgroundColor: '#007B8E',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TherapyHistory;
function showErrorToast(arg0: string) {
  throw new Error('Function not implemented.');
}
