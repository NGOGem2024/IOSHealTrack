import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../../types/types';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Edit,
  Clipboard,
  FileText,
  Stethoscope,
} from 'lucide-react-native';
import {Title, Card, Paragraph} from 'react-native-paper';
import {useSession} from '../../context/SessionContext';
import {handleError} from '../../utils/errorHandler';
import BackTopTab from '../BackTopTab';
import axiosInstance from '../../utils/axiosConfig';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {getTheme} from '../Theme';
import {useTheme} from '../ThemeContext';

type PatientScreenProps = StackScreenProps<RootStackParamList, 'Patient'>;

interface TherapyPlan {
  _id: string;
  therapy_name: string;
  patient_diagnosis: string;
  patient_symptoms: string;
  therapy_duration: string;
  therapy_end: string;
  therapy_start: string;
  patient_therapy_category: string;
  total_amount: string;
  received_amount: string;
  balance: string;
}
const calculateTherapyProgress = (
  startDate: string,
  endDate: string,
): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();

  // If the therapy hasn't started yet
  if (now < start) return 0;

  // If the therapy has already ended
  if (now > end) return 100;

  // Calculate the progress percentage
  const totalDuration = end - start;
  const elapsedDuration = now - start;
  const progressPercentage = (elapsedDuration / totalDuration) * 100;

  return Math.min(Math.max(progressPercentage, 0), 100);
};

interface PatientData {
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  patient_id: string;
  patient_address1: string;
  therapy_plans: TherapyPlan[];
}

const PatientScreen: React.FC<PatientScreenProps> = ({navigation, route}) => {
  const {session} = useSession();
  const {patientId} = route.params;
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchPatientData = async () => {
    if (!session.idToken) return;
    try {
      const response = await axiosInstance.get(`/patient/${patientId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
      });
      setPatientData(response.data.patientData);
    } catch (error) {
      handleError(error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPatientData();
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await fetchPatientData();
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [patientId, session.idToken]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
        <Text style={styles.loadingText}>Loading patient information...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTopTab screenName="Patient" />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#119FB3']} // Android
            tintColor="#119FB3" // iOS
          />
        }>
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.patientName}>
              {patientData?.patient_first_name} {patientData?.patient_last_name}
            </Text>
          </View>

          <View style={styles.contactInfo}>
            {patientData?.patient_email && (
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color="#119FB3" />
                <Text style={styles.infoText}>{patientData.patient_email}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <MaterialIcons name="call" size={20} color="#119FB3" />
              <Text style={styles.infoText}>{patientData?.patient_phone}</Text>
            </View>
            {patientData?.patient_address1 && (
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={20} color="#119FB3" />
                <Text style={styles.infoText}>
                  {patientData.patient_address1}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate('UpdatePatient', {
                  patientId: patientId,
                })
              }>
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={24}
                color="#65b6e7"
              />
              <Text style={styles.quickActionText}>Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate('CreateTherapyPlan', {
                  patientId: patientId,
                })
              }>
              <Ionicons name="clipboard" size={24} color="#6A0DAD" />
              <Text style={styles.quickActionText}>Therapy Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate('CreateTherapy', {
                  patientId: patientId,
                })
              }>
              <MaterialCommunityIcons name="file" size={24} color="#6e54ef" />
              <Text style={styles.quickActionText}>Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate('UpdateTherapy', {
                  patientId: patientId,
                })
              }>
              <Ionicons name="medical" size={24} color="#55b55b" />
              <Text style={styles.quickActionText}>Sessions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Therapy Plans Card */}
        {patientData?.therapy_plans && patientData.therapy_plans.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Therapy Plans</Text>
            {patientData.therapy_plans
              .slice()
              .reverse()
              .map((plan, index) => {
                const progressPercentage = calculateTherapyProgress(
                  plan.therapy_start,
                  plan.therapy_end,
                );

                return (
                  <TouchableOpacity
                    key={plan._id}
                    onPress={() =>
                      navigation.navigate('planDetails', {planId: plan._id})
                    }
                    style={styles.therapyPlanItem}>
                    <View style={styles.therapyPlanHeader}>
                      <Text style={styles.therapyPlanTitle}>
                        {index === 0
                          ? 'Current Plan'
                          : `Past Plan ${index + 1}`}
                      </Text>
                      <TouchableOpacity
                        onPress={e => {
                          e.stopPropagation();
                          navigation.navigate('EditTherapyPlan', {
                            planId: plan._id,
                          });
                        }}>
                        <MaterialCommunityIcons
                          name="square-edit-outline"
                          size={24}
                          color="#119FB3"
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.therapyPlanName}>
                      {plan.therapy_name}
                    </Text>
                    <View style={styles.therapyPlanDetails}>
                      <Text style={styles.therapyPlanDetailText}>
                        {plan.patient_diagnosis}
                      </Text>
                      <Text style={styles.therapyPlanDetailText}>
                        {new Date(plan.therapy_start).toLocaleDateString()} -{' '}
                        {new Date(plan.therapy_end).toLocaleDateString()}
                      </Text>

                      {/* Progress Bar */}
                      <View style={styles.progressContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            {width: `${progressPercentage}%`},
                          ]}
                        />
                        <Text style={styles.progressText}>
                          {`${Math.round(progressPercentage)}% Complete`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    therapyPlanDetails: {
      flexDirection: 'column',
    },
    progressContainer: {
      marginTop: 8,
      height: 20,
      backgroundColor: '#E0E0E0',
      borderRadius: 10,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#119FB3',
      borderRadius: 10,
    },
    progressText: {
      position: 'absolute',
      width: '100%',
      textAlign: 'center',
      fontSize: 12,
      color: 'white',
      fontWeight: 'bold',
    },
    therapyPlanDetailText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 4,
    },
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    container: {
      flex: 1,
      backgroundColor: '#119FB3',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#119FB3',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#FFFFFF',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#119FB3',
    },
    errorText: {
      color: '#FFFFFF',
      fontSize: 16,
    },
    mainCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    patientName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#119FB3',
    },
    contactInfo: {
      marginTop: 8,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.colors.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickActionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    quickActionText: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.text,
    },
    therapyPlanItem: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgb(240, 246, 255)'
          : 'rgba(17, 159, 179, 0.1)', // Darker background for dark mode
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderColor: '#119FB3',
      borderWidth: 1,
    },
    therapyPlanHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    therapyPlanTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    therapyPlanName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
  });

export default PatientScreen;
