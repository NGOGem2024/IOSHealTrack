import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScaledSize,
  SafeAreaView,
  Animated,
} from 'react-native';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSession} from '../context/SessionContext';
import {RootStackNavProps} from '../types/types';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import BackTopTab from './BackTopTab';
import instance from '../utils/axiosConfig';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import LoadingScreen from '../components/loadingScreen';

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_phone: string;
  doctor_email: string;
  is_admin: boolean;
  organization_name: string;
  doctors_photo?: string;
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
const DoctorCardSkeleton = () => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

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
          <View
            style={[
              styles.skeletonLine,
              {width: '80%', height: 12, marginBottom: 4},
            ]}
          />
          <View style={[styles.skeletonLine, {width: '60%', height: 12}]} />
        </View>
      </View>
    </View>
  );
};

// Doctor list skeleton component
const DoctorListSkeleton = () => {
  return (
    <View>
      {[...Array(8)].map((_, index) => (
        <DoctorCardSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );
};

const AllDoctors: React.FC<RootStackNavProps<'AllDoctors'>> = ({
  navigation,
}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const {session} = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    fetchDoctors();
  }, [session]);

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it starts with + and has country code
    if (phone.startsWith('+')) {
      // Format as +XX XXXXXXXXX
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    }

    // If no + prefix, assume it needs to be added with default country code
    // You can modify the default country code as needed
    return `+91 ${cleaned}`;
  };

  const fetchDoctors = async () => {
    if (!session) return;
    try {
      setIsLoading(true);
      const response = await instance.get('/getalldoctor', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
      });
      const sortedDoctors = response.data.doctors.sort(
        (a: Doctor, b: Doctor) => {
          if (a.is_admin === b.is_admin) {
            return (a.doctor_first_name || '').localeCompare(
              b.doctor_first_name || '',
            );
          }
          return a.is_admin ? -1 : 1;
        },
      );
      setDoctors(response.data.doctors);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDoctors();
    } catch (error) {
      handleError(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const navigateToDoctor = (doctorId: string) => {
    if (doctorId) {
      navigation.navigate('Doctor', {doctorId});
    } else {
      handleError(new Error('Invalid patient ID: ' + doctorId));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.safeArea}>
        <ImageBackground
          source={require('../assets/bac2.jpg')}
          style={styles.backgroundImage}>
          <BackTopTab screenName="Doctors" />
          <View
            style={[styles.container, {height: screenDimensions.height * 0.9}]}>
            <SkeletonAnimation>
              <DoctorListSkeleton />
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
        <BackTopTab screenName="Doctors" />
        <View
          style={[styles.container, {height: screenDimensions.height * 0.9}]}>
          <FlatList
            data={doctors}
            keyExtractor={item => item._id}
            renderItem={({item}) => (
              <TouchableOpacity onPress={() => navigateToDoctor(item._id)}>
                <View style={styles.doctorCard}>
                  <View style={styles.doctorCardContent}>
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
                        <MaterialIcons name="call" size={12} color="#119FB3" />
                        <Text style={styles.doctorInfo}>
                          {formatPhoneNumber(item.doctor_phone)}
                        </Text>
                      </View>
                      <View style={styles.microicon}>
                        <MaterialIcons name="email" size={12} color="#119FB3" />
                        <Text style={styles.doctorInfo}>
                          {item.doctor_email}
                        </Text>
                      </View>
                      <View style={styles.microicon}>
                        <MaterialIcons
                          name="business"
                          size={12}
                          color="#119FB3"
                        />
                        <Text style={styles.doctorInfo}>
                          {item.organization_name}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {item.is_admin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      </ImageBackground>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    doctorCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
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
    skeletonBox: {
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      borderColor: 'transparent',
    },
    skeletonLine: {
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      borderRadius: 4,
      marginVertical: 2,
    },
    // ... rest of the existing styles ...
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: 20,
      padding: 10,
      marginBottom: 16,
    },
    searchBar: {
      flex: 1,
      marginRight: 8,
      fontSize: 16,
      color: '#ffffff',
    },
    searchIcon: {
      marginLeft: 8,
      marginRight: 8,
      color: '#333333',
    },
    doctorCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 10,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5FCFF',
    },
    microicon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
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
  });

export default AllDoctors;
