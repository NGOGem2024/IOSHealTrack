// LeaderReport.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import axiosinstance from '../utils/axiosConfig';
import { useTheme } from './ThemeContext';
import { getTheme } from './Theme';

// Get screen dimensions
const { width } = Dimensions.get('window');

interface Doctor {
  doctor_id: string;
  doctor_name: string;
  doctor_photo: string | null;
  therapy_count: number;
}

interface DoctorLeaderboardProps {
  month: number;
  year: number;
}

const DoctorLeaderboard: React.FC<DoctorLeaderboardProps> = ({ month, year }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();
  const styles = getStyles(getTheme(theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark'));
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Fetch data when month or year changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosinstance.get(
          `/monthly/leaderboard?month=${month}&year=${year}`,
        );

        if (response.data && response.data.success) {
          setDoctors(response.data.data);
          
          // Start animations
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
            })
          ]).start();
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year]);

  // Function to get the arranged order for top 3 doctors
  const getTopThreeArranged = () => {
    if (doctors.length < 3) return doctors;
    
    const topThree = [...doctors.slice(0, 3)];
    topThree.sort((a, b) => b.therapy_count - a.therapy_count);
    
    if (topThree.length === 3) {
      return [topThree[1], topThree[0], topThree[2]];
    }
    
    return topThree;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const renderTopThreeItem = (doctor: Doctor, index: number) => {
    const isFirstPlace = index === 1;
    const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
    
    return (
      <Animated.View 
        key={`top-${doctor.doctor_id}`}
        style={[
          styles.card,
          isFirstPlace && styles.firstPlace,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={[styles.avatar, isFirstPlace && styles.firstPlaceAvatar]}>
          {doctor.doctor_photo ? (
            <Image 
              source={{ uri: doctor.doctor_photo }} 
              style={styles.avatarImage} 
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>{doctor.doctor_name.charAt(0)}</Text>
          )}
        </View>
        <Text style={[styles.name, isFirstPlace && styles.firstPlaceName]}>
          {doctor.doctor_name.split(" ")[0]}
        </Text>
        <Text style={[styles.therapies, isFirstPlace && styles.firstPlaceTherapies]}>
          {doctor.therapy_count} therapies
        </Text>
      </Animated.View>
    );
  };

  const renderTableRow = ({ item, index }: { item: Doctor; index: number }) => {
    return (
      <Animated.View 
        key={`row-${item.doctor_id}`}
        style={[
          styles.tableRow,
          { 
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        <View style={styles.rankCell}>
          <Text style={styles.rankCellText}>{index + 1}</Text>
        </View>
        <View style={styles.doctorCell}>
          <View style={styles.doctorInfo}>
            <View style={styles.tableAvatar}>
              {item.doctor_photo ? (
                <Image 
                  source={{ uri: item.doctor_photo }} 
                  style={styles.avatarImage} 
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.tableAvatarText}>{item.doctor_name.charAt(0)}</Text>
              )}
            </View>
            <Text style={styles.doctorName}>{item.doctor_name}</Text>
          </View>
        </View>
        <View style={styles.therapyCell}>
          <Text style={styles.therapyCellText}>{item.therapy_count}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.leaderboardCard}>
      <Text style={styles.chartTitle}>Doctor Leaderboard</Text>
      <Text style={styles.chartSubtitle}>
        {months[month - 1]} {year}
      </Text>
      
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007b8e" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <>
          <View style={styles.topCards}>
            {getTopThreeArranged().map((doctor, index) => 
              renderTopThreeItem(doctor, index)
            )}
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <View style={styles.rankHeaderCell}>
                <Text style={styles.headerText}>Rank</Text>
              </View>
              <View style={styles.doctorHeaderCell}>
                <Text style={styles.headerText}>Doctor</Text>
              </View>
              <View style={styles.therapyHeaderCell}>
                <Text style={styles.headerText}>Therapies</Text>
              </View>
            </View>
            
            <FlatList
              data={doctors}
              keyExtractor={(item) => `doctor-${item.doctor_id}`}
              renderItem={renderTableRow}
              scrollEnabled={false}
            />
          </View>
        </>
      )}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    leaderboardCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 15,
      padding: 20,
      width: '100%',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
    chartTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#007b8e',
      textAlign: 'center',
      marginBottom: 5,
    },
    chartSubtitle: {
      fontSize: 14,
      color: '#7f8c8d',
      textAlign: 'center',
      marginBottom: 15,
    },
    loading: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 50,
    },
    loadingText: {
      marginTop: 10,
      color: '#007b8e',
      fontSize: 16,
    },
    topCards: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: 15,
      marginBottom: 30,
      width: '100%',
    },
    card: {
      backgroundColor: '#0b5e69',
      borderRadius: 15,
      padding: 15,
      alignItems: 'center',
      width: width * 0.22,
      position: 'relative',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    firstPlace: {
      backgroundColor: '#007b8e',
      width: width * 0.28,
      minHeight: 160,
      zIndex: 1,
      padding: 20,
    },
    rankBadge: {
      position: 'absolute',
      top: -12,
      backgroundColor: '#ffcc00',
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1,
    },
    rankText: {
      color: '#333',
      fontWeight: 'bold',
      fontSize: 14,
    },
    avatar: {
      backgroundColor: 'lightgray',
      width: width * 0.12,
      height: width * 0.12,
      borderRadius: width * 0.06,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      borderWidth: 2,
      borderColor: 'white',
      overflow: 'hidden',
    },
    firstPlaceAvatar: {
      width: width * 0.15,
      height: width * 0.15,
      borderRadius: width * 0.075,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#0b5e69',
    },
    name: {
      fontWeight: 'bold',
      fontSize: 12,
      color: 'white',
      marginBottom: 3,
      textAlign: 'center',
    },
    firstPlaceName: {
      fontSize: 14,
    },
    therapies: {
      fontSize: 10,
      color: 'white',
    },
    firstPlaceTherapies: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    tableContainer: {
      width: '100%',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingHorizontal: 15,
      paddingVertical: 12,
    },
    rankHeaderCell: {
      width: '15%',
      alignItems: 'center',
    },
    doctorHeaderCell: {
      width: '55%',
    },
    therapyHeaderCell: {
      width: '30%',
    },
    headerText: {
      fontWeight: 'bold',
      color: '#007b8e',
      fontSize: 16,
    },
    tableRow: {
      flexDirection: 'row',
      backgroundColor: '#007b8e',
      borderRadius: 15,
      marginBottom: 10,
      height: 60,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    rankCell: {
      width: '15%',
      alignItems: 'center',
    },
    doctorCell: {
      width: '55%',
    },
    therapyCell: {
      width: '30%',
    },
    rankCellText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    therapyCellText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    doctorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    tableAvatar: {
      backgroundColor: 'lightgray',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    tableAvatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#0b5e69',
    },
    doctorName: {
      fontWeight: 'bold',
      color: 'white',
      fontSize: 16,
    },
  });

export default DoctorLeaderboard;