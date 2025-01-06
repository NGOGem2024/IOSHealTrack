import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  BackHandler,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import BackTabTop from './BackTopTab';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import {RootStackParamList} from '../types/types';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {SafeAreaView} from 'react-native-safe-area-context';

interface AppointmentDetailsScreenProps {
  appointment: {
    plan_id: string;
    _id: string;
    patient_id: string;
    therepy_type: string;
    therepy_link?: string;
    therepy_start_time: string;
    therepy_date: string;
    patient_name?: string;
    doctor_name?: string;
  };
  onClose: () => void;
}

interface AppointmentState {
  isStarted: boolean;
  startTime: string | null;
  elapsedTime: number;
  previousRemarks: string;
  postRemarks: string;
  isCompleted: boolean;
}
const MAX_SESSION_TIME = 10800; // 3 hours in seconds

const AppointmentDetailsScreen: React.FC<AppointmentDetailsScreenProps> = ({
  appointment,
  onClose,
}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [previousRemarks, setPreviousRemarks] = useState('');
  const [postRemarks, setPostRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [rotation] = useState(new Animated.Value(0));
  const [isCompleted, setIsCompleted] = useState(false);
  useEffect(() => {
    const checkTimeLimit = async () => {
      if (startTime) {
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(startTime).getTime()) / 1000,
        );
        if (elapsed >= MAX_SESSION_TIME) {
          await handleTimeExceeded();
        }
      }
    };
    checkTimeLimit();
  }, []);
  const handleTimeExceeded = async () => {
    setIsStarted(false);
    setStartTime(null);
    setElapsedTime(0);
    await clearAppointmentState();
    Alert.alert(
      'Session Expired',
      'The session has exceeded the 3-hour limit and has been automatically ended.',
    );
  };
  // Load saved state on component mount
  useEffect(() => {
    loadAppointmentState();
  }, []);

  // Save state when important values change
  useEffect(() => {
    saveAppointmentState();
  }, [isStarted, startTime, elapsedTime, previousRemarks, postRemarks]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );
    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    saveAppointmentState();
    onClose();
    return true;
  };

  // Load saved state from AsyncStorage
  const loadAppointmentState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(
        `appointment_${appointment._id}`,
      );
      if (savedState) {
        const state: AppointmentState = JSON.parse(savedState);
        setIsStarted(state.isStarted);
        setStartTime(state.startTime ? new Date(state.startTime) : null);
        setElapsedTime(state.elapsedTime);
        setPreviousRemarks(state.previousRemarks);
        setPostRemarks(state.postRemarks);
        setIsCompleted(state.isCompleted);
      }
    } catch (error) {
      console.error('Error loading appointment state:', error);
    }
  };

  // Save current state to AsyncStorage
  const saveAppointmentState = async () => {
    try {
      const state: AppointmentState = {
        isStarted,
        startTime: startTime?.toISOString() || null,
        elapsedTime,
        previousRemarks,
        postRemarks,
        isCompleted,
      };
      await AsyncStorage.setItem(
        `appointment_${appointment._id}`,
        JSON.stringify(state),
      );
    } catch (error) {
      console.error('Error saving appointment state:', error);
    }
  };
  // Clear saved state
  const clearAppointmentState = async () => {
    try {
      await AsyncStorage.removeItem(`appointment_${appointment._id}`);
    } catch (error) {
      console.error('Error clearing appointment state:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && startTime) {
      interval = setInterval(() => {
        setElapsedTime(
          Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
        );
      }, 1000);

      // Start the rotation animation
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    }
    return () => {
      clearInterval(interval);
      rotation.setValue(0);
    };
  }, [isStarted, startTime, rotation]);

  const handleJoinSession = async (joinUrl: string | undefined) => {
    if (!joinUrl) {
      Alert.alert('Error', 'No session URL provided');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(joinUrl);
      if (supported) {
        await Linking.openURL(joinUrl);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open session URL');
    }
  };

  const handleStart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/therapy/start/${appointment._id}`,
        {
          presession_remarks: previousRemarks,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        setIsStarted(true);
        setStartTime(new Date());
      } else {
        Alert.alert('Error', 'Failed to start therapy session.');
      }
    } catch (error) {
      console.error('Failed to start therapy session:', error);
      Alert.alert('Error', 'Failed to start therapy session.');
    } finally {
      setLoading(false);
    }
  }, [appointment._id, previousRemarks]);

  const handleCancel = () => {
    clearAppointmentState();
    setPreviousRemarks('');
    onClose();
  };

  const handleShowEndModal = () => {
    setModalVisible(true);
  };

  const handleEnd = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/therapy/end/${appointment._id}`,
        {
          postsession_remarks: postRemarks,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        setIsCompleted(true);
        await saveAppointmentState();
        setModalVisible(false);
        onClose();
        navigation.navigate('payment', {
          planId: appointment.plan_id,
          patientId: appointment.patient_id,
        });
      } else {
        Alert.alert('Error', 'Failed to end therapy session.');
      }
    } catch (error) {
      console.error('Failed to end therapy session:', error);
      Alert.alert('Error', 'Failed to end therapy session.');
    } finally {
      setLoading(false);
    }
  }, [appointment._id, postRemarks]);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && startTime) {
      interval = setInterval(() => {
        const newElapsedTime = Math.floor(
          (new Date().getTime() - startTime.getTime()) / 1000,
        );
        if (newElapsedTime >= MAX_SESSION_TIME) {
          handleTimeExceeded();
        } else {
          setElapsedTime(newElapsedTime);
        }
      }, 1000);

      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    }
    return () => {
      clearInterval(interval);
      rotation.setValue(0);
    };
  }, [isStarted, startTime, rotation]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.dateContainer}>
          {isStarted ? (
            <Text style={styles.dateText}>{`${appointment.patient_name}`}</Text>
          ) : (
            <Text style={styles.dateText}>
              {new Date(appointment.therepy_date).toDateString()}
            </Text>
          )}
        </View>

        <View style={styles.detailsContainer}>
          {isCompleted ? (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>Session Completed</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : !isStarted ? (
            <>
              <View style={styles.card}>
                <Text style={styles.detailTitle}>Patient Name</Text>
                <Text style={styles.detailText}>
                  {appointment.patient_name}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.detailTitle}>Therapy Type</Text>
                <Text style={styles.detailText}>
                  {appointment.therepy_type}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.detailTitle}>Therapy Start Time</Text>
                <Text style={styles.detailText}>
                  {appointment.therepy_start_time}
                </Text>
              </View>

              <Text style={styles.detailTitle}>Pre-Session Remarks</Text>
              <TextInput
                style={styles.remarksInput}
                multiline
                numberOfLines={4}
                onChangeText={setPreviousRemarks}
                value={previousRemarks}
                placeholder="Enter previous session remarks"
              />
              {appointment.therepy_link && (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleJoinSession(appointment.therepy_link)}>
                    <Text style={styles.uploadButtonText}>Upload Videos</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStart}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Start Therapy</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.timerContainer}>
              <Animated.View style={styles.timerRing}>
                <View style={styles.timerInnerRing}>
                  <Text style={styles.timerText}>
                    {formatTime(elapsedTime)}
                  </Text>
                </View>
              </Animated.View>
              {appointment.therepy_link && (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => handleJoinSession(appointment.therepy_link)}>
                  <Text style={styles.buttonText}>Join Session</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.endButton}
                onPress={handleShowEndModal}>
                <Text style={styles.buttonText}>End Therapy</Text>
              </TouchableOpacity>
            </View>
          )}
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Post-Session Remarks</Text>
                <TextInput
                  style={styles.remarksInput}
                  multiline
                  numberOfLines={4}
                  onChangeText={setPostRemarks}
                  value={postRemarks}
                  placeholder="Enter post session remarks"
                />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleEnd}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Submit and End Session
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    header: {
      height: 56,
      backgroundColor: theme.colors.card || '#119FB3',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    backButton: {
      padding: 2,
    },
    headerTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: 'bold',
    },
    completedContainer: {
      alignItems: 'center',
      padding: 20,
    },
    completedText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
    },
    headerRight: {
      width: 40,
    },
    cancelButton: {
      backgroundColor: theme.colors.card, // Set the color for cancel button
      marginTop: 10,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    timerContainer: {
      alignItems: 'center',
      marginTop: 30,
      marginBottom: 30,
    },
    timerRing: {
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 10,
      borderColor: '#119FB3',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    timerInnerRing: {
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: '#f1f2f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timerText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    joinButton: {
      backgroundColor: '#27ae60',
      padding: 15,
      borderRadius: 25,
      width: '80%',
      alignItems: 'center',
      marginBottom: 10,
    },
    endButton: {
      backgroundColor: '#e74c3c',
      padding: 15,
      borderRadius: 25,
      width: '80%',
      alignItems: 'center',
    },
    buttonText: {
      color: theme.colors.text,
      fontWeight: 'bold',
      fontSize: 16,
    },
    dateContainer: {
      backgroundColor: '#119FB3',
      width: '90%',
      padding: 10,
      marginLeft: 20,
      borderRadius: 10,
      elevation: 2,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    uploadButton: {
      backgroundColor: '#90D5FF',
      padding: 10,
      borderRadius: 8,
      flex: 1,
      marginHorizontal: 4,
    },

    uploadButtonText: {
      color: 'black',
      textAlign: 'center',
    },
    dateText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    timerLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    timerBox: {
      backgroundColor: '#e0e0e0',
      borderRadius: 15,
      padding: 20,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },

    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: 16,
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    detailsContainer: {
      padding: 16,
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    detailTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    startButton: {
      backgroundColor: '#119FB3',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    remarksInput: {
      borderWidth: 1,
      borderColor: '#cccccc',
      borderRadius: 8,
      padding: 8,
      height: 100,
      color: theme.colors.text,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      padding: 20,
      borderRadius: 10,
      width: '90%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme.colors.text,
      textAlign: 'center',
    },
    modalButton: {
      backgroundColor: '#119FB3',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
  });

export default AppointmentDetailsScreen;
