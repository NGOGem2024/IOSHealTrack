import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';
import AppointmentDetailsScreen from './AppointmentDetails';
import NoAppointmentsPopup from './Noappointmentspopup';
import BackTabTop from './BackTopTab';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList, RootTabParamList} from '../types/types';
import LoadingScreen from '../components/loadingScreen';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import WhatsAppReminderButton from './WhatsappReminder';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'AllAppointments'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface Appointment {
  _id: string;
  plan_id: string;
  patient_id: string;
  therepy_type: string;
  therepy_link?: string;
  therepy_start_time: string;
  therepy_end_time: string;
  therepy_date: string;
  patient_name?: string;
  doctor_name?: string;
  status?: string;
  doctor_id: string;
  therapy_reason?: string;
  is_consultation?: boolean;
}

interface DayData {
  date: Date;
  appointments: Appointment[];
}

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 80;
const DAYS_TO_LOAD = 7; // Number of days to load at once

interface SkeletonProps {
  isDarkMode: boolean;
}

// Skeleton component for appointments
const AppointmentSkeleton = ({isDarkMode}: SkeletonProps) => {
  const styles = getSkeletonStyles(isDarkMode);
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.appointmentItem, {opacity: fadeAnim}]}>
      <View style={styles.appointmentContent}>
        <View style={styles.timeContainer}>
          <View style={styles.timeText} />
          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.appointmentInfo}>
          <View style={styles.typePlaceholder} />
          <View style={styles.namePlaceholder} />
          <View style={styles.doctorPlaceholder} />
          <View style={styles.statusPlaceholder} />
        </View>

        <View style={styles.buttonPlaceholder} />
      </View>
    </Animated.View>
  );
};

interface DaySectionSkeletonProps {
  isDarkMode: boolean;
  appointmentCount?: number;
}

// Skeleton for a day section with multiple appointments
const DaySectionSkeleton = ({
  isDarkMode,
  appointmentCount = 2,
}: DaySectionSkeletonProps) => {
  const styles = getSkeletonStyles(isDarkMode);
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim]);

  return (
    <View style={styles.daySection}>
      <Animated.View style={[styles.daySectionHeader, {opacity: fadeAnim}]} />
      {[...Array(appointmentCount)].map((_, index) => (
        <AppointmentSkeleton key={index} isDarkMode={isDarkMode} />
      ))}
    </View>
  );
};

