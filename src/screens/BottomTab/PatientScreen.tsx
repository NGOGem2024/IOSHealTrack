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
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import Icon from 'react-native-vector-icons/FontAwesome';
//import LoadingScreen from '../../components/loadingScreen';

type PatientScreenProps = StackScreenProps<RootStackParamList, 'Patient'>;
interface TherapySession {
  _id: string;
  status: string;
}

// New Consultation interface to match your requirements
interface Consultation {
  _id: string;
  causes: string;
  consultationDate: string; // ISO date string
  consultationTime: string;
  doctorName: string;
  notes: string;
  results: string;
  patientSymptoms: string;
}

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
  therapy_sessions?: TherapySession[];
  estimated_sessions?: number;
}

// Skeleton Loader Component
const PatientScreenSkeleton: React.FC<{theme: any}> = ({theme}) => {
  const styles = getStyles(theme);
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
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTopTab screenName="Patient" />
      <ScrollView style={styles.container}>
        {/* Main Card Skeleton */}
        <Animated.View style={[styles.mainCard, {opacity: fadeAnim}]}>
          <View style={styles.cardHeader}>
            <View style={styles.skeletonNameLine} />
            <View style={styles.skeletonEditIcon} />
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.skeletonInfoRow} />
            <View style={styles.skeletonInfoRow} />
            <View style={styles.skeletonInfoRow} />
            <View style={styles.skeletonInfoRow} />
          </View>
        </Animated.View>

        {/* Quick Actions Skeleton */}
        <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.quickActionsContainer}>
            <View style={styles.skeletonQuickAction} />
            <View style={styles.skeletonQuickAction} />
            <View style={styles.skeletonQuickAction} />
          </View>
        </Animated.View>

        {/* Consultations Skeleton */}
        <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonConsultation} />
        </Animated.View>

        {/* Therapy Plans Skeleton */}
        <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonTherapyPlan} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const calculateTherapyProgress = (therapyPlan: TherapyPlan): number => {
  try {
    // Guard clause - return 0 if plan doesn't exist or is invalid
    if (!therapyPlan) return 0;

    // Check if therapy_sessions exists and is an array
    if (
      !therapyPlan.therapy_sessions ||
      !Array.isArray(therapyPlan.therapy_sessions)
    ) {
      return 0;
    }

    // Check if estimated_sessions exists and is a valid number
    if (
      !therapyPlan.estimated_sessions ||
      typeof therapyPlan.estimated_sessions !== 'number' ||
      therapyPlan.estimated_sessions <= 0
    ) {
      return 0;
    }

    // Safely count completed sessions
    const completedSessions = therapyPlan.therapy_sessions.filter(
      session => session && session.status === 'Completed',
    ).length;

    // Calculate progress percentage
    const progress = (completedSessions / therapyPlan.estimated_sessions) * 100;

    // Ensure progress is between 0 and 100 and is a valid number
    return Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 100) : 0;
  } catch (error) {
    // If anything goes wrong, return 0 instead of breaking
    console.warn('Error calculating therapy progress:', error);
    return 0;
  }
};

