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

// Responsive utils
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

  // Animation refs
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

  const renderDoctorItem = (item: DoctorTherapyTypes, index: number) => {
    const therapyData = [
      { 
        type: 'In Clinic', 
        count: item.therapyTypes['In Clinic'].count, 
        color: '#007b8e',
      },
      { 
        type: 'In Home', 
        count: item.therapyTypes['In Home'].count, 
        color: '#0b5e69',
      },
      { 
        type: 'IP/ICU', 
        count: item.therapyTypes['IP/ICU'].count, 
        color: '#2c3e50',
      },
      { 
        type: 'Online', 
        count: item.therapyTypes['Online'].count, 
        color: '#27ae60',
      },
    ];

    // Calculate total sessions for this doctor
    const totalSessions = therapyData.reduce((sum, therapy) => sum + therapy.count, 0);

    return (
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
        
        {/* Doctor Header */}
        <View style={styles.doctorHeader}>
          <View style={styles.doctorInfo}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorAvatarText}>
                {item.doctor_name?.charAt(0) || 'D'}
              </Text>
            </View>
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>{item.doctor_name}</Text>
              <Text style={styles.totalSessions}>Total Sessions: {totalSessions}</Text>
            </View>
          </View>
        </View>

        {/* Therapy Types */}
        <View style={styles.therapySection}>
          <Text style={styles.therapySectionTitle}>Therapy Distribution</Text>
          {therapyData.map((therapy) => (
            <View key={therapy.type} style={styles.therapyRow}>
              <View style={styles.therapyInfo}>
                <Text style={styles.therapyType}>{therapy.type}</Text>
              </View>
              <View style={[styles.therapyCountBadge, { backgroundColor: therapy.color }]}>
                <Text style={styles.therapyCount}>{therapy.count}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

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
          <Text style={styles.doctorsListTitle}>Doctor Performance Breakdown</Text>
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
      borderRadius: getResponsiveSize(12),
      padding: getResponsiveSize(16),
      width: '100%',
      marginBottom: getResponsiveSize(16),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: getResponsiveSize(3) },
      shadowOpacity: 0.08,
      shadowRadius: getResponsiveSize(5),
      elevation: 4,
    },
    chartTitle: {
      fontSize: normalize(18),
      fontWeight: '700',
      color: theme.colors.mainColor,
      textAlign: 'center',
      marginBottom: getResponsiveSize(4),
    },
    chartSubtitle: {
      fontSize: normalize(13),
      color: '#7f8c8d',
      textAlign: 'center',
      marginBottom: getResponsiveSize(16),
    },
    loading: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: getResponsiveSize(40),
    },
    loadingText: {
      marginTop: getResponsiveSize(8),
      color: '#007b8e',
      fontSize: normalize(14),
    },
    noDataContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: getResponsiveSize(40),
    },
    noDataText: {
      fontSize: normalize(14),
      color: '#7f8c8d',
      textAlign: 'center',
    },
    // Summary styles
    summaryContainer: {
      marginBottom: getResponsiveSize(20),
    },
    summaryTitle: {
      fontSize: normalize(16),
      fontWeight: '600',
      color: theme.colors.mainColor,
      textAlign: 'center',
      marginBottom: getResponsiveSize(12),
    },
    summaryCards: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: getResponsiveSize(8),
    },
    summaryCard: {
      width: (SCREEN_WIDTH - getResponsiveSize(72)) / 2,
      borderRadius: getResponsiveSize(10),
      padding: getResponsiveSize(12),
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: getResponsiveSize(2) },
      shadowOpacity: 0.08,
      shadowRadius: getResponsiveSize(3),
    },
    summaryCardLabel: {
      fontSize: normalize(12),
      color: 'white',
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: getResponsiveSize(4),
    },
    summaryCardValue: {
      fontSize: normalize(18),
      color: 'white',
      fontWeight: 'bold',
    },
    // Doctor card styles
    doctorsList: {
      marginTop: getResponsiveSize(8),
    },
    doctorsListTitle: {
      fontSize: normalize(16),
      fontWeight: '600',
      color: theme.colors.mainColor,
      marginBottom: getResponsiveSize(12),
      textAlign: 'center',
    },
    doctorCard: {
      backgroundColor: theme.colors.inputBox,
      borderRadius: getResponsiveSize(12),
      padding: getResponsiveSize(12),
      marginBottom: getResponsiveSize(12),
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: getResponsiveSize(2) },
      shadowOpacity: 0.06,
      shadowRadius: getResponsiveSize(6),
      borderLeftWidth: getResponsiveSize(3),
      borderLeftColor: '#007b8e',
    },
    doctorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getResponsiveSize(14),
      paddingBottom: getResponsiveSize(12),
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    doctorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    doctorAvatar: {
      width: getResponsiveSize(40),
      height: getResponsiveSize(40),
      borderRadius: getResponsiveSize(20),
      backgroundColor: '#007b8e',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: getResponsiveSize(12),
      elevation: 2,
    },
    doctorAvatarText: {
      fontSize: normalize(16),
      fontWeight: 'bold',
      color: 'white',
    },
    doctorDetails: {
      flex: 1,
    },
    doctorName: {
      fontSize: normalize(15),
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: getResponsiveSize(3),
    },
    totalSessions: {
      fontSize: normalize(12),
      color: '#7f8c8d',
      fontWeight: '500',
    },
    therapySection: {
      marginBottom: getResponsiveSize(8),
    },
    therapySectionTitle: {
      fontSize: normalize(13),
      fontWeight: '700',
      color: theme.colors.mainColor,
      marginBottom: getResponsiveSize(10),
    },
    therapyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: getResponsiveSize(8),
      paddingVertical: getResponsiveSize(2),
    },
    therapyInfo: {
      flex: 1,
    },
    therapyType: {
      fontSize: normalize(12),
      fontWeight: '600',
      color: theme.colors.text,
    },
    therapyCountBadge: {
      borderRadius: getResponsiveSize(10),
      paddingHorizontal: getResponsiveSize(8),
      paddingVertical: getResponsiveSize(3),
      elevation: 1,
    },
    therapyCount: {
      fontSize: normalize(12),
      fontWeight: 'bold',
      color: 'white',
    },
  });

  export default TherapyTypeByDoctor;