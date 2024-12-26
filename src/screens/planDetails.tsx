import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import axiosInstance from '../utils/axiosConfig';
import {useSession} from '../context/SessionContext';
import {handleError} from '../utils/errorHandler';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../types/types';
import BackTabTop from './BackTopTab';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {StackNavigationProp} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type TherapyPlanDetailsRouteProp = RouteProp<RootStackParamList, 'planDetails'>;

type TherapyNavigationProp = StackNavigationProp<RootStackParamList>;
interface SessionRemark {
  doctor_name: string;
  presession_remark?: string;
  postsession_remarks?: string;
  timestamp: string;
}

interface TherapyPlanDetails {
  therapy_plan: {
    _id: string;
    therapy_name: string;
    patient_id: string;
    patient_diagnosis: string;
    patient_symptoms: string[] | string;
    therapy_duration: string;
    therapy_end: string;
    therapy_start: string;
    patient_therapy_category: string;
    total_amount: number | string;
    received_amount: string;
    balance: string;
    extra_addons?: string[] | Array<{name: string; amount: number}>;
    addons_amount?: number | string;
    presession_remarks?: SessionRemark[];
    postsession_remarks?: SessionRemark[];
  };
  patient_name: string;
}

const TherapyPlanDetails: React.FC = () => {
  const route = useRoute<TherapyPlanDetailsRouteProp>();
  const navigation = useNavigation<TherapyNavigationProp>();
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const {session} = useSession();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<TherapyPlanDetails | null>(
    null,
  );
  const {planId} = route.params;

  useEffect(() => {
    fetchPlanDetails();
  }, [planId]);

  const fetchPlanDetails = async () => {
    if (!session.idToken || !planId) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/get/plan/${planId}`, {
        headers: {Authorization: `Bearer ${session.idToken}`},
      });
      setPatientId(response.data.patient_id);
      setPlanDetails(response.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  const calculateProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const current = new Date().getTime();
    const total = end - start;
    const elapsed = current - start;
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="black"
          translucent={false}
        />
        <ActivityIndicator size="large" color="#119FB3" />
        <Text style={styles.loadingText}>Loading Plan Details...</Text>
      </View>
    );
  }

  if (!planDetails?.therapy_plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }

  const plan = planDetails.therapy_plan;
  const progress = calculateProgress(plan.therapy_start, plan.therapy_end);

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTabTop screenName="Plan Details" />
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />

      <ScrollView style={styles.container}>
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Patient', {
                  patientId: patientId || '',
                  preloadedData: undefined,
                })
              }>
              <Text style={styles.patientName}>
                {planDetails?.patient_name}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  navigation.navigate('CreateTherapy', {
                    patientId: patientId || '',
                  })
                }>
                <Icon name="calendar-clock" size={24} color="#119FB3" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate('EditTherapyPlan', {
                    planId: plan._id,
                  })
                }>
                <Icon name="square-edit-outline" size={24} color="#119FB3" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.therapyName}>{plan.therapy_name}</Text>
          <Text style={styles.category}>{plan.patient_therapy_category}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {width: `${progress}%`}]} />
            </View>
            <Text style={styles.duration}>
              Duration: {plan.therapy_duration}
            </Text>
          </View>

          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>
              Start: {new Date(plan.therapy_start).toLocaleDateString()}
            </Text>
            <Text style={styles.dateText}>
              End: {new Date(plan.therapy_end).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Diagnosis:</Text>
            <Text style={styles.value}>{plan.patient_diagnosis}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Symptoms:</Text>
            <Text style={styles.value}>
              {Array.isArray(plan.patient_symptoms)
                ? plan.patient_symptoms.join(', ')
                : plan.patient_symptoms}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <TouchableOpacity
              style={styles.paymentInfoButton}
              onPress={() =>
                navigation.navigate('payment', {
                  planId: planId,
                  patientId: patientId || '',
                })
              }>
              <MaterialCommunityIcons
                name="information-outline"
                size={24}
                color="#119FB3"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.paymentInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.paymentLabel}>Total Amount:</Text>
              <Text style={styles.paymentValue}>₹{plan.total_amount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.paymentLabel}>Received:</Text>
              <Text style={styles.paymentValue}>₹{plan.received_amount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.paymentLabel}>Balance:</Text>
              <Text style={[styles.paymentValue, styles.balance]}>
                ₹{plan.balance}
              </Text>
            </View>
            {plan.extra_addons && plan.extra_addons.length > 0 && (
              <View style={styles.extraAddonsSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Extra Addons:</Text>
                </View>
                {plan.extra_addons.map((addon, index) => {
                  // Check if addon is an object with name and amount properties
                  if (
                    typeof addon === 'object' &&
                    'name' in addon &&
                    'amount' in addon
                  ) {
                    return (
                      <View key={index} style={styles.addonRow}>
                        <Text style={styles.addonName}>{addon.name}</Text>
                        <Text style={styles.addonAmount}>₹{addon.amount}</Text>
                      </View>
                    );
                  }
                  // If addon is a string, render it differently
                  return (
                    <View key={index} style={styles.addonRow}>
                      <Text style={styles.addonName}>{addon}</Text>
                    </View>
                  );
                })}
                {plan.addons_amount && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Total Addons Amount:</Text>
                    <Text style={styles.value}>₹{plan.addons_amount}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {(plan.presession_remarks?.some(r => r.presession_remark) ||
          plan.postsession_remarks?.some(r => r.postsession_remarks)) && (
          <View style={[styles.card, styles.lastCard]}>
            <Text style={styles.sectionTitle}>Session Remarks</Text>

            {/* Pre-session Remarks Section */}
            {plan.presession_remarks?.some(r => r.presession_remark) && (
              <View style={styles.remarkSection}>
                <Text style={styles.remarkSectionTitle}>
                  Pre-session Remarks
                </Text>
                {plan.presession_remarks
                  .filter(remark => remark.presession_remark)
                  .map((remark, index) => (
                    <View key={`pre-${index}`} style={styles.remarkItem}>
                      <View style={styles.remarkHeader}>
                        <Text style={styles.doctorName}>
                          {remark.doctor_name}
                        </Text>
                        <Text style={styles.timestamp}>
                          {new Date(remark.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.remarkText}>
                        {remark.presession_remark}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Post-session Remarks Section */}
            {plan.postsession_remarks?.some(r => r.postsession_remarks) && (
              <View style={styles.remarkSection}>
                <Text style={styles.remarkSectionTitle}>
                  Post-session Remarks
                </Text>
                {plan.postsession_remarks
                  .filter(remark => remark.postsession_remarks)
                  .map((remark, index) => (
                    <View key={`post-${index}`} style={styles.remarkItem}>
                      <View style={styles.remarkHeader}>
                        <Text style={styles.doctorName}>
                          {remark.doctor_name}
                        </Text>
                        <Text style={styles.timestamp}>
                          {new Date(remark.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.remarkText}>
                        {remark.postsession_remarks}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    paymentInfo: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgb(240, 246, 255)'
          : 'rgba(17, 159, 179, 0.1)', // Darker background for dark mode
      padding: 12,
      borderRadius: 8,
    },
    paymentLabel: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    paymentValue: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right',
      marginLeft: 8,
    },
    balance: {
      color: '#119FB3',
      fontWeight: 'bold',
    },
    remarkSection: {
      marginBottom: 16,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      padding: 8,
      marginLeft: 8,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    extraAddonsSection: {
      marginTop: 8,
      backgroundColor: 'rgba(17, 159, 179, 0.05)',
      borderRadius: 8,
      padding: 8,
    },
    addonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    addonName: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    addonAmount: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    remarkSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#119FB3',
      marginBottom: 12,
      marginTop: 8,
    },

    paymentInfoButton: {
      padding: 8,
      marginLeft: 8,
    },
    editButton: {
      padding: 8,
      marginLeft: 8,
    },
    remarkItem: {
      marginBottom: 16,
      borderLeftWidth: 2,
      borderLeftColor: '#119FB3',
      paddingLeft: 12,
    },
    remarkHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    doctorName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
    },
    remarkText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    safeArea: {
      flex: 1,
      backgroundColor: '#119FB3',
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#119FB3',
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
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
    lastCard: {
      marginBottom: 16,
    },
    therapyName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    patientName: {
      fontSize: 18,
      color: '#119FB3',
      marginBottom: 4,
    },
    category: {
      fontSize: 16,
      color: '#119FB3',
      marginBottom: 16,
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressBar: {
      height: 4,
      backgroundColor: '#E0E0E0',
      borderRadius: 2,
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#119FB3',
      borderRadius: 2,
    },
    duration: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    dateInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right',
      marginLeft: 8,
    },
    remarkLabel: {
      fontSize: 14,
      color: '#119FB3',
      marginBottom: 4,
    },
  });

export default TherapyPlanDetails;