const AllAppointmentsPage: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const isDarkMode = theme.name === 'dark';
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
    insets,
    isDarkMode,
  );

  const [isAppointmentModalVisible, setIsAppointmentModalVisible] =
    useState(false);
  const [data, setData] = useState<DayData[]>([]);
  const [hasMorePast, setHasMorePast] = useState(true);
  const [hasMoreFuture, setHasMoreFuture] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [todayIndex, setTodayIndex] = useState<number>(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const fetchAppointmentsForDate = async (
    date: Date,
  ): Promise<Appointment[]> => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await axiosInstance.post('/get/appointments', {
        date: formattedDate,
      });
      return response.data || [];
    } catch (error) {
      return [];
    }
  };
  const fetchAppointmentsForDateRange = async (
    startDate: Date,
    endDate: Date,
  ): Promise<DayData[]> => {
    try {
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];

      const response = await axiosInstance.post('/get/appointments/dates', {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });
      // Convert the appointments object into an array of DayData
      const dayDataArray: DayData[] = [];
      const appointments = response.data.appointments;
      // Create a date iterator to ensure we have entries for all dates
      let currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        const dateString = currentDate.toISOString().split('T')[0];
        dayDataArray.push({
          date: new Date(currentDate),
          appointments: appointments[dateString] || [],
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dayDataArray;
    } catch (error) {
      handleError(error);
      return [];
    }
  };

  const scrollToToday = () => {
    const index = data.findIndex(
      dayData => dayData.date.toDateString() === new Date().toDateString(),
    );
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0,
      });
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startDate = new Date(today);
      const endDate = new Date(today);

      // Load more future days than past days initially
      startDate.setDate(today.getDate() - 2); // Only 2 days in the past
      endDate.setDate(today.getDate() + DAYS_TO_LOAD - 2); // Rest of the days in the future

      const appointments = await fetchAppointmentsForDateRange(
        startDate,
        endDate,
      );
      setData(appointments);

      // Find today's index
      const todayIdx = appointments.findIndex(
        day => day.date.toDateString() === today.toDateString(),
      );
      setTodayIndex(todayIdx);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && todayIndex >= 0) {
      // Scroll to today's section after initial load
      setTimeout(() => scrollToToday(), 100);
    }
  }, [loading, todayIndex]);

  const renderLoadPreviousButton = () => {
    if (!hasMorePast) return null;
    return (
      <TouchableOpacity
        style={styles.loadPreviousButton}
        onPress={() => loadMoreDays('past')}
        disabled={loadingMore}>
        <View style={styles.loadPreviousContent}>
          {loadingMore ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="chevron-up" size={20} color="#b7c7c9" />
              <Text style={styles.loadPreviousText}>Load Previous Days</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const loadMoreDays = async (direction: 'past' | 'future') => {
    if (
      loadingMore ||
      (direction === 'past' && !hasMorePast) ||
      (direction === 'future' && !hasMoreFuture)
    ) {
      return;
    }

    setLoadingMore(true);
    try {
      const baseDate =
        direction === 'past'
          ? new Date(data[0].date)
          : new Date(data[data.length - 1].date);

      const startDate = new Date(baseDate);
      const endDate = new Date(baseDate);

      if (direction === 'past') {
        startDate.setDate(baseDate.getDate() - DAYS_TO_LOAD);
        endDate.setDate(baseDate.getDate() - 1);
      } else {
        startDate.setDate(baseDate.getDate() + 1);
        endDate.setDate(baseDate.getDate() + DAYS_TO_LOAD);
      }

      const newAppointments = await fetchAppointmentsForDateRange(
        startDate,
        endDate,
      );

      if (newAppointments.length === 0) {
        if (direction === 'past') {
          setHasMorePast(false);
        } else {
          setHasMoreFuture(false);
        }
      } else {
        setData(currentData => {
          return direction === 'past'
            ? [...newAppointments, ...currentData]
            : [...currentData, ...newAppointments];
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingMore(false);
    }
  };
  const closeAppointmentModal = () => {
    setIsAppointmentModalVisible(false);
    setSelectedAppointment(null);
  };

  useEffect(() => {
    loadInitialData();
    const loadInitialData1 = async () => {
      try {
        const today = new Date();
        const startDate = new Date(today);
        const endDate = new Date(today);

        startDate.setDate(today.getDate() - 2); // Past 2 days
        endDate.setDate(today.getDate() + DAYS_TO_LOAD - 2); // Next days

        const appointments = await fetchAppointmentsForDateRange(
          startDate,
          endDate,
        );
        setData(appointments);

        const todayIdx = appointments.findIndex(
          day => day.date.toDateString() === today.toDateString(),
        );
        setTodayIndex(todayIdx);
      } catch (error) {
        handleError(error);
      }
    };
    const unsubscribe = navigation.addListener('focus', () => {
      loadInitialData1();
    });

    return unsubscribe;
  }, [navigation]);

  const getStatusColor = (status?: string) => {
    const colors = isDarkMode
      ? {
          completed: '#66BB6A',
          in_progress: '#FFB74D',
          default: '#029db5',
        }
      : {
          completed: '#4CAF50',
          in_progress: '#FFA726',
          default: '#007B8E',
        };

    switch (status?.toLowerCase()) {
      case 'completed':
        return colors.completed;
      case 'in_progress':
        return colors.in_progress;
      default:
        return colors.default;
    }
  };
  const getFormattedStatus = (status?: string) => {
    if (!status) return 'Scheduled';

    switch (status.toLowerCase()) {
      case 'in_progress':
        return 'In Progress';
      default:
        // Capitalize first letter of each word
        return status
          .split('_')
          .map(
            word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(' ');
    }
  };
  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };
  const renderStartButton = (appointment: Appointment) => (
    <TouchableOpacity
      onPress={e => {
        e.stopPropagation(); // Prevent event bubbling to parent

        // Check if this is a consultation appointment
        if (appointment.is_consultation) {
          // Navigate to the consultation screen with all relevant parameters
          navigation.navigate('CreateConsultation', {
            patientId: appointment.patient_id,
            appointmentId: appointment._id,
          });
        } else {
          // Open the appointment modal for regular appointments
          setSelectedAppointment(appointment);
          setIsAppointmentModalVisible(true);
        }
      }}
      activeOpacity={0.7}
      style={styles.startButtonContainer}>
      <Icon name="play" size={12} color="black" />
      <Text style={styles.startButtonText}>Start</Text>
    </TouchableOpacity>
  );
  const renderAppointment = ({item}: {item: Appointment}) => (
    <Animated.View style={[styles.appointmentItem]}>
      <View style={styles.appointmentContent}>
        {/* If it's a consultation, don't wrap in TouchableOpacity */}
        {item.is_consultation ? (
          <View style={styles.mainContentTouchable}>
            <View style={styles.timeContainer}>
              <Text style={styles.appointmentTime}>
                {item.therepy_start_time}
              </Text>
              <Icon
                name={
                  item.therepy_type.toLowerCase().includes('video')
                    ? 'videocam'
                    : 'person'
                }
                size={24}
                color="#119FB3"
                style={styles.appointmentIcon}
              />
            </View>

            <View style={styles.appointmentInfo}>
              <View style={styles.typeAndButtonContainer}>
                <Text style={styles.appointmentType}>{item.therepy_type}</Text>
                {/* Add consultation badge here */}
                {item.is_consultation && (
                  <View style={styles.consultationBadge}>
                    <Text style={styles.consultationBadgeText}>
                      Consultation
                    </Text>
                  </View>
                )}
              </View>

              {item.patient_name && (
                <Text style={styles.patientName} numberOfLines={1}>
                  {item.patient_name}
                </Text>
              )}
              {item.doctor_name && (
                <Text style={styles.doctorName} numberOfLines={1}>
                  Dr. {item.doctor_name}
                </Text>
              )}
              {/* Add therapy reason here */}
              {item.therapy_reason && (
                <Text
                  style={styles.therapyReason}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  Reason: {item.therapy_reason}
                </Text>
              )}
              <View style={styles.appointmentActions}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(item.status),
                    },
                  ]}>
                  <Text style={styles.statusText}>
                    {getFormattedStatus(item.status)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.mainContentTouchable}
            onPress={() => {
              navigation.navigate('planDetails', {
                planId: item.plan_id,
              });
            }}>
            <View style={styles.timeContainer}>
              <Text style={styles.appointmentTime}>
                {item.therepy_start_time}
              </Text>
              <Icon
                name={
                  item.therepy_type.toLowerCase().includes('video')
                    ? 'videocam'
                    : 'person'
                }
                size={24}
                color="#119FB3"
                style={styles.appointmentIcon}
              />
            </View>

            <View style={styles.appointmentInfo}>
              <View style={styles.typeAndButtonContainer}>
                <Text style={styles.appointmentType}>{item.therepy_type}</Text>
                {/* Add consultation badge here too */}
                {item.is_consultation && (
                  <View style={styles.consultationBadge}>
                    <Text style={styles.consultationBadgeText}>
                      Consultation
                    </Text>
                  </View>
                )}
              </View>

              {item.patient_name && (
                <Text style={styles.patientName} numberOfLines={1}>
                  {item.patient_name}
                </Text>
              )}
              {item.doctor_name && (
                <Text style={styles.doctorName} numberOfLines={1}>
                  Dr. {item.doctor_name}
                </Text>
              )}
              {/* Add therapy reason here */}
              {item.therapy_reason && (
                <Text style={styles.therapyReason} numberOfLines={2}>
                  Reason: {item.therapy_reason}
                </Text>
              )}
              <View style={styles.appointmentActions}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(item.status),
                    },
                  ]}>
                  <Text style={styles.statusText}>
                    {getFormattedStatus(item.status)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        {(!item.status || item.status.toLowerCase() !== 'completed') && (
          <View style={styles.startButtonContainer}>
            {renderStartButton(item)}
            <WhatsAppReminderButton
              sessionId={item._id}
              patientName={item.patient_name || 'Patient'}
              isDarkMode={isDarkMode}
              size="medium"
              onSuccess={() => {
                // Optional: Refresh appointments or show success message
                console.log('Reminder sent successfully');
              }}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
  const renderNoAppointments = () => (
    <View style={styles.noAppointmentsContainer}>
      <Icon name="calendar-outline" size={48} color="#007B8E" />
      <Text style={styles.noAppointmentsText}>No appointments scheduled</Text>
      <Text style={styles.noAppointmentsSubText}>
        Your appointments for this day will appear here
      </Text>
    </View>
  );

  const renderDaySection = ({item}: {item: DayData}) => {
    const isToday = item.date.toDateString() === new Date().toDateString();

    return (
      <View style={styles.daySection}>
        <Text
          style={[
            styles.daySectionHeader,
            // No conditional styling for Today that could cause spacing issues
          ]}>
          {formatDate(item.date)}
        </Text>
        {item.appointments.length > 0
          ? item.appointments.map(appointment => (
              <View key={appointment._id}>
                {renderAppointment({item: appointment})}
              </View>
            ))
          : renderNoAppointments()}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#119FB3" />
      </View>
    );
  };

  // Render skeleton loaders while initial data is loading
  const renderSkeletonLoader = () => {
    return (
      <View style={styles.safeArea}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#121212' : 'white'}
        />
        <BackTabTop screenName="Appointments" />
        <View style={styles.view}>
          <FlatList
            data={[1, 2, 3, 4]}
            renderItem={() => <DaySectionSkeleton isDarkMode={isDarkMode} />}
            keyExtractor={item => item.toString()}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              <View style={styles.loadPreviousButton}>
                <View style={styles.loadPreviousContent}>
                  <Icon name="chevron-up" size={20} color="#b7c7c9" />
                  <Text style={styles.loadPreviousText}>
                    Load Previous Days
                  </Text>
                </View>
              </View>
            }
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return renderSkeletonLoader();
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#121212' : 'white'}
      />
      <BackTabTop screenName="Appointments" />
      <View style={styles.view}>
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderDaySection}
          keyExtractor={item => item.date.toISOString()}
          onEndReached={() => loadMoreDays('future')}
          onEndReachedThreshold={0.5}
          onRefresh={loadInitialData}
          refreshing={loading}
          ListHeaderComponent={renderLoadPreviousButton}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={!loading ? renderNoAppointments : null}
          onScrollToIndexFailed={info => {
            const wait = new Promise(resolve => setTimeout(resolve, 100));
            wait.then(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0,
                });
              }
            });
          }}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: scrollY}}}],
            {useNativeDriver: false},
          )}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.listContainer,
            data.length === 0 && {flex: 1, justifyContent: 'center'},
          ]}
        />
      </View>
      {isAppointmentModalVisible && selectedAppointment && (
        <View style={styles.fullScreenModal}>
          <AppointmentDetailsScreen
            appointment={selectedAppointment}
            onClose={closeAppointmentModal}
          />
        </View>
      )}
    </View>
  );
};

