import React, {useState, useEffect, useCallback, useMemo} from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import axiosInstance from '../utils/axiosConfig';
import {useSession} from '../context/SessionContext';
import {handleError} from '../utils/errorHandler';
import {
  useRoute,
  useNavigation,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import {RootStackParamList} from '../types/types';
import BackTabTop from './BackTopTab';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {StackNavigationProp} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LoadingScreen from '../components/loadingScreen';
import ImageGallery from './imageGallery';

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
    notes?: Array<{
      note: string;
      doctor_name: string;
      date: string;
    }>;
  };
  patient_name: string;
  images?: Array<{
    _id: string;
    sas_url: string;
    session_type: string;
    uploaded_at: string;
  }>;
}

interface SkeletonPlaceholderProps {
  width: number | string;
  height: number | string;
  style?: any;
}

const SkeletonPlaceholder = React.memo(
  ({width, height, style}: SkeletonPlaceholderProps) => {
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
  },
);

const TherapyPlanDetails: React.FC = () => {
  const route = useRoute<TherapyPlanDetailsRouteProp>();
  const navigation = useNavigation<TherapyNavigationProp>();
  const {theme} = useTheme();

  // Memoize theme to prevent unnecessary recalculations
  const memoizedTheme = useMemo(
    () =>
      getTheme(
        theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
      ),
    [theme.name],
  );

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => getStyles(memoizedTheme), [memoizedTheme]);

  const [therapyId, setTherapyId] = useState<string | null>(null);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isNoteSubmitting, setIsNoteSubmitting] = useState(false);
  const {session} = useSession();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [planDetails, setPlanDetails] = useState<TherapyPlanDetails | null>(
    null,
  );
  const {planId} = route.params;
  const [initialLoad, setInitialLoad] = useState(true);

  // Memoize fetchPlanDetails to prevent unnecessary re-renders
  const fetchPlanDetails = useCallback(
    async (showLoader = true) => {
      if (!session.idToken || !planId) return;

      if (showLoader) setLoading(true);

      try {
        const response = await axiosInstance.get(`/get/plan/${planId}`, {
          headers: {Authorization: `Bearer ${session.idToken}`},
        });

        setPatientId(response.data.patient_id);
        setPlanDetails(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        if (showLoader) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    },
    [session.idToken, planId],
  );

  // Initial load effect - only run once
  useEffect(() => {
    fetchPlanDetails(true);
  }, []);

  // Use useFocusEffect for focus updates without loader
  useFocusEffect(
    useCallback(() => {
      if (!initialLoad) {
        fetchPlanDetails(false);
      }
    }, [fetchPlanDetails, initialLoad]),
  );

  // Memoize progress calculation
  const calculateTherapyProgress = useCallback(
    (therapyPlan: TherapyPlanDetails['therapy_plan']): number => {
      try {
        if (!therapyPlan) return 0;

        if (
          !therapyPlan.therapy_sessions ||
          !Array.isArray(therapyPlan.therapy_sessions)
        ) {
          return 0;
        }

        if (
          !therapyPlan.estimated_sessions ||
          typeof therapyPlan.estimated_sessions !== 'number' ||
          therapyPlan.estimated_sessions <= 0
        ) {
          return 0;
        }

        const completedSessions = therapyPlan.therapy_sessions.filter(
          session => session && session.status === 'Completed',
        ).length;

        const progress =
          (completedSessions / therapyPlan.estimated_sessions) * 100;

        return Number.isFinite(progress)
          ? Math.min(Math.max(progress, 0), 100)
          : 0;
      } catch (error) {
        console.warn('Error calculating therapy progress:', error);
        return 0;
      }
    },
    [],
  );

  const addNoteToTherapyPlan = useCallback(async () => {
    if (!noteText.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    try {
      setIsNoteSubmitting(true);
      await axiosInstance.put(
        `/addNote/plan/${planId}`,
        {
          note: noteText,
        },
        {
          headers: {Authorization: `Bearer ${session.idToken}`},
        },
      );

      await fetchPlanDetails(false);

      setNoteText('');
      setIsNoteModalVisible(false);

      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      handleError(error);
      Alert.alert('Error', 'Failed to add note. Please try again.');
    } finally {
      setIsNoteSubmitting(false);
    }
  }, [noteText, planId, session.idToken, fetchPlanDetails]);

  const downloadPDF = useCallback(async (planId: string) => {
    try {
      setDownloadingPdf(true);
      const fileName = `therapy_plan_${planId}.pdf`;

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

      const response = await axiosInstance.get(`/${planId}/pdf`);
      const base64PDF = response.data.pdf;

      if (!base64PDF) {
        throw new Error('No PDF data received');
      }

      if (Platform.OS === 'ios') {
        const filePath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
        await ReactNativeBlobUtil.fs.writeFile(filePath, base64PDF, 'base64');
        await ReactNativeBlobUtil.ios.openDocument(filePath);
        Alert.alert('Success', 'PDF opened successfully');
      } else {
        let downloadPath = '';
        if (Number(Platform.Version) >= 30) {
          downloadPath = `${RNFS.ExternalStorageDirectoryPath}/Download/${fileName}`;
        } else {
          downloadPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;
        }

        await ReactNativeBlobUtil.fs.writeFile(
          downloadPath,
          base64PDF,
          'base64',
        );

        await ReactNativeBlobUtil.fs
          .scanFile([{path: downloadPath, mime: 'application/pdf'}])
          .catch(err => console.error('Media scan failed:', err));

        if (Number(Platform.Version) >= 30) {
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
      setDownloadingPdf(false);
    }
  }, []);

  // Memoize note modal to prevent unnecessary re-renders
  const renderNoteModal = useMemo(
    () => (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isNoteModalVisible}
        onRequestClose={() => setIsNoteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Note to Therapy Plan</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              placeholder="Enter your note here..."
              value={noteText}
              onChangeText={setNoteText}
              maxLength={500}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsNoteModalVisible(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={addNoteToTherapyPlan}
                disabled={isNoteSubmitting}>
                {isNoteSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Save Note</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    ),
    [
      isNoteModalVisible,
      noteText,
      isNoteSubmitting,
      styles,
      addNoteToTherapyPlan,
    ],
  );

  // Memoize skeleton loader
  const renderSkeletonLoader = useMemo(() => {
    return (
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{minHeight: '100%'}}
          showsVerticalScrollIndicator={false}>
          <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <SkeletonPlaceholder
                width={150}
                height={20}
                style={{marginBottom: 4}}
              />
              <View style={styles.actionButtons}>
                <SkeletonPlaceholder
                  width={24}
                  height={24}
                  style={{marginLeft: 8}}
                />
                <SkeletonPlaceholder
                  width={24}
                  height={24}
                  style={{marginLeft: 8}}
                />
                <SkeletonPlaceholder
                  width={24}
                  height={24}
                  style={{marginLeft: 8}}
                />
              </View>
            </View>
            <SkeletonPlaceholder
              width={200}
              height={24}
              style={{marginBottom: 4}}
            />
            <SkeletonPlaceholder
              width={150}
              height={16}
              style={{marginBottom: 16}}
            />

            <View style={styles.progressContainer}>
              <SkeletonPlaceholder
                width="100%"
                height={4}
                style={{marginBottom: 4}}
              />
              <SkeletonPlaceholder width={120} height={14} style={{}} />
            </View>

            <View style={styles.dateInfo}>
              <SkeletonPlaceholder width={120} height={14} style={{}} />
              <SkeletonPlaceholder width={120} height={14} style={{}} />
            </View>
          </View>
          <View style={styles.card}>
            <SkeletonPlaceholder
              width={150}
              height={18}
              style={{marginBottom: 12}}
            />
            <View style={styles.infoRow}>
              <SkeletonPlaceholder width={80} height={14} style={{}} />
              <SkeletonPlaceholder
                width={180}
                height={14}
                style={{marginLeft: 8}}
              />
            </View>
            <View style={styles.infoRow}>
              <SkeletonPlaceholder width={80} height={14} style={{}} />
              <SkeletonPlaceholder
                width={180}
                height={14}
                style={{marginLeft: 8}}
              />
            </View>
          </View>

          <View style={styles.card}>
            <SkeletonPlaceholder
              width={150}
              height={18}
              style={{marginBottom: 12}}
            />
            <View style={styles.sessionsContainer}>
              <View style={styles.infoRow}>
                <SkeletonPlaceholder width={120} height={14} style={{}} />
                <SkeletonPlaceholder
                  width={30}
                  height={14}
                  style={{marginLeft: 8}}
                />
              </View>
              <View style={styles.infoRow}>
                <SkeletonPlaceholder width={120} height={14} style={{}} />
                <SkeletonPlaceholder
                  width={30}
                  height={14}
                  style={{marginLeft: 8}}
                />
              </View>

              <SkeletonPlaceholder
                width={120}
                height={16}
                style={{marginTop: 16, marginBottom: 8}}
              />

              {[1, 2].map((_, index) => (
                <View key={index} style={styles.sessionSingleItem}>
                  <View style={styles.sessionHeader}>
                    <SkeletonPlaceholder width={80} height={14} style={{}} />
                    <SkeletonPlaceholder
                      width={70}
                      height={20}
                      style={{borderRadius: 12}}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <SkeletonPlaceholder
              width={150}
              height={18}
              style={{marginBottom: 12}}
            />
            <View style={styles.infoRow}>
              <SkeletonPlaceholder width={80} height={14} style={{}} />
              <SkeletonPlaceholder
                width={180}
                height={14}
                style={{marginLeft: 8}}
              />
            </View>
            <View style={styles.infoRow}>
              <SkeletonPlaceholder width={80} height={14} style={{}} />
              <SkeletonPlaceholder
                width={180}
                height={14}
                style={{marginLeft: 8}}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }, [styles]);

  // Memoize sessions card
  const renderSessionsCard = useMemo(() => {
    if (!planDetails?.therapy_plan) return null;

    const plan = planDetails.therapy_plan;

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
                      session => session.status === 'completed',
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
                  <View style={styles.sessionSingleItem}>
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
                                ? '#4caf4f'
                                : session.status === 'Scheduled'
                                ? '#f48c36'
                                : '#4caf4f',
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
  }, [planDetails, styles, navigation]);

  // Main content renderer
  const renderContent = useMemo(() => {
    if (!planDetails?.therapy_plan) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Plan not found</Text>
        </View>
      );
    }

    const plan = planDetails.therapy_plan;
    const progress = calculateTherapyProgress(plan);

    return (
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{paddingBottom: 20}}
          showsVerticalScrollIndicator={false}>
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
          {planDetails?.images && planDetails.images.length > 0 && (
            <ImageGallery images={planDetails.images} />
          )}
          <View style={styles.card}>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>Notes</Text>
              <TouchableOpacity onPress={() => setIsNoteModalVisible(true)}>
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={24}
                  color="#007b8e"
                  style={styles.plusIcon}
                />
              </TouchableOpacity>
            </View>

            {plan.notes && plan.notes.length > 0 && (
              <>
                {plan.notes.map((note, index) => (
                  <View key={index} style={styles.noteItem}>
                    <View style={styles.noteHeader}>
                      <Text style={styles.noteDoctor}>{note.doctor_name}</Text>
                      <Text style={styles.noteDate}>
                        {new Date(note.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.noteText}>{note.note}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {renderSessionsCard}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <TouchableOpacity
                style={styles.paymentInfoButton}
                onPress={() =>
                  navigation.navigate('payment', {
                    planId: planId,
                    patientId: patientId || '',
                    therapyId: '',
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
                    if (
                      typeof addon === 'object' &&
                      'name' in addon &&
                      'amount' in addon
                    ) {
                      return (
                        <View key={index} style={styles.addonRow}>
                          <Text style={styles.addonName}>{addon.name}</Text>
                          <Text style={styles.addonAmount}>
                            ₹{addon.amount}
                          </Text>
                        </View>
                      );
                    }
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
      </View>
    );
  }, [
    planDetails,
    patientId,
    planId,
    navigation,
    calculateTherapyProgress,
    downloadPDF,
    renderSessionsCard,
    styles,
  ]);

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
        animated={false}
      />
      <BackTabTop screenName="Plan Details" />

      {downloadingPdf && (
        <View style={styles.transparentLoadingContainer}>
          <View style={styles.loadingIndicatorBox}>
            <ActivityIndicator size="large" color="#119FB3" />
            <Text style={styles.loadingIndicatorText}>Downloading PDF...</Text>
          </View>
        </View>
      )}

      {loading && initialLoad ? renderSkeletonLoader : renderContent}
      {renderNoteModal}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    noteItem: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: 'rgba(17, 159, 179, 0.1)',
      borderRadius: 8,
    },
    contentContainer: {
      flex: 1,
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    noteDoctor: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    noteDate: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
    },
    noteText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    noteInput: {
      width: '100%',
      height: 150,
      borderWidth: 1,
      borderColor: '#119FB3',
      borderRadius: 8,
      padding: 10,
      marginBottom: 15,
      textAlignVertical: 'top',
      color: theme.colors.text,
      backgroundColor: theme.colors.card,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    modalCancelButton: {
      flex: 1,
      marginRight: 10,
      padding: 12,
      backgroundColor: '#E0E0E0',
      borderRadius: 8,
      alignItems: 'center',
    },
    modalCancelButtonText: {
      color: '#000',
      fontWeight: '500',
    },
    modalSubmitButton: {
      flex: 1,
      padding: 12,
      backgroundColor: '#119FB3',
      borderRadius: 8,
      alignItems: 'center',
    },
    modalSubmitButtonText: {
      color: 'white',
      fontWeight: '500',
    },
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
    notesContainer: {
      flexDirection: 'row', // Align items in a row
      alignItems: 'center', // Align vertically centered
      justifyContent: 'space-between', // Ensure spacing is balanced
      paddingHorizontal: 10, // Adjust padding as needed
      marginVertical: 8, // Space out from other elements
    },
    notesText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    plusIcon: {
      marginLeft: 10, // Adjust spacing between text and icon
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
    },
    transparentLoadingContainer: {
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
      shadowOffset: {width: 0, height: 2},
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
      marginLeft: 10,
    },

    iconButton1: {
      flexDirection: 'row',
      marginLeft: 3,
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
    card1: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      elevation: 2,
      flexDirection: 'row',
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
      textAlign: 'left',
      marginLeft: 5,
    },
    remarkLabel: {
      fontSize: 14,
      color: '#119FB3',
      marginBottom: 4,
    },
  });

export default TherapyPlanDetails;