interface PatientData {
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  patient_id: string;
  doctor_name?: string;
  patient_address1: string;
  therapy_plans: TherapyPlan[];
  consultations?: Consultation[]; // Add consultations to the patient data
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentConsultationIndex, setCurrentConsultationIndex] = useState(0);
  const fetchPatientData = async () => {
    if (!session.idToken) return;
    setIsRefreshing(true); // Show loading indicator during refresh
    try {
      const response = await axiosInstance.get(`/patient/${patientId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.idToken,
        },
      });
      // console.log(response.data.patientData)
      setPatientData(response.data.patientData);
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false); // Hide loading indicator after refresh
    }
  };

  const handleScroll = (event: {
    nativeEvent: {layoutMeasurement: {width: any}; contentOffset: {x: number}};
  }) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentConsultationIndex(index);
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

    // Add focus listener to refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPatientData();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [patientId, session.idToken, navigation]);
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return <PatientScreenSkeleton theme={theme} />;
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
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate('UpdatePatient', {
                  patientId: patientId,
                })
              }>
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={22}
                color="#119FB3"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.contactInfo}>
            {patientData?.patient_email && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="email" size={20} color="#119FB3" />
                </View>
                <Text style={styles.infoText}>{patientData.patient_email}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="call" size={20} color="#119FB3" />
              </View>
              <Text style={styles.infoText}>{patientData?.patient_phone}</Text>
            </View>
            {patientData?.doctor_name && (
              <View>
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Icon name="user-md" size={20} color="#119FB3" />
                  </View>
                  <Text style={styles.infoText}>{patientData.doctor_name}</Text>
                </View>
              </View>
            )}
            {patientData?.patient_address1 && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="location-on" size={20} color="#119FB3" />
                </View>
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
                navigation.navigate('CreateTherapyPlan', {
                  patientId: patientId,
                })
              }>
              <Ionicons name="clipboard" size={24} color="#6A0DAD" />
              <Text style={styles.quickActionText}>Create Therapy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate('CreateTherapy', {
                  patientId: patientId,
                })
              }>
              <MaterialCommunityIcons name="file" size={24} color="#6e54ef" />
              <Text style={styles.quickActionText}>Book Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate('TherapyHistory', {
                  patientId: patientId,
                })
              }>
              <Ionicons name="medical" size={24} color="#55b55b" />
              <Text style={styles.quickActionText}>Appointments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Consultations Section - Modified to always show */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Consultations</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                navigation.navigate('CreateConsultation', {
                  patientId: patientId,
                })
              }>
              <MaterialIcons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {patientData?.consultations &&
          patientData.consultations.length > 0 ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.horizontalScrollView}
                contentContainerStyle={styles.horizontalScrollContent}>
                {patientData.consultations
                  .slice()
                  .reverse()
                  .map(consultation => (
                    <View
                      key={consultation._id}
                      style={styles.consultationItemContainer}>
                      <View style={styles.consultationItem}>
                        <View style={styles.consultationHeader}>
                          <View style={styles.consultationHeaderLeft}>
                            <View style={styles.consultationIconContainer}>
                              <MaterialIcons
                                name="medical-services"
                                size={20}
                                color="#119FB3"
                              />
                            </View>
                            <View>
                              <Text style={styles.consultationCause}>
                                {consultation.causes}
                              </Text>
                              <Text style={styles.consultationDatetime}>
                              {formatDate(consultation.consultationDate)} •{' '}
                              {consultation.consultationTime}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.consultationDetails}>
                          <View style={styles.consultationDetailRow}>
                            <Text style={styles.consultationDetailLabel}>
                              Doctor:
                            </Text>
                            <Text style={styles.consultationDetailValue}>
                              {consultation.doctorName}
                            </Text>
                          </View>

                          <View style={styles.consultationDetailRow}>
                            <Text style={styles.consultationDetailLabel}>
                              Symptoms:
                            </Text>
                            <Text style={styles.consultationDetailValue}>
                              {consultation.patientSymptoms}
                            </Text>
                          </View>

                          <View style={styles.consultationDetailRow}>
                            <Text style={styles.consultationDetailLabel}>
                              Notes:
                            </Text>
                            <Text style={styles.consultationDetailValue}>
                              {consultation.notes}
                            </Text>
                          </View>

                          <View style={styles.consultationDetailRow}>
                            <Text style={styles.consultationDetailLabel}>
                              Results:
                            </Text>
                            <Text style={styles.consultationDetailValue}>
                              {consultation.results}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
              </ScrollView>

              {/* Indicator dots */}
              <View style={styles.dotsContainer}>
                {patientData.consultations
                  .slice()
                  .reverse()
                  .map((consultation, index) => (
                    <View
                      key={`dot-${consultation._id}`}
                      style={[
                        styles.dot,
                        currentConsultationIndex === index && styles.activeDot,
                      ]}
                    />
                  ))}
              </View>
            </>
          ) : (
            <View style={styles.noConsultationsContainer}>
              <Text style={styles.noConsultationsText}>
                No consultations yet
              </Text>
            </View>
          )}
        </View>
        {isRefreshing && (
          <View style={styles.refreshLoadingContainer}>
            <ActivityIndicator size="small" color="black" />
          </View>
        )}

        {/* Therapy Plans Card */}
        {patientData?.therapy_plans && patientData.therapy_plans.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Therapy Plans</Text>
            {patientData.therapy_plans
              .slice()
              .reverse()
              .map((plan, index) => {
                const progressPercentage = calculateTherapyProgress(plan);

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
    consultationButtonContainer: {
      paddingLeft: '35%',
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Add these styles to your getStyles function
    noConsultationsContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: 'rgba(17, 159, 179, 0.3)',
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(245, 250, 255, 0.5)'
          : 'rgba(17, 159, 179, 0.05)',
    },
    noConsultationsText: {
      fontSize: 14,
      color: theme.colors.text + '99',
      margin: 5,
    },
    addFirstConsultationButton: {
      backgroundColor: '#119FB3',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    addFirstConsultationText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    consultationButton: {
      backgroundColor: '#007b8e',
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignSelf: 'flex-start',
    },
    consultationButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 15,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#CCCCCC',
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: '#119FB3',
    },
    horizontalScrollView: {
      marginHorizontal: -16, // Counteract card padding
    },
    horizontalScrollContent: {
      paddingHorizontal: 16, // Re-add padding for content
    },
    consultationItemContainer: {
      width: Dimensions.get('window').width - 32, // Full width minus card padding
      paddingRight: 35, // Spacing between items
    },
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
      backgroundColor: '#007B8E',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#119FB3',
    },
    refreshLoadingContainer: {
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
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
      marginBottom: 5,
    },
    patientName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#119FB3',
    },
    contactInfo: {
      marginTop: 8,
    },
    iconContainer: {
      width: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
      paddingLeft: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    quickActionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 5,
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

    // Consultations Styles - NEW
    sectionHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    addButton: {
      backgroundColor: '#119FB3',
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    consultationItem: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgb(245, 250, 255)'
          : 'rgba(17, 159, 179, 0.1)',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: '#119FB3',
      width: '100%',
    },
    consultationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    consultationHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    consultationIconContainer: {
      backgroundColor: 'rgba(17, 159, 179, 0.1)',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    consultationCause: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    consultationDatetime: {
      fontSize: 12,
      color: theme.colors.text + '99',
      marginTop: 2,
    },
    consultationDetails: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(17, 159, 179, 0.2)',
    },
    consultationDetailRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    consultationDetailLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      width: 60,
    },
    consultationDetailValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    // Skeleton styles
    skeletonNameLine: {
      height: 30,
      width: '60%',
      backgroundColor: '#E1E9EE',
      marginBottom: 10,
    },
    skeletonEditIcon: {
      height: 24,
      width: 24,
      backgroundColor: '#E1E9EE',
      borderRadius: 4,
    },
    skeletonInfoRow: {
      height: 20,
      width: '80%',
      backgroundColor: '#E1E9EE',
      marginBottom: 10,
      borderRadius: 4,
    },
    skeletonSectionTitle: {
      height: 24,
      width: '40%',
      backgroundColor: '#E1E9EE',
      marginBottom: 12,
      borderRadius: 4,
    },
    skeletonQuickAction: {
      height: 60,
      width: '30%',
      backgroundColor: '#E1E9EE',
      borderRadius: 8,
    },
    skeletonTherapyPlan: {
      height: 150,
      backgroundColor: '#E1E9EE',
      borderRadius: 8,
    },
    skeletonConsultation: {
      height: 120,
      backgroundColor: '#E1E9EE',
      borderRadius: 8,
    },
  });

export default PatientScreen;
