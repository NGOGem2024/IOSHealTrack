import React, {useState, useEffect} from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
  Alert,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
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
import LoadingScreen from '../components/loadingScreen';

type TherapyPlanDetailsRouteProp = RouteProp<RootStackParamList, 'planDetails'>;

type TherapyNavigationProp = StackNavigationProp<RootStackParamList>;
interface SessionRemark {
  doctor_name: string;
  presession_remark?: string;
  postsession_remarks?: string;
  timestamp: string;
}
interface TherapySession {
  _id: string;
  status: string;
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
    therapy_sessions?: TherapySession[];
    estimated_sessions?: number;
    presession_remarks?: SessionRemark[];
    postsession_remarks?: SessionRemark[];
  };
  patient_name: string;
}

interface SkeletonPlaceholderProps {
  width: number | string;
  height: number | string;
  style?: any; // Or use a more specific type like ViewStyle from react-native
}

const SkeletonPlaceholder = ({width, height, style}:SkeletonPlaceholderProps) => {
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: 'rgba(200, 200, 200, 0.3)',
          borderRadius: 4,
        },
        style,
      ]}
    />
  );
};

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
  const [downloadingPdf, setDownloadingPdf] = useState(false); // New state for PDF download
  const [planDetails, setPlanDetails] = useState<TherapyPlanDetails | null>(
    null,
  );
  const {planId} = route.params;

  useEffect(() => {
    fetchPlanDetails();
    const fetchPlanDetails1 = async () => {
      try {
        const response = await axiosInstance.get(`/get/plan/${planId}`, {
          headers: {Authorization: `Bearer ${session.idToken}`},
        });
        setPatientId(response.data.patient_id);
        setPlanDetails(response.data);
      } catch (error) {
        handleError(error);
      }
    };
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPlanDetails1();
    });

    return unsubscribe;
  }, [planId, navigation]);

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
  const calculateTherapyProgress = (
    therapyPlan: TherapyPlanDetails['therapy_plan'],
  ): number => {
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
      const progress =
        (completedSessions / therapyPlan.estimated_sessions) * 100;

      // Ensure progress is between 0 and 100 and is a valid number
      return Number.isFinite(progress)
        ? Math.min(Math.max(progress, 0), 100)
        : 0;
    } catch (error) {
      // If anything goes wrong, return 0 instead of breaking
      console.warn('Error calculating therapy progress:', error);
      return 0;
    }
  };

  const renderSkeletonLoader = () => {
    return (
      <ScrollView style={styles.container}>
        {/* Main Card Skeleton */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <SkeletonPlaceholder width={150} height={20} style={{marginBottom: 4}} />
            <View style={styles.actionButtons}>
              <SkeletonPlaceholder width={24} height={24} style={{marginLeft: 8}} />
              <SkeletonPlaceholder width={24} height={24} style={{marginLeft: 8}} />
              <SkeletonPlaceholder width={24} height={24} style={{marginLeft: 8}} />
            </View>
          </View>
          <SkeletonPlaceholder width={200} height={24} style={{marginBottom: 4}} />
          <SkeletonPlaceholder width={150} height={16} style={{marginBottom: 16}} />

          <View style={styles.progressContainer}>
            <SkeletonPlaceholder width="100%" height={4} style={{marginBottom: 4}} />
            <SkeletonPlaceholder width={120} height={14} style={{}} />
          </View>

          <View style={styles.dateInfo}>
            <SkeletonPlaceholder width={120} height={14} style={{}} />
            <SkeletonPlaceholder width={120} height={14} style={{}} />
          </View>
        </View>

        {/* Medical Info Card Skeleton */}
        <View style={styles.card}>
          <SkeletonPlaceholder width={150} height={18} style={{marginBottom: 12}} />
          <View style={styles.infoRow}>
            <SkeletonPlaceholder width={80} height={14} style={{}} />
            <SkeletonPlaceholder width={180} height={14} style={{marginLeft: 8}} />
          </View>
          <View style={styles.infoRow}>
            <SkeletonPlaceholder width={80} height={14} style={{}} />
            <SkeletonPlaceholder width={180} height={14} style={{marginLeft: 8}} />
          </View>
        </View>

        {/* Sessions Card Skeleton */}
        <View style={styles.card}>
          <SkeletonPlaceholder width={150} height={18} style={{marginBottom: 12}} />
          <View style={styles.sessionsContainer}>
            <View style={styles.infoRow}>
              <SkeletonPlaceholder width={120} height={14} style={{}} />
              <SkeletonPlaceholder width={30} height={14} style={{marginLeft: 8}} />
            </View>
            <View style={styles.infoRow}>
              <SkeletonPlaceholder width={120} height={14} style={{}} />
              <SkeletonPlaceholder width={30} height={14} style={{marginLeft: 8}} />
            </View>

            <SkeletonPlaceholder width={120} height={16} style={{marginTop: 16, marginBottom: 8}} />

            {[1, 2].map((_, index) => (
              <View key={index} style={styles.sessionSingleItem}>
                <View style={styles.sessionHeader}>
                  <SkeletonPlaceholder width={80} height={14} style={{}} />
                  <SkeletonPlaceholder width={70} height={20} style={{borderRadius: 12}} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Details Card Skeleton */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SkeletonPlaceholder width={120} height={18} style={{marginBottom: 8}} />
            <SkeletonPlaceholder width={24} height={24} style={{marginLeft: 8}} />
          </View>
          <View style={styles.paymentInfo}>
            <View style={styles.infoRow}>
              <SkeletonPlaceholder width={100} height={14} style={{}} />
              <SkeletonPlaceholder width={80} height={14} style={{marginLeft: 8}} />
            </View>
            <View style={styles.infoRow}>
              <SkeletonPlaceholder width={80} height={14} style={{}} />
              <SkeletonPlaceholder width={80} height={14} style={{marginLeft: 8}} />
            </View>
            <View style={styles.infoRow}>
              <SkeletonPlaceholder width={80} height={14} style={{}} />
              <SkeletonPlaceholder width={80} height={14} style={{marginLeft: 8}} />
            </View>
          </View>
        </View>

        {/* Remarks Card Skeleton */}
        <View style={[styles.card, styles.lastCard]}>
          <SkeletonPlaceholder width={120} height={18} style={{marginBottom: 12}} />
          <View style={styles.remarkSection}>
            <SkeletonPlaceholder width={140} height={16} style={{marginBottom: 12}} />
            <View style={styles.remarkItem}>
              <View style={styles.remarkHeader}>
                <SkeletonPlaceholder width={100} height={14} style={{}} />
                <SkeletonPlaceholder width={80} height={12} style={{}} />
              </View>
              <SkeletonPlaceholder width="100%" height={40} style={{marginTop: 8}} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BackTabTop screenName="Plan Details" />
        <StatusBar
          barStyle="light-content"
          backgroundColor="black"
          translucent={false}
        />
        {renderSkeletonLoader()}
      </SafeAreaView>
    );
  }

  if (!planDetails?.therapy_plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }

  const renderSessionsCard = () => {
    if (!plan.estimated_sessions && !plan.therapy_sessions) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sessions Information</Text>

        <View style={styles.sessionsContainer}>
          {plan.estimated_sessions !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Estimated Sessions:</Text>
              <Text style={styles.value}>{plan.estimated_sessions}</Text>
            </View>
          )}

          {plan.therapy_sessions && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Completed Sessions:</Text>
                <Text style={styles.value}>
                  {
                    plan.therapy_sessions.filter(
                      session => session.status === 'Completed',
                    ).length
                  }
                </Text>
              </View>

              <Text style={[styles.sectionTitle, styles.sessionListTitle]}>
                Session Details
              </Text>

              {plan.therapy_sessions.map((session, index) => (
                <TouchableOpacity
                  key={session._id}
                  style={styles.sessionItem}
                  onPress={() =>
                    navigation.navigate('therapySessions', {
                      planId: plan._id,
                    })
                  }>
                  <View key={session._id} style={styles.sessionSingleItem}>
                    <View style={styles.sessionHeader}>
                      <Text style={styles.sessionNumber}>
                        Session {index + 1}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              session.status === 'Completed'
                                ? '#4CAF50'
                                : '#FFA726',
                          },
                        ]}>
                        <Text style={styles.statusText}>{session.status}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </View>
    );
  };

  const downloadPDF = async (planId: string) => {
    try {
      setDownloadingPdf(true); // Use the PDF-specific loading state
      const fileName = `therapy_plan_${planId}.pdf`;

      // For Android API levels less than 30, request storage permission (API 23+)
      if (
        Platform.OS === 'android' &&
        Number(Platform.Version) < 30 &&
        Number(Platform.Version) >= 23
      ) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message:
              'This app needs access to your storage to download the PDF file',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Storage permission is required to download the file',
          );
          return;
        }
      }

      // Get the base64 encoded PDF from the server
      const response = await axiosInstance.get(`/${planId}/pdf`);
      const base64PDF = response.data.pdf;

      if (!base64PDF) {
        throw new Error('No PDF data received');
      }

      if (Platform.OS === 'ios') {
        const filePath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
        await ReactNativeBlobUtil.fs.writeFile(filePath, base64PDF, 'base64');
        await Linking.openURL(`file://${filePath}`);
        Alert.alert('Success', 'PDF downloaded and opened successfully');
      } else {
        let downloadPath = '';
        if (Number(Platform.Version) >= 30) {
          // For Android 11+ use RNFS.ExternalStorageDirectoryPath to write to the public Downloads folder
          downloadPath = `${RNFS.ExternalStorageDirectoryPath}/Download/${fileName}`;
        } else {
          downloadPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;
        }

        // Write the PDF file
        await ReactNativeBlobUtil.fs.writeFile(
          downloadPath,
          base64PDF,
          'base64',
        );

        // Trigger a media scan so that the file is indexed
        await ReactNativeBlobUtil.fs
          .scanFile([{path: downloadPath, mime: 'application/pdf'}])
          .catch(err => console.error('Media scan failed:', err));

        if (Number(Platform.Version) >= 30) {
          // For Android 11+, register the file with the DownloadManager so it appears in the Downloads UI
          await ReactNativeBlobUtil.android.addCompleteDownload({
            title: fileName,
            description: 'Therapy plan PDF',
            mime: 'application/pdf',
            path: downloadPath,
            showNotification: true,
          });
        }

        Alert.alert(
          'Download Complete',
          `PDF saved to Downloads folder as ${fileName}`,
          [{text: 'OK'}],
        );
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert(
        'Download Failed',
        'Unable to download the PDF file. Please try again.',
      );
    } finally {
      setDownloadingPdf(false); // Hide the PDF loading indicator when done
    }
  };
  const plan = planDetails.therapy_plan;
  const progress = calculateTherapyProgress(plan);

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTabTop screenName="Plan Details" />
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />

      {/* Simple transparent loading indicator for PDF downloads */}
      {downloadingPdf && (
        <View style={styles.transparentLoadingContainer}>
          <View style={styles.loadingIndicatorBox}>
            <ActivityIndicator size="large" color="#119FB3" />
            <Text style={styles.loadingIndicatorText}>Downloading PDF...</Text>
          </View>
        </View>
      )}

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
                style={styles.iconButton}
                onPress={() =>
                  navigation.navigate('EditTherapyPlan', {
                    planId: plan._id,
                  })
                }>
                <Icon name="square-edit-outline" size={24} color="#119FB3" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => downloadPDF(plan._id)}>
                <Icon name="file-pdf-box" size={24} color="#119FB3" />
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
        {renderSessionsCard()}
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
    sessionsContainer: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgb(240, 246, 255)'
          : 'rgba(17, 159, 179, 0.1)',
      padding: 16,
      borderRadius: 8,
    },
    sessionListTitle: {
      fontSize: 16,
      marginTop: 16,
      marginBottom: 8,
    },
    sessionItem: {
      paddingLeft: 12,
      marginBottom: 12,
    },
    sessionSingleItem: {
      borderLeftWidth: 2,
      paddingLeft: 12,
      marginBottom: 12,
      borderLeftColor: '#119FB3',
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },transparentLoadingContainer: {
      position: 'absolute',
      zIndex: 1000,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingIndicatorBox: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    loadingIndicatorText: {
      marginTop: 10,
      color: '#119FB3',
      fontWeight: '500',
    },
    sessionNumber: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
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

                