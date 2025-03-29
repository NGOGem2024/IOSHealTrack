import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl,
  Animated,
  Appearance,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';
import EnhancedProfilePhoto from './EnhancedProfilePhoto';
import BackTabTop from './BackTopTab';
import {RootStackParamList, RootTabParamList} from '../types/types';
import {StackNavigationProp} from '@react-navigation/stack';

const {width} = Dimensions.get('window');

// Define your theme colors
const themeColors = {
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    primary: '#007B8E',
    text: '#333333',
    secondary: '#666666',
    skeleton: '#E1E9EE',
  },
  dark: {
    background: '#161c24',
    card: '#272d36',
    primary: '#007B8E',
    text: '#f3f4f6',
    secondary: '#cccccc',
    skeleton: '#3B3B3B',
  },
};

// Skeleton Loader Component with theme support
const SkeletonLoader: React.FC = () => {
  const fadeAnim = new Animated.Value(0.3);
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnim]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: currentColors.background}]}>
      <StatusBar backgroundColor={currentColors.background} barStyle="light-content" />
      <BackTabTop screenName="Profile" />
      <ScrollView>
        {/* Profile Card Skeleton */}
        <Animated.View 
          style={[
            styles.profileCard, 
            {opacity: fadeAnim, backgroundColor: currentColors.card}
          ]}>
          <View style={styles.profileImageContainer}>
            <View style={[styles.skeletonProfileImage, {backgroundColor: currentColors.skeleton}]} />
          </View>
          <View style={styles.profileInfoContainer}>
            <View style={[styles.skeletonLine1, {backgroundColor: currentColors.skeleton}]} />
            <View style={[styles.skeletonLine2, {backgroundColor: currentColors.skeleton}]} />
            <View style={[styles.skeletonLine3, {backgroundColor: currentColors.skeleton}]} />
            <View style={[styles.skeletonEditButton, {backgroundColor: currentColors.skeleton}]} />
          </View>
        </Animated.View>

        {/* Tab Navigation Skeleton */}
        <View style={styles.tabContainer}>
          <View style={[styles.skeletonTab, {backgroundColor: currentColors.skeleton}]} />
          <View style={[styles.skeletonTab, {backgroundColor: currentColors.skeleton}]} />
        </View>

        {/* Content Skeleton */}
        <View style={styles.tabContent}>
          <Animated.View 
            style={[
              styles.skeletonInfoCard, 
              {opacity: fadeAnim, backgroundColor: currentColors.skeleton}
            ]} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface DoctorInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
  doctor_phone: string;
  organization_name?: string;
  is_admin: boolean;
  qualification: string;
  patients?: any[];
  doctors_photo: string;
  address?: string;
}
type DoctorProfileScreenProps = {
  navigation: StackNavigationProp<RootTabParamList, 'Profile'>;
};

const ProfileScreen: React.FC<DoctorProfileScreenProps> = ({navigation}) => {
  const {session} = useSession();
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedTab, setSelectedTab] = useState('about');

  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  const fetchDoctorInfo = async () => {
    if (!session.idToken) return;
    try {
      const [doctorResponse, appointmentsResponse] = await Promise.all([
        axiosInstance.get(`/doctor`, {
          headers: {Authorization: `Bearer ${session.idToken}`},
        }),
        axiosInstance.get(`/appointments/getevents`, {
          headers: {Authorization: `Bearer ${session.idToken}`},
        }),
      ]);
      setDoctorInfo(doctorResponse.data);
      setAppointments(appointmentsResponse.data.appointments || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorInfo();
  }, [session.idToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDoctorInfo();
    setRefreshing(false);
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'about':
        return (
          <View style={styles.tabContent}>
            <View style={[styles.infoCard, {backgroundColor: currentColors.card}]}>
              <View style={styles.infoHeader}>
                <Icon name="call" size={20} color={currentColors.primary} />
                <Text style={[styles.infoHeaderText, {color: currentColors.text}]}>Contact</Text>
              </View>
              <Text style={[styles.infoText, {color: currentColors.secondary}]}>
                {doctorInfo?.doctor_phone}
              </Text>
              <Text style={[styles.infoText, {color: currentColors.secondary}]}>
                {doctorInfo?.doctor_email}
              </Text>
            </View>
          </View>
        );
      case 'stats':
        return (
          <View style={styles.tabContent}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, {backgroundColor: currentColors.card}]}>
                <Icon name="people" size={28} color={currentColors.primary} />
                <Text style={[styles.statNumber, {color: currentColors.text}]}>
                  {doctorInfo?.patients?.length || 0}
                </Text>
                <Text style={[styles.statLabel, {color: currentColors.secondary}]}>
                  Total Patients
                </Text>
              </View>
              <View style={[styles.statCard, {backgroundColor: currentColors.card}]}>
                <Icon name="calendar" size={28} color={currentColors.primary} />
                <Text style={[styles.statNumber, {color: currentColors.text}]}>
                  {appointments.length}
                </Text>
                <Text style={[styles.statLabel, {color: currentColors.secondary}]}>
                  Appointments
                </Text>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: currentColors.background}]}>
      <StatusBar backgroundColor={currentColors.background} barStyle="light-content" />
      <BackTabTop screenName="Profile" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Profile Card */}
        <View style={[styles.profileCard, {backgroundColor: currentColors.card}]}>
          <View style={styles.profileImageContainer}>
            <EnhancedProfilePhoto
              photoUri={doctorInfo?.doctors_photo}
              size={90}
              defaultImage={require('../assets/profile.png')}
            />
          </View>
          <View style={styles.profileInfoContainer}>
            <Text style={[styles.name, {color: currentColors.text}]}>
              Dr. {doctorInfo?.doctor_first_name} {doctorInfo?.doctor_last_name}
            </Text>
            <Text style={[styles.specialization, {color: currentColors.secondary}]}>
              {doctorInfo?.qualification}
            </Text>
            {doctorInfo?.organization_name && (
              <Text style={[styles.organization, {color: currentColors.primary}]}>
                {doctorInfo.organization_name}
              </Text>
            )}
            <View style={styles.profileInfoContainer1}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('DoctorProfileEdit')}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, {backgroundColor: currentColors.card}]}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'about' && styles.activeTab]}
            onPress={() => setSelectedTab('about')}>
            <Text style={[styles.tabText, selectedTab === 'about' && styles.activeTabText]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'stats' && styles.activeTab]}
            onPress={() => setSelectedTab('stats')}>
            <Text style={[styles.tabText, selectedTab === 'stats' && styles.activeTabText]}>
              Statistics
            </Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    margin: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileInfoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  profileInfoContainer1: {
    width: 80,
    height: 30,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  specialization: {
    fontSize: 15,
    marginBottom: 4,
  },
  organization: {
    fontSize: 15,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: 10,
    borderColor: '#000000',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    borderRadius: 12,
    padding: 4,
    marginBottom: 9,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007B8E',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 15,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 15,
    marginTop: 4,
  },
  // Skeleton Loader Styles
  skeletonProfileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  skeletonLine1: {
    height: 20,
    width: '70%',
    marginBottom: 8,
  },
  skeletonLine2: {
    height: 15,
    width: '50%',
    marginBottom: 4,
  },
  skeletonLine3: {
    height: 15,
    width: '60%',
    marginBottom: 16,
  },
  skeletonEditButton: {
    width: 80,
    height: 30,
    borderRadius: 10,
  },
  skeletonTab: {
    flex: 1,
    height: 40,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  skeletonInfoCard: {
    height: 150,
    borderRadius: 12,
  },
});

export default ProfileScreen;
