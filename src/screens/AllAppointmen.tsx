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
}

interface DayData {
  date: Date;
  appointments: Appointment[];
}

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 80;
const DAYS_TO_LOAD = 7; // Number of days to load at once

const AllAppointmentsPage: React.FC = () => {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
    insets,
  );

  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

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
      console.log(response.data);
      return response.data || [];
    } catch (error) {
      return [];
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const initialDays: DayData[] = [];

      // Load past 3 days and future 3 days
      for (let i = -3; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const appointments = await fetchAppointmentsForDate(date);
        initialDays.push({date, appointments});
      }

      setData(initialDays);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadMoreDays = async (direction: 'past' | 'future') => {
    if (loadingMore) return;

    setLoadingMore(true);
    try {
      const newDays: DayData[] = [];
      const baseDate =
        direction === 'past'
          ? new Date(data[0].date)
          : new Date(data[data.length - 1].date);

      for (let i = 1; i <= DAYS_TO_LOAD; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + (direction === 'past' ? -i : i));
        const appointments = await fetchAppointmentsForDate(date);
        newDays.push({date, appointments});
      }

      setData(currentData => {
        return direction === 'past'
          ? [...newDays.reverse(), ...currentData]
          : [...currentData, ...newDays];
      });
    } finally {
      setLoadingMore(false);
    }
  };
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#4CAF50'; // Green
      case 'in_progress':
        return '#FFA726'; // Yellow/Orange
      default:
        return '#119FB3'; // Default blue
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

  const renderAppointment = ({item}: {item: Appointment}) => (
    <Animated.View style={[styles.appointmentItem]}>
      <TouchableOpacity
        style={styles.appointmentContent}
        onPress={() => setSelectedAppointment(item)}>
        <View style={styles.timeContainer}>
          <Text style={styles.appointmentTime}>{item.therepy_start_time}</Text>
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
          <Text style={styles.appointmentType}>{item.therepy_type}</Text>
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
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusColor(item.status),
              },
            ]}>
            <Text style={styles.statusText}>{item.status || 'Scheduled'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderNoAppointments = () => (
    <View style={styles.noAppointmentsContainer}>
      <Icon name="calendar-outline" size={48} color="#119FB3" />
      <Text style={styles.noAppointmentsText}>No appointments scheduled</Text>
      <Text style={styles.noAppointmentsSubText}>
        Your appointments for this day will appear here
      </Text>
    </View>
  );

  const renderDaySection = ({item}: {item: DayData}) => (
    <View style={styles.daySection}>
      <Text style={styles.daySectionHeader}>{formatDate(item.date)}</Text>
      {item.appointments.length > 0
        ? item.appointments.map(appointment => (
            <View key={appointment._id}>
              {renderAppointment({item: appointment})}
            </View>
          ))
        : renderNoAppointments()}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#119FB3" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <BackTabTop screenName="Appointments" />

      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderDaySection}
        keyExtractor={item => item.date.toISOString()}
        onEndReached={() => loadMoreDays('future')}
        onEndReachedThreshold={0.5}
        onRefresh={loadInitialData}
        refreshing={loading}
        ListFooterComponent={renderFooter}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: false},
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContainer}
      />

      {selectedAppointment && (
        <AppointmentDetailsScreen
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>, insets: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F5F6FA',
    },
    header: {
      backgroundColor: '#119FB3',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
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
      paddingTop: 16,
    },
    daySection: {
      marginBottom: 24,
    },
    daySectionHeader: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#2C3E50',
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
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#119FB3',
    },
    loadingMore: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    appointmentItem: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    appointmentContent: {
      flexDirection: 'row',
      padding: 16,
    },
    timeContainer: {
      alignItems: 'center',
      marginRight: 16,
      paddingRight: 16,
      borderRightWidth: 1,
      borderRightColor: '#E0E0E0',
    },
    appointmentTime: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#2C3E50',
      marginBottom: 8,
    },
    appointmentIcon: {
      backgroundColor: '#E8F6F8',
      padding: 8,
      borderRadius: 12,
    },
    appointmentInfo: {
      flex: 1,
    },
    appointmentType: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2C3E50',
      marginBottom: 4,
    },
    patientName: {
      fontSize: 14,
      color: '#7F8C8D',
      marginBottom: 2,
    },
    doctorName: {
      fontSize: 14,
      color: '#119FB3',
      marginBottom: 8,
    },
    noAppointmentsContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      marginHorizontal: 16,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    noAppointmentsText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#2C3E50',
      marginTop: 12,
      marginBottom: 4,
    },
    noAppointmentsSubText: {
      fontSize: 14,
      color: '#7F8C8D',
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
  });

export default AllAppointmentsPage;
