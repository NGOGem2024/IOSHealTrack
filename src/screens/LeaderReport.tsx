// ResponsiveLeaderReport.tsx
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  PixelRatio,
  Platform,
} from 'react-native';
import axiosinstance from '../utils/axiosConfig';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';

// Responsive utils
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
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

const DoctorLeaderboard: React.FC<DoctorLeaderboardProps> = ({month, year}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const {theme} = useTheme();
  const styles = getStyles(getTheme(theme.name as any));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosinstance.get(
          `/monthly/leaderboard?month=${month}&year=${year}`,
        );

        if (response.data?.success) {
          setDoctors(response.data.data);

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
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year]);

  const getTopThreeArranged = () => {
    const topThree = [...doctors.slice(0, 3)].sort(
      (a, b) => b.therapy_count - a.therapy_count,
    );
    if (topThree.length === 3) return [topThree[1], topThree[0], topThree[2]];
    return topThree;
  };

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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
            transform: [{translateY: slideAnim}],
            marginHorizontal: getResponsiveSize(5),
          },
        ]}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={[styles.avatar, isFirstPlace && styles.firstPlaceAvatar]}>
          {doctor.doctor_photo ? (
            <Image
              source={{uri: doctor.doctor_photo}}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {doctor.doctor_name?.charAt(0) || 'D'}
            </Text>
          )}
        </View>
        <Text style={[styles.name, isFirstPlace && styles.firstPlaceName]}>
          {doctor.doctor_name.split(' ')[0]}
        </Text>
        <Text
          style={[
            styles.therapies,
            isFirstPlace && styles.firstPlaceTherapies,
          ]}>
          {doctor.therapy_count} therapies
        </Text>
      </Animated.View>
    );
  };

  const renderTableRow = ({item, index}: {item: Doctor; index: number}) => (
    <Animated.View
      key={`row-${item.doctor_id}`}
      style={[
        styles.tableRow,
        {
          opacity: fadeAnim,
          transform: [{translateX: slideAnim}],
        },
      ]}>
      <View style={styles.rankCell}>
        <Text style={styles.rankCellText}>{index + 1}</Text>
      </View>
      <View style={styles.doctorCell}>
        <View style={styles.doctorInfo}>
          <View style={styles.tableAvatar}>
            {item.doctor_photo ? (
              <Image
                source={{uri: item.doctor_photo}}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.tableAvatarText}>
                {item.doctor_name?.charAt(0) || 'D'}
              </Text>
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
              renderTopThreeItem(doctor, index),
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
              keyExtractor={item => item.doctor_id}
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
      borderRadius: getResponsiveSize(15),
      padding: getResponsiveSize(20),
      width: '100%',
      marginBottom: getResponsiveSize(20),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: getResponsiveSize(4)},
      shadowOpacity: 0.1,
      shadowRadius: getResponsiveSize(6),
      elevation: 5,
    },
    chartTitle: {
      fontSize: normalize(20),
      fontWeight: '700',
      color: theme.colors.mainColor,
      textAlign: 'center',
      marginBottom: getResponsiveSize(5),
    },
    chartSubtitle: {
      fontSize: normalize(14),
      color: '#7f8c8d',
      textAlign: 'center',
      marginBottom: getResponsiveSize(15),
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
    topCards: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      marginBottom: getResponsiveSize(30),
    },
    card: {
      backgroundColor: '#0b5e69',
      borderRadius: getResponsiveSize(15),
      padding: getResponsiveSize(15),
      alignItems: 'center',
      width: SCREEN_WIDTH * 0.22,
      position: 'relative',
      elevation: 4,
    },
    firstPlace: {
      backgroundColor: '#007b8e',
      width: SCREEN_WIDTH * 0.28,
      minHeight: getResponsiveSize(160),
      zIndex: 1,
      padding: getResponsiveSize(20),
    },
    rankBadge: {
      position: 'absolute',
      top: getResponsiveSize(-12),
      backgroundColor: '#ffcc00',
      width: getResponsiveSize(24),
      height: getResponsiveSize(24),
      borderRadius: getResponsiveSize(12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: {
      color: '#333',
      fontWeight: 'bold',
      fontSize: normalize(14),
    },
    avatar: {
      backgroundColor: 'lightgray',
      width: SCREEN_WIDTH * 0.12,
      height: SCREEN_WIDTH * 0.12,
      borderRadius: SCREEN_WIDTH * 0.06,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: getResponsiveSize(10),
      borderWidth: getResponsiveSize(2),
      borderColor: 'white',
      overflow: 'hidden',
    },
    firstPlaceAvatar: {
      width: SCREEN_WIDTH * 0.15,
      height: SCREEN_WIDTH * 0.15,
      borderRadius: SCREEN_WIDTH * 0.075,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      fontSize: normalize(16),
      fontWeight: 'bold',
      color: '#0b5e69',
    },
    name: {
      fontWeight: 'bold',
      fontSize: normalize(12),
      color: 'white',
      marginBottom: getResponsiveSize(3),
      textAlign: 'center',
    },
    firstPlaceName: {
      fontSize: normalize(14),
    },
    therapies: {
      fontSize: normalize(10),
      color: 'white',
    },
    firstPlaceTherapies: {
      fontSize: normalize(12),
      fontWeight: 'bold',
    },
    tableContainer: {
      width: '100%',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingHorizontal: getResponsiveSize(15),
      paddingVertical: getResponsiveSize(12),
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
      fontSize: normalize(16),
    },
    tableRow: {
      flexDirection: 'row',
      backgroundColor: '#007b8e',
      borderRadius: getResponsiveSize(15),
      marginBottom: getResponsiveSize(10),
      height: getResponsiveSize(60),
      alignItems: 'center',
      elevation: 2,
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
      fontSize: normalize(16),
    },
    therapyCellText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: normalize(16),
      textAlign: 'center',
    },
    doctorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveSize(10),
    },
    doctorName: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: normalize(14),
    },
    tableAvatar: {
      width: getResponsiveSize(30),
      height: getResponsiveSize(30),
      borderRadius: getResponsiveSize(15),
      backgroundColor: '#eee',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginRight: getResponsiveSize(10),
    },
    tableAvatarText: {
      fontSize: normalize(14),
      fontWeight: 'bold',
      color: '#007b8e',
    },
  });

export default DoctorLeaderboard;