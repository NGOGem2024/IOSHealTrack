import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList} from '../types/types';
import {useSession} from '../context/SessionContext';
import {handleError} from '../utils/errorHandler';
import instance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import {getTheme} from './Theme';
import {useTheme} from './ThemeContext';
import DoctorScreenSkeleton from '../components/DoctorScreenSkeleton';
import EnhancedProfilePhoto from './EnhancedProfilePhoto';

type DoctorScreenProps = StackScreenProps<RootStackParamList, 'Doctor'>;

interface DoctorData {
  _id: string;
  doctor_email: string;
  doctor_first_name: string;
  doctor_last_name: string;
  is_admin: boolean;
  organization_name: string;
  doctor_phone: string;
  status: string;
  qualification: string;
  patients: string[];
  doctors_photo?: string;
  todayAppointments: Appointment[];
}

interface Appointment {
  _id: string;
  patient_name: string;
  therepy_start_time: string;
  therepy_type: string;
}

const DoctorScreen: React.FC<DoctorScreenProps> = ({navigation, route}) => {
  const {session} = useSession();
  const {doctorId} = route.params;
  const {theme} = useTheme();

  // Stable theme reference to prevent re-renders
  const stableTheme = React.useMemo(
    () =>
      getTheme(
        (theme?.name as
          | 'purple'
          | 'blue'
          | 'green'
          | 'orange'
          | 'pink'
          | 'dark') || 'blue',
      ),
    [theme?.name],
  );

  const styles = React.useMemo(() => getStyles(stableTheme), [stableTheme]);

  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    }
    return `+91 ${cleaned}`;
  };

  const fetchDoctorDetails = useCallback(async () => {
    if (!session) return;
    try {
      setIsLoading(true);
      const response = await instance(`/doctor/${doctorId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
      });
      setDoctorData(response.data);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session, doctorId]);

  useEffect(() => {
    fetchDoctorDetails();
  }, [fetchDoctorDetails]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDoctorDetails();
    setRefreshing(false);
  }, [fetchDoctorDetails]);

  // Render the main content - this prevents layout shifts
  const renderContent = () => {
    if (isLoading || !doctorData) {
      return <DoctorScreenSkeleton theme={{name: theme?.name || 'blue'}} />;
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.headerRow}>
              <EnhancedProfilePhoto
                photoUri={doctorData?.doctors_photo}
                size={80}
                defaultImage={require('../assets/profile.png')}
              />
              <View style={styles.headerInfo}>
                <View style={styles.nameContainer}>
                  <Text style={styles.doctorName}>
                    {doctorData?.doctor_first_name}{' '}
                    {doctorData?.doctor_last_name}
                  </Text>
                  {doctorData?.is_admin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.emailText}>{doctorData?.doctor_email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.contactInfo}>
            <View style={styles.infoRow}>
              <MaterialIcons name="call" size={20} color="#007B8E" />
              <Text style={styles.infoText}>
                {doctorData?.doctor_phone
                  ? formatPhoneNumber(doctorData.doctor_phone)
                  : 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="business" size={20} color="#007B8E" />
              <Text style={styles.infoText}>
                {doctorData?.organization_name || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="account-group"
                size={20}
                color="#007B8E"
              />
              <Text style={styles.infoText}>
                Patients: {doctorData?.patients?.length || 0}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="checkbox-marked-circle"
                size={20}
                color="#007B8E"
              />
              <Text style={styles.infoText}>
                Status:{' '}
                {doctorData?.status
                  ? doctorData.status.charAt(0).toUpperCase() +
                    doctorData.status.slice(1)
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Card */}
        {session?.is_admin && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('UpdateDoctor', {
                  doctorId,
                })
              }>
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={24}
                color="#007B8E"
              />
              <Text style={styles.actionButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Appointments Card */}
        {doctorData?.todayAppointments &&
          doctorData.todayAppointments.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today's Appointments</Text>
              {doctorData.todayAppointments.map(appointment => (
                <View key={appointment._id} style={styles.appointmentCard}>
                  <View style={styles.appointmentRow}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color="#007B8E"
                    />
                    <Text style={styles.appointmentText}>
                      {appointment.patient_name}
                    </Text>
                  </View>
                  <View style={styles.appointmentRow}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={20}
                      color="#007B8E"
                    />
                    <Text style={styles.appointmentText}>
                      {appointment.therepy_start_time}
                    </Text>
                  </View>
                  <View style={styles.appointmentRow}>
                    <MaterialCommunityIcons
                      name="medical-bag"
                      size={20}
                      color="#007B8E"
                    />
                    <Text style={styles.appointmentText}>
                      {appointment.therepy_type}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
        animated={false}
      />
      <BackTabTop screenName="Doctor Profile" />
      <View style={styles.container}>{renderContent()}</View>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    container: {
      flex: 1,
      backgroundColor: '#007B8E',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
      marginTop: 15,
    },
    profileCard: {
      backgroundColor: theme.colors.card,
      margin: 16,
      borderRadius: 12,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      overflow: 'hidden',
    },
    profileHeader: {
      padding: 13,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    headerInfo: {
      flex: 1,
      marginLeft: 16,
      justifyContent: 'center',
    },
    doctorName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    emailText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    adminBadge: {
      backgroundColor: '#007B8E',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 16,
      marginLeft: 10,
    },
    adminBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    divider: {
      height: 1,
      backgroundColor: '#E0E0E0',
      marginHorizontal: 16,
    },
    contactInfo: {
      backgroundColor: theme.colors.card,
      padding: 20,
      marginBottom: 5,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      minHeight: 24, // Consistent height to prevent layout shifts
    },
    infoText: {
      marginLeft: 16,
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    card: {
      backgroundColor: theme.colors.card,
      margin: 16,
      marginTop: 0,
      padding: 20,
      borderRadius: 12,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      padding: 16,
      borderRadius: 8,
      minHeight: 56, // Consistent height
    },
    actionButtonText: {
      marginLeft: 16,
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    appointmentCard: {
      backgroundColor: theme.colors.secondary,
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
    },
    appointmentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      minHeight: 24, // Consistent height
    },
    appointmentText: {
      marginLeft: 12,
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
  });
export default DoctorScreen;