// Styles for skeleton loading components
const getSkeletonStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    appointmentItem: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: isDarkMode ? '#233436' : '#FFFFFF',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDarkMode ? 0.4 : 0.1,
      shadowRadius: 4,
      borderColor: isDarkMode ? '#119FB3' : 'white',
      borderWidth: 1,
      height: 110,
    },
    appointmentContent: {
      flex: 1,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timeContainer: {
      alignItems: 'center',
      marginRight: 16,
      paddingRight: 16,
      borderRightWidth: 1,
      borderRightColor: isDarkMode ? '#669191' : '#E0E0E0',
      height: 70,
      justifyContent: 'space-between',
    },
    timeText: {
      width: 40,
      height: 16,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 4,
    },
    iconPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E8F6F8',
    },
    appointmentInfo: {
      flex: 1,
      height: 70,
      justifyContent: 'space-between',
    },
    typePlaceholder: {
      width: '80%',
      height: 16,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 4,
      marginBottom: 8,
    },
    namePlaceholder: {
      width: '60%',
      height: 12,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 4,
      marginBottom: 4,
    },
    doctorPlaceholder: {
      width: '40%',
      height: 12,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 4,
      marginBottom: 8,
    },
    statusPlaceholder: {
      width: 80,
      height: 20,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 12,
    },
    buttonPlaceholder: {
      width: 70,
      height: 35,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 8,
    },
    daySection: {
      marginBottom: 20,
    },
    daySectionHeader: {
      height: 24,
      width: 100,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 4,
      marginBottom: 12,
      marginHorizontal: 16,
    },
  });

