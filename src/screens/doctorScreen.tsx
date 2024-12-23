import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Title} from 'react-native-paper';
import {useSession} from '../context/SessionContext';
import {handleError} from '../utils/errorHandler';
import instance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import { getTheme } from './Theme';
import { useTheme } from './ThemeContext';

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
  const { theme } = useTheme();
  const styles = getStyles(getTheme(
    theme?.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark' || 'blue'
  ));
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!session.idToken) return;
      try {
        setIsLoading(true);
        const response = await instance(`/doctor/${doctorId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        });
        const data = await response.data;
        setDoctorData(data);
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorData();
  }, [doctorId, session.idToken]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
        <Text style={styles.loadingText}>Loading doctor information...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTabTop screenName="Doctor" />
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />

      <ScrollView style={styles.container}>
        {/* Doctor Information Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.doctorName}>
              Dr. {doctorData?.doctor_first_name} {doctorData?.doctor_last_name}
            </Text>
            {doctorData?.is_admin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>

          <View style={styles.contactInfo}>
            {doctorData?.doctor_email && (
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color="#119FB3" />
                <Text style={styles.infoText}>{doctorData.doctor_email}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <MaterialIcons name="call" size={20} color="#119FB3" />
              <Text style={styles.infoText}>{doctorData?.doctor_phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="business" size={20} color="#119FB3" />
              <Text style={styles.infoText}>{doctorData?.organization_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="doctor" size={20} color="#119FB3" />
              <Text style={styles.infoText}>{doctorData?.qualification}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-group" size={20} color="#119FB3" />
              <Text style={styles.infoText}>Patients: {doctorData?.patients.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="checkbox-marked-circle" size={20} color="#119FB3" />
              <Text style={styles.infoText}>Status: {doctorData?.status}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Card */}
        {session.is_admin && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() =>
                  navigation.navigate('UpdateDoctor', {
                    doctorId: doctorId,
                  })
                }>
                <MaterialCommunityIcons
                  name="square-edit-outline"
                  size={24}
                  color="#65b6e7"
                />
                <Text style={styles.quickActionText}>Update Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Today's Appointments Card */}
        {doctorData?.todayAppointments && doctorData.todayAppointments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            {doctorData.todayAppointments.map(appointment => (
              <View key={appointment._id} style={styles.appointmentCard}>
                <Text style={styles.appointmentText}>
                  Patient: {appointment.patient_name}
                </Text>
                <Text style={styles.appointmentText}>
                  Time: {appointment.therepy_start_time}
                </Text>
                <Text style={styles.appointmentText}>
                  Type: {appointment.therepy_type}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#119FB3",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#119FB3',
  },
  mainCard: {
    backgroundColor: theme.colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  adminBadge: {
    backgroundColor: '#119FB3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  adminBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contactInfo: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  card: {
    backgroundColor:theme.colors.card,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  quickActionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  appointmentCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  appointmentText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});

export default DoctorScreen;
