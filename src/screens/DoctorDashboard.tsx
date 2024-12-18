import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Linking,
  ActivityIndicator,
  useWindowDimensions,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import {useNavigation} from '@react-navigation/native';
import {useSession} from '../context/SessionContext';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RefreshControl} from 'react-native';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import Modal from 'react-native-modal';
import axiosInstance from '../utils/axiosConfig';
import AppointmentDetailsScreen from './AppointmentDetails';
import NoAppointmentsPopup from './Noappointmentspopup';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ActiveTherapyPlans from './Activeplans';

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
}

interface Appointment {
  plan_id: string;
  _id: string;
  patient_id: string;
  therepy_type: string;
  therepy_link?: string;
  therepy_start_time: string;
  therepy_date: string;
  patient_name?: string;
  doctor_name?: string;
}

type RootStackParamList = {
  AllPatients: undefined;
  AllDoctors: undefined;
  Logout: undefined;
  DoctorRegister: undefined;
};

type DashboardScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type Item = {
  icon: string;
  label: string;
  screen?: keyof RootStackParamList | undefined;
};

const DoctorDashboard: React.FC = () => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const {session} = useSession();
  const {width} = useWindowDimensions();

  const [refreshing, setRefreshing] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isAppointmentModalVisible, setIsAppointmentModalVisible] =
    useState(false);
  const [noAppointmentsPopupVisible, setNoAppointmentsPopupVisible] =
    useState(false);

  const fetchDoctorInfo = async () => {
    if (!session.idToken) return;
    setDoctorLoading(true);
    try {
      const doctorResponse = await axiosInstance.get(`/doctor`, {
        headers: {Authorization: `Bearer ${session.idToken}`},
      });
      setDoctorInfo(doctorResponse.data);
    } catch (error) {
      handleError(error);
    } finally {
      setDoctorLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!session.idToken) return;
    setAppointmentsLoading(true);
    try {
      const appointmentsResponse = await axiosInstance.get(
        `/appointments/getevents`,
        {
          headers: {Authorization: `Bearer ${session.idToken}`},
        },
      );
      setAppointments(appointmentsResponse.data.appointments);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setAppointments([]);
        setNoAppointmentsPopupVisible(true);
      } else {
        handleError(error);
      }
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchAllAppointments = async () => {
    if (!session.idToken) return;
    try {
      const allAppointmentsResponse = await axiosInstance.get(
        `/All/appointments`,
        {
          headers: {Authorization: `Bearer ${session.idToken}`},
        },
      );
      setAllAppointments(allAppointmentsResponse.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setAllAppointments([]);
      } else {
        handleError(error);
      }
    }
  };
  useEffect(() => {
    if (session.idToken) {
      fetchDoctorInfo();
      fetchAppointments();
      fetchAllAppointments();
    } else {
      setDoctorLoading(false);
      setAppointmentsLoading(false);
    }
  }, [session.idToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDoctorInfo(),
      fetchAppointments(),
      fetchAllAppointments(),
    ]);
    setRefreshing(false);
  };

  const formatDate = (date: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  const sortAppointmentsByTime = (appointments: Appointment[]) => {
    return [...appointments].sort((a, b) => {
      const dateTimeA = new Date(`${a.therepy_date} ${a.therepy_start_time}`);
      const dateTimeB = new Date(`${b.therepy_date} ${b.therepy_start_time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  };

  const todayAppointments = (() => {
    const today = new Date().toISOString().split('T')[0];
    const filteredAppointments = appointments.filter(
      appointment => appointment.therepy_date === today,
    );
    return sortAppointmentsByTime(filteredAppointments);
  })();

  const handleAppointmentPress = (item: Appointment) => {
    setSelectedAppointment(item);
    setIsAppointmentModalVisible(true);
  };

  const closeAppointmentModal = () => {
    setIsAppointmentModalVisible(false);
    setSelectedAppointment(null);
  };

  const renderAppointment = ({item}: {item: Appointment}) => (
    <TouchableOpacity
      style={styles.appointmentItem}
      onPress={() => handleAppointmentPress(item)}>
      <Icon
        name={
          item.therepy_type.toLowerCase().includes('video')
            ? 'videocam-outline'
            : 'person-outline'
        }
        size={24}
        color={styles.iconColor.color}
      />
      <View style={styles.appointmentInfo}>
        <View style={styles.appointmentMainInfo}>
          <View>
            <Text style={styles.appointmentTime}>
              {item.therepy_start_time}
            </Text>
            <Text style={styles.appointmentType}>{item.therepy_type}</Text>
          </View>
          {item.patient_name && (
            <Text
              style={styles.patientName}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.patient_name}
            </Text>
          )}
          {showAllAppointments && item.doctor_name && (
            <Text
              style={styles.doctorName}
              numberOfLines={1}
              ellipsizeMode="tail">
              Dr. {item.doctor_name}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleNavigation = (screen?: keyof RootStackParamList) => {
    if (screen) {
      navigation.navigate(screen);
    }
  };

  const toggleAllAppointments = () => {
    setShowAllAppointments(prev => !prev);
  };

  const items: Item[] = [
    {icon: 'medical-outline', label: 'All Doctors', screen: 'AllDoctors'},
    {icon: 'list-outline', label: 'View Patients', screen: 'AllPatients'},
    {
      icon: 'add-circle-outline',
      label: 'Add Doctor',
      screen: doctorInfo?.is_admin ? 'DoctorRegister' : undefined,
    },
  ];

  const DashboardHeader = () => {
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    const toggleDropdown = () => setDropdownVisible(!isDropdownVisible);

    const navigateToScreen = (screenName: string) => {
      navigation.navigate(screenName as never);
      setDropdownVisible(false);
    };

    return (
      <View style={styles.dashboardHeader}>
        <Image
          source={require('../assets/logo3.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.profileButton} onPress={toggleDropdown}>
          <Ionicons name="person-circle-outline" size={30} color="#FFFFFF" />
        </TouchableOpacity>

        <Modal
          isVisible={isDropdownVisible}
          onBackdropPress={toggleDropdown}
          animationIn="fadeIn"
          animationOut="fadeOut"
          style={styles.modal}>
          <View style={styles.dropdown}>
            <TouchableOpacity onPress={() => navigateToScreen('AllPatients')}>
              <Text style={styles.dropdownItem}>All Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigateToScreen('DoctorDashboard')}>
              <Text style={styles.dropdownItem}>Dashboard</Text>
            </TouchableOpacity>
            {session.is_admin && ( // Only show Settings if the user is an admin
              <TouchableOpacity onPress={() => navigateToScreen('Settings')}>
                <Text style={styles.dropdownItem}>Settings</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigateToScreen('Logout')}>
              <Text style={[styles.dropdownItem, styles.logoutText]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  };

  if (doctorLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="black"
          translucent={false}
        />
        <ActivityIndicator size="large" color="#119FB3" />
        <Text style={styles.loadingText}>Loading Doctor Dashboard...</Text>
      </View>
    );
  }

  if (!session.idToken) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Please log in to view the dashboard.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <DashboardHeader />
        {doctorInfo && (
          <View style={styles.profileSection}>
            <Image
              source={require('../assets/profile.png')}
              style={styles.profilePhoto}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                Dr. {doctorInfo.doctor_first_name} {doctorInfo.doctor_last_name}
              </Text>
              <Text style={styles.profileDetailText}>
                {doctorInfo.qualification}
              </Text>
              {doctorInfo.organization_name && (
                <Text style={styles.profileOrg}>
                  {doctorInfo.organization_name}
                </Text>
              )}
              <View style={styles.profileDetail}>
                <Icon
                  name="mail-outline"
                  size={16}
                  color={styles.profileDetailIcon.color}
                />
                <Text style={styles.profileDetailText}>
                  {doctorInfo.doctor_email}
                </Text>
              </View>
              <View style={styles.profileDetail}>
                <Icon
                  name="call-outline"
                  size={16}
                  color={styles.profileDetailIcon.color}
                />
                <Text style={styles.profileDetailText}>
                  {doctorInfo.doctor_phone}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {doctorInfo?.patients?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Patient Joined</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{todayAppointments.length}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.cardContainer}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.card,
                  !item.screen && {opacity: 0.5},
                  {width: (width - 64) / 3},
                ]}
                onPress={() => item.screen && handleNavigation(item.screen)}
                disabled={!item.screen}>
                <Icon
                  name={item.icon}
                  size={32}
                  color={styles.cardIcon.color}
                />
                <Text style={styles.cardText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.sectionTitle}>
              {showAllAppointments
                ? 'All Appointments'
                : "Today's Appointments"}
            </Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleAllAppointments}>
              <Text style={styles.toggleButtonText}>
                {showAllAppointments ? 'Show My' : 'Show All'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dateText}>
            {formatDate(new Date().toISOString())}
          </Text>
          {showAllAppointments ? (
            <FlatList
              data={sortAppointmentsByTime(allAppointments)}
              renderItem={renderAppointment}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              ListEmptyComponent={<NoAppointmentsPopup visible={true} />}
            />
          ) : todayAppointments.length > 0 ? (
            <FlatList
              data={todayAppointments}
              renderItem={renderAppointment}
              keyExtractor={item => item._id}
              scrollEnabled={false}
            />
          ) : (
            <NoAppointmentsPopup visible={true} />
          )}
        </View>
        <View style={styles.section}>
          <ActiveTherapyPlans />
        </View>
      </ScrollView>
      {isAppointmentModalVisible && selectedAppointment && (
        <View style={styles.fullScreenModal}>
          <AppointmentDetailsScreen
            appointment={selectedAppointment}
            onClose={closeAppointmentModal}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    noAppointmentsText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 20,
      backgroundColor: 'white',
      borderRadius: 5,
      // height:25,
      paddingVertical: 5,
    },
    dashboardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 15,
      paddingTop: 10,
      backgroundColor: '#119FB3',
    },
    logoImage: {
      width: 120,
      height: 40,
    },
    profileButton: {
      alignItems: 'flex-end',
    },
    modal: {
      margin: 0,
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: 'white',
      borderRadius: 20,
      width: '98%',
      maxHeight: '95%',
    },
    dropdown: {
      backgroundColor: 'white',
      borderRadius: 5,
      padding: 10,
      marginTop: 44,
      marginRight: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    dropdownItem: {
      padding: 10,
      fontSize: 16,
    },
    logoutText: {
      color: 'red',
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#119FB3',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingTop: 40,
      // backgroundColor: theme.colors.primary,
      backgroundColor: '#119FB3',
    },
    appointmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    toggleButton: {
      backgroundColor: theme.colors.card,
      padding: 8,
      borderRadius: 8,
    },
    toggleButtonText: {
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    doctorName: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      marginLeft: 8,
      flex: 1,
      textAlign: 'right',
    },
    headerText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.card,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      color: theme.colors.card,
    },
    iconButton: {
      marginLeft: 16,
    },
    notificationBadge: {
      backgroundColor: theme.colors.notification,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: -5,
      right: -5,
    },
    notificationText: {
      color: theme.colors.card,
      fontSize: 12,
      fontWeight: 'bold',
    },
    profileSection: {
      flexDirection: 'row',
      padding: 24,
      backgroundColor: theme.colors.card,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 150,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    profilePhoto: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginRight: 20,
    },
    profileInfo: {
      flex: 1,
      justifyContent: 'center',
      marginBottom: 20,
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    profileOrg: {
      fontSize: 18,
      // color: theme.colors.primary,
      color: '#119FB3',
      marginBottom: 12,
    },
    profileDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    profileDetailIcon: {
      // color: theme.colors.primary,
      color: '#119FB3',
      marginRight: 8,
    },
    profileDetailText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    statsSection: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      alignItems: 'center',
      // backgroundColor: theme.colors.cardBackground,
      padding: 10,
      marginHorizontal: 16,
      borderRadius: 50,
      borderBottomRightRadius: 10,
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
      marginTop: -20,
      left: -110,
      elevation: 5,
      shadowColor: '#000',
      backgroundColor: '#119FB3',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    statItem: {
      alignItems: 'center',
    },
    statDivider: {
      height: '70%',
      width: 1,
      backgroundColor: theme.colors.border,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: 'bold',
      // color: theme.colors.primary,
      color: '#FFFFF',
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    section: {
      display: 'flex',
      margin: 16,

      marginBottom: 0,
      backgroundColor: '#119FB3',
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    dateText: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 12,
    },
    appointmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
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
    appointmentInfo: {
      flex: 1,
      marginLeft: 16,
    },
    appointmentMainInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    appointmentTime: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    appointmentType: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    patientName: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      marginLeft: 8,
      flex: 1,
      textAlign: 'right',
    },
    joinButton: {
      backgroundColor: '#119FB3',
      padding: 8,
      borderRadius: 8,
      marginLeft: 8,
    },
    joinButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    iconColor: {
      // color: theme.colors.primary,
      color: '#119FB3',
    },
    cardContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    card: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    backcover: {
      position: 'absolute',
      flex: 1,
      resizeMode: 'cover',
    },
    cardIcon: {
      // color: theme.colors.primary,
      color: '#119FB3',
    },
    cardText: {
      color: theme.colors.text,
      marginTop: 8,
      textAlign: 'center',
      fontSize: 12,
    },
  });

export default DoctorDashboard;
