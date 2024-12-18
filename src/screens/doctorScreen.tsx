import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Title} from 'react-native-paper';
import {useSession} from '../context/SessionContext';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import instance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';

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
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BackTabTop screenName="Doctor" />
      <ScrollView
        style={styles.main}
        contentContainerStyle={styles.mainContent}>
        <View style={styles.profileContainer}>
          {doctorData ? (
            <>
              <Title style={styles.doctorName}>
                Dr. {doctorData.doctor_first_name} {doctorData.doctor_last_name}
              </Title>
              <View style={styles.content}>
                <MaterialIcons name="email" size={20} color="white" />
                <Text style={styles.mytext}> {doctorData.doctor_email}</Text>
              </View>
              <View style={styles.content}>
                <MaterialIcons name="call" size={20} color="white" />
                <Text style={styles.mytext}> {doctorData.doctor_phone}</Text>
              </View>
              <View style={styles.content}>
                <AntDesign name="idcard" size={20} color="white" />
                <Text style={styles.mytext}> {doctorData._id}</Text>
              </View>
              <View style={styles.content}>
                <MaterialIcons name="business" size={20} color="white" />
                <Text style={styles.mytext}>
                  {doctorData.organization_name}
                </Text>
              </View>
              <View style={styles.content}>
                <MaterialCommunityIcons name="doctor" size={20} color="white" />
                <Text style={styles.mytext}> {doctorData.qualification}</Text>
              </View>
              <View style={styles.content}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={20}
                  color="white"
                />
                <Text style={styles.mytext}>
                  patients: {doctorData.patients.length}
                </Text>
              </View>
              <View style={styles.content}>
                <MaterialCommunityIcons
                  name="checkbox-marked-circle"
                  size={20}
                  color="white"
                />
                <Text style={styles.mytext}>Status: {doctorData.status}</Text>
              </View>
              {doctorData.is_admin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </>
          ) : (
            <Text>No doctor data available</Text>
          )}
        </View>
        <View style={styles.botscrview}>
          <Text style={styles.headlist}>Doctor Actions</Text>
          <View style={styles.container}>
            {session.is_admin && (
              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() =>
                  navigation.navigate('UpdateDoctor', {
                    doctorId: doctorId,
                  })
                }
                disabled={!doctorData}>
                <View style={styles.iconleft}>
                  <MaterialCommunityIcons
                    name="square-edit-outline"
                    size={30}
                    color="#65b6e7"
                    style={styles.iconlist}
                  />
                  <Text style={styles.link}>Update Profile</Text>
                </View>
                <Octicons name="chevron-right" size={24} color="black" />
              </TouchableOpacity>
            )}
          </View>
          {doctorData && doctorData.todayAppointments && (
            <View style={styles.appointmentsContainer}>
              <Text style={styles.appointmentsTitle}>Today's Appointments</Text>
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
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#119FB3',
  },
  mainContent: {
    flexGrow: 1,
  },
  content: {
    flexDirection: 'row',
    margin: 3,
  },
  mytext: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  botscrview: {
    backgroundColor: 'white',
    width: '100%',
    borderTopLeftRadius: 40,
    marginTop: 20,
    borderTopRightRadius: 40,
    paddingTop: 20,
    flexGrow: 1,
  },
  container: {
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  link: {
    fontSize: 16,
    marginLeft: 15,
    color: 'black',
    fontWeight: 'bold',
  },
  linkContainer: {
    paddingHorizontal: 10,
    borderRadius: 10,
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row',
    marginBottom: 10,
  },
  iconleft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconlist: {
    padding: 7,
    borderRadius: 15,
    backgroundColor: '#d6e6f2',
  },
  headlist: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 20,
    marginBottom: 0,
  },
  appointmenticon: {
    backgroundColor: '#d3edda',
  },
  patienticon: {
    backgroundColor: '#dddaf2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#119FB3',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  profileContainer: {
    paddingLeft: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  doctorName: {
    fontSize: 23,
    color: 'white',
    fontWeight: 'bold',
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 5,
  },
  adminBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentsContainer: {
    padding: 20,
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    marginBottom: 20,
  },
  appointmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'Black',
    marginBottom: 10,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  appointmentText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
});

export default DoctorScreen;
