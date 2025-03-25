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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';
import LoadingScreen from '../components/loadingScreen';
import {RootStackParamList, RootTabParamList} from '../types/types';
import {StackNavigationProp} from '@react-navigation/stack';
import BackTabTop from './BackTopTab';
import EnhancedProfilePhoto from './EnhancedProfilePhoto';


// Skeleton Loader Component
const SkeletonLoader: React.FC = () => {
  const fadeAnim = new Animated.Value(0.3);

  React.useEffect(() => {
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
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <BackTabTop screenName="Profile" />
      <ScrollView>
        {/* Profile Card Skeleton */}
        <Animated.View 
          style={[
            styles.profileCard, 
            {opacity: fadeAnim}
          ]}
        >
          <View style={styles.profileImageContainer}>
            <View style={styles.skeletonProfileImage} />
          </View>

          <View style={styles.profileInfoContainer}>
            <View style={styles.skeletonLine1} />
            <View style={styles.skeletonLine2} />
            <View style={styles.skeletonLine3} />
            <View style={styles.skeletonEditButton} />
          </View>
        </Animated.View>

        {/* Tab Navigation Skeleton */}
        <View style={styles.tabContainer}>
          <View style={styles.skeletonTab} />
          <View style={styles.skeletonTab} />
        </View>

        {/* Content Skeleton */}
        <View style={styles.tabContent}>
          <Animated.View 
            style={[
              styles.skeletonInfoCard, 
              {opacity: fadeAnim}
            ]}
          />
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
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Icon name="call" size={20} color="#007B8E" />
                <Text style={styles.infoHeaderText}>Contact</Text>
              </View>
              <Text style={styles.infoText}>{doctorInfo?.doctor_phone}</Text>
              <Text style={styles.infoText}>{doctorInfo?.doctor_email}</Text>
            </View>
          </View>
        );
      case 'stats':
        return (
          <View style={styles.tabContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="people" size={28} color="#007B8E" />
                <Text style={styles.statNumber}>
                  {doctorInfo?.patients?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Total Patients</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="calendar" size={28} color="#007B8E" />
                <Text style={styles.statNumber}>{appointments.length}</Text>
                <Text style={styles.statLabel}>Appointments</Text>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <BackTabTop screenName="Profile" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <EnhancedProfilePhoto
              photoUri={doctorInfo?.doctors_photo}
              size={90}
              defaultImage={require('../assets/profile.png')}
            />
          </View>

          <View style={styles.profileInfoContainer}>
            <Text style={styles.name}>
              Dr. {doctorInfo?.doctor_first_name} {doctorInfo?.doctor_last_name}
            </Text>
            <Text style={styles.specialization}>
              {doctorInfo?.qualification}
            </Text>
            {doctorInfo?.organization_name && (
              <Text style={styles.organization}>
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
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'about' && styles.activeTab]}
            onPress={() => setSelectedTab('about')}>
            <Text
              style={[
                styles.tabText,
                selectedTab === 'about' && styles.activeTabText,
              ]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'stats' && styles.activeTab]}
            onPress={() => setSelectedTab('stats')}>
            <Text
              style={[
                styles.tabText,
                selectedTab === 'stats' && styles.activeTabText,
              ]}>
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
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#007B8E',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#000',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  specialization: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  organization: {
    fontSize: 15,
    color: '#007B8E',
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
    backgroundColor: '#FFFFFF',
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
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },

 // New Skeleton Loader Styles
  skeletonProfileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E1E9EE',
  },
  skeletonLine1: {
    height: 20,
    width: '70%',
    backgroundColor: '#E1E9EE',
    marginBottom: 8,
  },
  skeletonLine2: {
    height: 15,
    width: '50%',
    backgroundColor: '#E1E9EE',
    marginBottom: 4,
  },
  skeletonLine3: {
    height: 15,
    width: '60%',
    backgroundColor: '#E1E9EE',
    marginBottom: 16,
  },
  skeletonEditButton: {
    width: 80,
    height: 30,
    backgroundColor: '#E1E9EE',
    borderRadius: 10,
  },
  skeletonTab: {
    flex: 1,
    height: 40,
    backgroundColor: '#E1E9EE',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  skeletonInfoCard: {
    height: 150,
    backgroundColor: '#E1E9EE',
    borderRadius: 12,
  },
});

export default ProfileScreen;