const getStyles = (
  theme: ReturnType<typeof getTheme>,
  insets: any,
  isDarkMode: boolean,
) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    appointmentContent: {
      flex: 1,
      padding: 16,
      position: 'relative',
      flexDirection: 'row', // Add row direction to align content and button
      justifyContent: 'space-between', // Space between content and button
      alignItems: 'center', // Center items vertically
    },

    mainContentTouchable: {
      flex: 1,
      flexDirection: 'row',
      marginRight: 12, // Add margin to create space for the button
    },

    startButtonContainer: {
      backgroundColor: '#aeebbd',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      alignSelf: 'center',
    },

    appointmentItem: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: isDarkMode ? '#233436' : '#FFFFFF',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDarkMode ? 0.4 : 0.1,
      shadowRadius: 4,
      borderColor: isDarkMode ? '#119FB3' : 'white',
      borderWidth: 1,
      overflow: 'hidden', // Ensure no content spills outside
    },
    startButtonText: {
      color: 'black',
      fontSize: 16,
      fontWeight: '600',
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
    typeAndButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start', // Changed from space-between
      alignItems: 'center',
      marginBottom: 4,
      width: '100%', // Changed from 85%
      flexWrap: 'wrap', // Allow wrapping if needed
    },

    appointmentActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    startButton: {
      backgroundColor: '#27ae60',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 12,
      marginLeft: 8,
    },
    loadPreviousButton: {
      backgroundColor: '#306b73',
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    loadPreviousContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#306b73',
    },
    loadPreviousText: {
      color: '#b7c7c9',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    view: {
      flex: 1,
      backgroundColor: '#007B8E',
    },
    header: {
      backgroundColor: isDarkMode ? '#1E1E1E' : '#119FB3',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      elevation: 4,
      shadowColor: isDarkMode ? '#000' : '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDarkMode ? 0.4 : 0.2,
      shadowRadius: 4,
      zIndex: 1000,
    },
    headerTitleExpanded: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    headerTitleCollapsed: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 24,
    },
    listContainer: {
      flexGrow: 1,
      paddingTop: 16,
    },
    daySection: {
      marginBottom: 10,
    },
    daySectionHeader: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? 'white' : 'black',
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : '#F5F6FA',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: isDarkMode ? '#4DD0E1' : '#119FB3',
    },
    loadingMore: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    timeContainer: {
      alignItems: 'center',
      marginRight: 16,
      paddingRight: 16,
      borderRightWidth: 1,
      borderRightColor: isDarkMode ? '#669191' : '#E0E0E0',
    },
    appointmentTime: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#2C3E50',
      marginBottom: 8,
    },
    appointmentIcon: {
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E8F6F8',
      padding: 8,
      borderRadius: 12,
    },
    appointmentInfo: {
      flex: 1,
    },
    appointmentType: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#2C3E50',
      marginBottom: 4,
    },
    patientName: {
      fontSize: 14,
      color: isDarkMode ? '#B0B0B0' : '#7F8C8D',
      marginBottom: 2,
    },
    doctorName: {
      fontSize: 14,
      color: isDarkMode ? '#4DD0E1' : '#119FB3',
      marginBottom: 8,
    },
    noAppointmentsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#233436' : '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDarkMode ? 0.4 : 0.1,
      shadowRadius: 4,
      borderColor: isDarkMode ? '#119FB3' : 'white',
      borderWidth: 1,
      minHeight: 150,

      marginHorizontal: 16,
      overflow: 'hidden', // Ensure no content spills outside
    },
    noAppointmentsText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#2C3E50',
      marginTop: 12,
      marginBottom: 4,
    },
    noAppointmentsSubText: {
      fontSize: 14,
      color: isDarkMode ? '#B0B0B0' : '#7F8C8D',
      textAlign: 'center',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    consultationBadge: {
      backgroundColor: '#FFD700', // Gold color for consultation
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    consultationBadgeText: {
      color: '#000',
      fontSize: 10,
      fontWeight: 'bold',
    },
    therapyReason: {
      fontSize: 13,
      color: isDarkMode ? '#A0A0A0' : '#555555',
      marginBottom: 6,
      fontStyle: 'italic',
    },
  });

export default AllAppointmentsPage;
