import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  PixelRatio,
  Platform,
  Dimensions,
} from 'react-native';
import axiosinstance from '../utils/axiosConfig';
import { useTheme } from '../screens/ThemeContext';
import { getTheme } from '../screens/Theme';

// Responsive utils (matching DoctorLeaderboard)
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375; // Base width is 375

// Normalize function for font sizes
const normalize = (size: number) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Function for responsive spacing
const getResponsiveSize = (size: number) => {
  return size * scale;
};

interface TherapyType {
  count: number;
  completed: number;
  cancelled: number;
  pending: number;
  scheduled: number;
}

interface DoctorTherapyTypes {
  doctor_name: string;
  therapyTypes: {
    'In Clinic': TherapyType;
    'In Home': TherapyType;
    'IP/ICU': TherapyType;
    'Online': TherapyType;
  };
}

interface TherapyTypeSummary {
  inClinic: number;
  inHome: number;
  ipIcu: number;
  online: number;
}

interface Props {
  month: number;
  year: number;
}

const TherapyTypeByDoctor: React.FC<Props> = ({ month, year }) => {
  const [data, setData] = useState<DoctorTherapyTypes[]>([]);
  const [summary, setSummary] = useState<TherapyTypeSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();
  const styles = getStyles(getTheme(theme.name as any));

  // Animation refs (matching DoctorLeaderboard)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Function to check if a doctor has any therapy sessions
  const hasTherapySessions = (doctor: DoctorTherapyTypes): boolean => {
    const therapyTypes = doctor.therapyTypes;
    return (
      therapyTypes['In Clinic'].count > 0 ||
      therapyTypes['In Home'].count > 0 ||
      therapyTypes['IP/ICU'].count > 0 ||
      therapyTypes['Online'].count > 0
    );
  };

  useEffect(() => {
    const fetchTherapyTypes = async () => {
      setLoading(true);
      try {
        const response = await axiosinstance.get(`/get/typemonthly?month=${month}&year=${year}`);

        if (response.data) {
          if (response.data.doctors) {
            // Filter out doctors with 0 count in all therapy types
            const filteredDoctors = response.data.doctors.filter(hasTherapySessions);
            setData(filteredDoctors);
          }
          
          if (response.data.aggregateStats?.therapyTypeTotals) {
            setSummary(response.data.aggregateStats.therapyTypeTotals);
          }

          // Start animations after data is loaded
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } catch (error) {
        console.error('Error fetching therapy types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapyTypes();
  }, [month, year]);

  const renderSummaryCards = () => {
    if (!summary) return null;

    const summaryData = [
      { label: 'In Clinic', value: summary.inClinic, color: '#007b8e' },
      { label: 'In Home', value: summary.inHome, color: '#0b5e69' },
      { label: 'IP/ICU', value: summary.ipIcu, color: '#2c3e50' },
      { label: 'Online', value: summary.online, color: '#27ae60' },
    ];

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Overall Summary</Text>
        <View style={styles.summaryCards}>
          {summaryData.map((item, index) => (
            <Animated.View
              key={item.label}
              style={[
                styles.summaryCard,
                { backgroundColor: item.color },
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 50 + (index * 10)],
                    }),
                  }],
                },
              ]}>
              <Text style={styles.summaryCardLabel}>{item.label}</Text>
              <Text style={styles.summaryCardValue}>{item.value}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  };

  const renderDoctorItem = (item: DoctorTherapyTypes, index: number) => (
    <Animated.View
      key={`${item.doctor_name}-${index}`}
      style={[
        styles.doctorCard,
        {
          opacity: fadeAnim,
          transform: [{
            translateX: slideAnim.interpolate({
              inputRange: [0, 50],
              outputRange: [0, 50],
            }),
          }],
        },
      ]}>
      <View style={styles.doctorHeader}>
        <View style={styles.doctorAvatar}>
          <Text style={styles.doctorAvatarText}>
            {item.doctor_name?.charAt(0) || 'D'}
          </Text>
        </View>
        <Text style={styles.doctorName}>{item.doctor_name}</Text>
      </View>

      <View style={styles.therapyGrid}>
        <View style={[styles.therapyItem, { backgroundColor: '#007b8e' }]}>
          <Text style={styles.therapyLabel}>In Clinic</Text>
          <Text style={styles.therapyValue}>{item.therapyTypes['In Clinic'].count}</Text>
        </View>
        <View style={[styles.therapyItem, { backgroundColor: '#0b5e69' }]}>
          <Text style={styles.therapyLabel}>In Home</Text>
          <Text style={styles.therapyValue}>{item.therapyTypes['In Home'].count}</Text>
        </View>
        <View style={[styles.therapyItem, { backgroundColor: '#2c3e50' }]}>
          <Text style={styles.therapyLabel}>IP/ICU</Text>
          <Text style={styles.therapyValue}>{item.therapyTypes['IP/ICU'].count}</Text>
        </View>
        <View style={[styles.therapyItem, { backgroundColor: '#27ae60' }]}>
          <Text style={styles.therapyLabel}>Online</Text>
          <Text style={styles.therapyValue}>{item.therapyTypes['Online'].count}</Text>
        </View>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007b8e" />
          <Text style={styles.loadingText}>Loading therapy data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>Therapy Types by Doctor</Text>
      <Text style={styles.chartSubtitle}>
        {months[month - 1]} {year}
      </Text>

      {renderSummaryCards()}

      {data.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No doctors with therapy sessions found for this period</Text>
        </View>
      ) : (
        <View style={styles.doctorsList}>
          {data.map((item, index) => renderDoctorItem(item, index))}
        </View>
      )}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: getResponsiveSize(15),
      padding: getResponsiveSize(20),
      width: '100%',
      marginBottom: getResponsiveSize(20),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: getResponsiveSize(4) },
      shadowOpacity: 0.1,
      shadowRadius: getResponsiveSize(6),
      elevation: 5,
    },
    chartTitle: {
      fontSize: normalize(20),
      fontWeight: '700',
      color: '#007b8e',
      textAlign: 'center',
      marginBottom: getResponsiveSize(5),
    },
    chartSubtitle: {
      fontSize: normalize(14),
      color: '#7f8c8d',
      textAlign: 'center',
      marginBottom: getResponsiveSize(20),
    },
    loading: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: getResponsiveSize(50),
    },
    loadingText: {
      marginTop: getResponsiveSize(10),
      color: '#007b8e',
      fontSize: normalize(16),
    },
    noDataContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: getResponsiveSize(50),
    },
    noDataText: {
      fontSize: normalize(16),
      color: '#7f8c8d',
      textAlign: 'center',
    },
    summaryContainer: {
      marginBottom: getResponsiveSize(25),
    },
    summaryTitle: {
      fontSize: normalize(18),
      fontWeight: '600',
      color: '#007b8e',
      textAlign: 'center',
      marginBottom: getResponsiveSize(15),
    },
    summaryCards: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: getResponsiveSize(10),
    },
    summaryCard: {
      width: (SCREEN_WIDTH - getResponsiveSize(80)) / 2,
      borderRadius: getResponsiveSize(12),
      padding: getResponsiveSize(15),
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: getResponsiveSize(2) },
      shadowOpacity: 0.1,
      shadowRadius: getResponsiveSize(4),
    },
    summaryCardLabel: {
      fontSize: normalize(12),
      color: 'white',
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: getResponsiveSize(5),
    },
    summaryCardValue: {
      fontSize: normalize(20),
      color: 'white',
      fontWeight: 'bold',
    },
    doctorsList: {
      // Container for doctor items - replaces FlatList
    },
    doctorCard: {
      backgroundColor: '#f8f9fa',
      borderRadius: getResponsiveSize(15),
      padding: getResponsiveSize(16),
      marginBottom: getResponsiveSize(15),
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: getResponsiveSize(2) },
      shadowOpacity: 0.05,
      shadowRadius: getResponsiveSize(4),
    },
    doctorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: getResponsiveSize(15),
    },
    doctorAvatar: {
      width: getResponsiveSize(40),
      height: getResponsiveSize(40),
      borderRadius: getResponsiveSize(20),
      backgroundColor: '#007b8e',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: getResponsiveSize(12),
    },
    doctorAvatarText: {
      fontSize: normalize(16),
      fontWeight: 'bold',
      color: 'white',
    },
    doctorName: {
      fontSize: normalize(16),
      fontWeight: '600',
      color: '#2c3e50',
      flex: 1,
    },
    therapyGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: getResponsiveSize(8),
    },
    therapyItem: {
      width: (SCREEN_WIDTH - getResponsiveSize(120)) / 2,
      borderRadius: getResponsiveSize(10),
      padding: getResponsiveSize(12),
      alignItems: 'center',
      elevation: 2,
    },
    therapyLabel: {
      fontSize: normalize(11),
      color: 'white',
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: getResponsiveSize(4),
    },
    therapyValue: {
      fontSize: normalize(18),
      color: 'white',
      fontWeight: 'bold',
    },
  });

export default TherapyTypeByDoctor;