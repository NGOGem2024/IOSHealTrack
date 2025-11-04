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
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../../types/types';
import {GestureHandlerRootView, TextInput} from 'react-native-gesture-handler';
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
import PatientDocumentUploader from '../../components/documentsupload';
import DocumentDeleteDialog from '../../components/DocumentDelete';
import DocumentDisplay from '../../components/documentsupload';
import DocumentSetupModal from '../../components/documentuploadmodel';
//import LoadingScreen from '../../components/loadingScreen';

type PatientScreenProps = StackScreenProps<RootStackParamList, 'Patient'>;
interface TherapySession {
  _id: string;
  status: string;
}
interface DocumentInfo {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
  document_name?: string;
  document_type?: string;
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
    <View style={styles.safeArea}>
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
    </View>
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
      session => session && session.status === 'completed',
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
  consultations?: Consultation[];
  documents?: PatientDocument[];
  status?: string; // Add this field to track status
  archived_at?: string;
  archived_by?: string;
  archived_reason?: string;
}

interface PatientDocument {
  _id: string;
  document_name: string;
  document_url: string;
  document_upload_date: string;
  document_type: string;
  uploaded_by: string;
  file_size: number;
  file_extension: string;
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
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentInfo | null>(
    null,
  );
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);

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

  const handleDocumentDownload = async (
    documentUrl: string,
    documentName: string,
  ) => {
    try {
      const supported = await Linking.canOpenURL(documentUrl);
      if (supported) {
        await Linking.openURL(documentUrl);
      } else {
        Alert.alert('Error', 'Cannot open this document');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };
  const handleDocumentSelected = async (document: DocumentInfo) => {
    setSelectedDocument(document);
    setIsUploading(true);

    try {
      const formData = new FormData();

      // Add file to form data
      formData.append('file', {
        uri: document.uri,
        type: document.type,
        name: document.name,
      } as any);

      // Add other required fields
      formData.append('document_name', document.document_name || document.name); // Use document_name
      formData.append('document_type', document.document_type || 'Other');
      const response = await axiosInstance.post(
        `/upload-document/${patientId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Document uploaded successfully');
        await fetchPatientData(); // Refresh patient data to show the new document
        setSelectedDocument(null); // Clear selected document
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Error', 'Failed to upload document');
      setSelectedDocument(null); // Clear on error as well
    } finally {
      setIsUploading(false);
    }
  };

  const handleArchivePatient = async () => {
    if (patientData?.status === 'Archived') {
      // Direct unarchive without reason
      Alert.alert(
        'Unarchive Patient',
        `Are you sure you want to unarchive ${patientData?.patient_first_name} ${patientData?.patient_last_name}? They will be visible in your active patients list.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unarchive',
            style: 'default',
            onPress: async () => {
              setIsArchiving(true);
              try {
                const response = await axiosInstance.post(
                  `/patient/unarchive/${patientId}`,
                  {},
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: 'Bearer ' + session.idToken,
                    },
                  },
                );

                if (response.status === 200) {
                  Alert.alert('Success', 'Patient unarchived successfully', [
                    {
                      text: 'OK',
                      onPress: () => {
                        navigation.goBack();
                      },
                    },
                  ]);
                }
              } catch (error) {
                console.error('Error unarchiving patient:', error);
                Alert.alert('Error', 'Failed to unarchive patient');
              } finally {
                setIsArchiving(false);
              }
            },
          },
        ],
      );
    } else {
      // Show modal for archive with optional reason
      setShowArchiveModal(true);
    }
  };

  const confirmArchive = async () => {
    setShowArchiveModal(false);
    setIsArchiving(true);

    try {
      const requestBody: any = {};
      if (archiveReason.trim()) {
        requestBody.archived_reason = archiveReason.trim();
      }

      const response = await axiosInstance.post(
        `/patient/archive/${patientId}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Patient archived successfully', [
          {
            text: 'OK',
            onPress: () => {
              setArchiveReason(''); // Clear reason
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error archiving patient:', error);
      Alert.alert('Error', 'Failed to archive patient');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDocumentRemoved = () => {
    setSelectedDocument(null);
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
  const handleDocumentPress = (document: DocumentInfo, index: number) => {
    if (isUploading) return;

    Alert.alert(
      'Document Options',
      `What would you like to do with "${
        document.document_name || document.name
      }"?`,
      [
        {
          text: 'View Document',
          onPress: () => {
            // Implement document viewing logic
            console.log('View document:', document);
          },
        },
        {
          text: 'Replace Document',
          onPress: () => {
            setShowDocumentModal(true);
          },
        },
        {
          text: 'Remove Document',
          onPress: () => handleRemoveDocument(index),
          style: 'destructive',
        },
        {text: 'Cancel', style: 'cancel'},
      ],
      {cancelable: true},
    );
  };
  const handleDocumentConfirmed = async (document: DocumentInfo) => {
    await fetchPatientData(); // Refresh patient data to show the new document
    setShowDocumentModal(false);
  };

  const handleDeleteTherapyPlan = async (planId: string, planName: string) => {
    Alert.alert(
      'Delete Therapy Plan',
      `Are you sure you want to delete "${planName}"?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axiosInstance.post(
                `/delete/therapyplan/${planId}`,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + session.idToken,
                  },
                },
              );

              if (response.status === 200) {
                Alert.alert('Success', 'Therapy plan deleted successfully');
                await fetchPatientData(); // Refresh the patient data
              }
            } catch (error: any) {
              console.error('Error deleting therapy plan:', error);

              // Handle specific error messages from backend
              if (error.response?.data?.msg) {
                Alert.alert('Cannot Delete Plan', error.response.data.msg, [
                  {
                    text: 'OK',
                    style: 'default',
                  },
                ]);
              } else {
                Alert.alert('Error', 'Failed to delete therapy plan');
              }
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  // Handle remove document
  const handleRemoveDocument = (index: number) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          onPress: () => {
            setDocuments(prev => prev.filter((_, i) => i !== index));
            // Here you would also call API to remove from server
            // removeDocumentFromServer(documents[index].id);
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  // Handle add more documents
  const handleAddMore = () => {
    setShowDocumentModal(true);
  };

  return (
    <View style={styles.safeArea}>
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
            {/* Edit Button */}
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
              <Text style={styles.quickActionText}>Create Plan</Text>
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

        {/* ADD THIS MODAL AT THE END OF YOUR COMPONENT, BEFORE THE CLOSING </View> and after DocumentSetupModal */}
        <Modal
          visible={showArchiveModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowArchiveModal(false);
            setArchiveReason('');
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.archiveModalContainer}>
              <View style={styles.archiveModalHeader}>
                <MaterialCommunityIcons
                  name="archive"
                  size={28}
                  color="#FF6B6B"
                />
                <Text style={styles.archiveModalTitle}>Archive Patient</Text>
              </View>

              <Text style={styles.archiveModalMessage}>
                Are you sure you want to archive{' '}
                {patientData?.patient_first_name}{' '}
                {patientData?.patient_last_name}?
              </Text>

              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>
                  Reason <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="e.g., Treatment completed, Moved to another clinic..."
                  placeholderTextColor={theme.colors.text + '66'}
                  value={archiveReason}
                  onChangeText={setArchiveReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.archiveModalButtons}>
                <TouchableOpacity
                  style={styles.archiveCancelButton}
                  onPress={() => {
                    setShowArchiveModal(false);
                    setArchiveReason('');
                  }}>
                  <Text style={styles.archiveCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.archiveConfirmButton}
                  onPress={confirmArchive}>
                  <Text style={styles.archiveConfirmButtonText}>Archive</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Consultations Section - Modified to always show */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Consultations</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                navigation.navigate('SetupConsultation', {
                  patientId: patientId,
                  appointmentId: '',
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
                  .map(
                    (
                      consultation, // Make sure 'consultation' is defined in this scope
                    ) => (
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
                              <View style={styles.causeContainer}>
                                <Text
                                  style={styles.consultationCause}
                                  numberOfLines={20}
                                  ellipsizeMode="tail">
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
                              <Text
                                style={styles.consultationDetailValue}
                                numberOfLines={20}>
                                {consultation.doctorName}
                              </Text>
                            </View>

                            <View style={styles.consultationDetailRow}>
                              <Text style={styles.consultationDetailLabel}>
                                Symptoms:
                              </Text>
                              <Text
                                style={styles.consultationDetailValue}
                                numberOfLines={20}>
                                {consultation.patientSymptoms}
                              </Text>
                            </View>

                            <View style={styles.consultationDetailRow}>
                              <Text style={styles.consultationDetailLabel}>
                                Notes:
                              </Text>
                              <Text
                                style={styles.consultationDetailValue}
                                numberOfLines={20}>
                                {consultation.notes}
                              </Text>
                            </View>

                            <View style={styles.consultationDetailRow}>
                              <Text style={styles.consultationDetailLabel}>
                                Results:
                              </Text>
                              <Text
                                style={styles.consultationDetailValue}
                                numberOfLines={2}>
                                {consultation.results}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ),
                  )}
              </ScrollView>

              {/* Indicator dots */}
              <View style={styles.dotsContainer}>
                {patientData.consultations
                  .slice()
                  .reverse()
                  .map((_, index) => (
                    <View
                      key={`dot-${index}`}
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
            <Text style={styles.sectionTitle}>All Plans</Text>
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
                      <View style={styles.planActionButtons}>
                        <TouchableOpacity
                          onPress={e => {
                            e.stopPropagation();
                            navigation.navigate('EditTherapyPlan', {
                              planId: plan._id,
                            });
                          }}
                          style={styles.planActionButton}>
                          <MaterialCommunityIcons
                            name="square-edit-outline"
                            size={22}
                            color="#119FB3"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={e => {
                            e.stopPropagation();
                            handleDeleteTherapyPlan(
                              plan._id,
                              plan.therapy_name,
                            );
                          }}
                          style={styles.planActionButton}>
                          <MaterialIcons
                            name="delete-outline"
                            size={22}
                            color="#FF6B6B"
                          />
                        </TouchableOpacity>
                      </View>
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
        {isUploading && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator size="large" color="#119FB3" />
            <Text style={styles.uploadingText}>Uploading document...</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowDocumentModal(true)}>
              <MaterialIcons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Remove the DocumentDisplay usage and replace with direct document rendering */}
          {patientData?.documents && patientData.documents.length > 0 ? (
            <View style={styles.documentsContainer}>
              {patientData.documents.map((document, index) => (
                <View
                  key={document._id || index}
                  style={styles.documentItemWrapper}>
                  <TouchableOpacity
                    style={styles.documentItem}
                    onPress={() =>
                      handleDocumentDownload(
                        document.document_url,
                        document.document_name,
                      )
                    }>
                    <View style={styles.documentIconContainer}>
                      <MaterialIcons
                        name={
                          document.file_extension === 'pdf'
                            ? 'picture-as-pdf'
                            : 'description'
                        }
                        size={24}
                        color="#119FB3"
                      />
                    </View>
                    <View style={styles.documentDetails}>
                      <Text style={styles.documentName} numberOfLines={2}>
                        {document.document_name}
                      </Text>
                      <Text style={styles.documentInfo}>
                        {document.document_type} •{' '}
                        {new Date(
                          document.document_upload_date,
                        ).toLocaleDateString()}
                      </Text>
                      {document.file_size && (
                        <Text style={styles.documentSize}>
                          {(document.file_size / 1024).toFixed(1)} KB
                        </Text>
                      )}
                    </View>
                    <MaterialIcons name="download" size={20} color="#119FB3" />
                  </TouchableOpacity>

                  {/* Delete button */}
                  <DocumentDeleteDialog
                    document={document}
                    patientId={patientId}
                    onDeleteSuccess={fetchPatientData}>
                    <View style={styles.deleteButton}>
                      <MaterialIcons name="delete" size={20} color="#FF6B6B" />
                    </View>
                  </DocumentDeleteDialog>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noDocumentsContainer}>
              <MaterialIcons name="folder-open" size={48} color="#119FB3" />
              <Text style={styles.noDocumentsText}>
                No documents uploaded yet
              </Text>
              <Text style={styles.noDocumentsSubtext}>
                Tap the + button above to add your first document
              </Text>
            </View>
          )}
        </View>
        <View style={styles.card}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Patient Status</Text>
            {patientData?.status === 'Archived' && (
              <View style={styles.statusBadge}>
                <MaterialCommunityIcons
                  name="archive"
                  size={16}
                  color="#FFA500"
                />
                <Text style={styles.statusBadgeText}>Archived</Text>
              </View>
            )}
          </View>

          {patientData?.status === 'Archived' ? (
            <View style={styles.archiveInfoContainer}>
              <View style={styles.archiveIconWrapper}>
                <MaterialCommunityIcons
                  name="archive"
                  size={32}
                  color="#FFA500"
                />
              </View>

              <View style={styles.archiveDetailsContainer}>
                {patientData?.archived_reason && (
                  <View style={styles.archiveDetailRow}>
                    <Text style={styles.archiveDetailLabel}>Reason:</Text>
                    <Text style={styles.archiveDetailValue}>
                      {patientData.archived_reason}
                    </Text>
                  </View>
                )}

                {patientData?.archived_at && (
                  <View style={styles.archiveDetailRow}>
                    <Text style={styles.archiveDetailLabel}>Archived on:</Text>
                    <Text style={styles.archiveDetailValue}>
                      {new Date(patientData.archived_at).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {patientData?.archived_by && (
                  <View style={styles.archiveDetailRow}>
                    <Text style={styles.archiveDetailLabel}>Archived by:</Text>
                    <Text style={styles.archiveDetailValue}>
                      {patientData.archived_by}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.unarchiveButton}
                onPress={handleArchivePatient}
                disabled={isArchiving}>
                {isArchiving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="archive-arrow-up"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.unarchiveButtonText}>
                      Unarchive Patient
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activeStatusContainer}>
              <TouchableOpacity
                style={styles.archiveButton}
                onPress={handleArchivePatient}
                disabled={isArchiving}>
                {isArchiving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="archive-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.archiveButtonText}>
                      Archive Patient
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <DocumentSetupModal
        visible={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onDocumentConfirmed={handleDocumentConfirmed}
        patientId={patientId}
      />
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 165, 0, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
    },

    statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFA500',
    },

    archiveInfoContainer: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(255, 165, 0, 0.05)'
          : 'rgba(255, 165, 0, 0.1)',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 165, 0, 0.3)',
    },

    archiveIconWrapper: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255, 165, 0, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 16,
    },

    archiveDetailsContainer: {
      marginBottom: 16,
    },

    planActionButtons: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    planActionButton: {
      padding: 4,
    },

    archiveDetailRow: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'flex-start',
    },

    archiveDetailLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      width: 100,
    },

    archiveDetailValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },

    unarchiveButton: {
      backgroundColor: '#FFA500',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    unarchiveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    activeStatusContainer: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(76, 175, 80, 0.05)'
          : 'rgba(76, 175, 80, 0.1)',
    },

    activeIconWrapper: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 16,
    },

    activeDetailsContainer: {
      marginBottom: 16,
      alignItems: 'center',
    },

    activeStatusTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },

    activeStatusDescription: {
      fontSize: 14,
      color: theme.colors.text + '99',
      textAlign: 'center',
    },

    archiveButton: {
      backgroundColor: '#FF6B6B',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    archiveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    quickActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
      gap: 12,
    },

    quickActionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },

    // Archive Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    archiveModalContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 400,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },

    archiveModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },

    archiveModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: 12,
    },

    archiveModalMessage: {
      fontSize: 15,
      color: theme.colors.text,
      marginBottom: 20,
      lineHeight: 22,
    },

    reasonContainer: {
      marginBottom: 24,
    },

    reasonLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },

    optionalText: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.colors.text + '99',
      fontStyle: 'italic',
    },

    reasonInput: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(17, 159, 179, 0.05)'
          : 'rgba(17, 159, 179, 0.1)',
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: 'rgba(17, 159, 179, 0.3)',
      minHeight: 80,
    },

    archiveModalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },

    archiveCancelButton: {
      flex: 1,
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(0, 0, 0, 0.05)'
          : 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(17, 159, 179, 0.3)',
    },

    archiveCancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },

    archiveConfirmButton: {
      flex: 1,
      backgroundColor: '#FF6B6B',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },

    archiveConfirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    documentItemWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    documentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(17, 159, 179, 0.05)'
          : 'rgba(17, 159, 179, 0.1)',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(17, 159, 179, 0.2)',
      flex: 1,
      marginRight: 8,
    },
    noDocumentsSubtext: {
      fontSize: 12,
      color: theme.colors.text + '66',
      textAlign: 'center',
      marginTop: 4,
    },
    deleteButton: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(255, 107, 107, 0.1)'
          : 'rgba(255, 107, 107, 0.2)',
      borderRadius: 8,
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    documentsContainer: {
      marginBottom: 16,
    },
    documentIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(17, 159, 179, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    documentDetails: {
      flex: 1,
    },
    uploadOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    uploadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#fff',
      fontWeight: '500',
    },

    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    documentInfo: {
      fontSize: 12,
      color: theme.colors.text + '99',
      marginBottom: 2,
    },
    documentSize: {
      fontSize: 11,
      color: theme.colors.text + '66',
    },
    noDocumentsContainer: {
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
      marginBottom: 16,
    },
    noDocumentsText: {
      fontSize: 14,
      color: theme.colors.text + '99',
      textAlign: 'center',
    },
    causeContainer: {
      flex: 1,
      flexDirection: 'column',
      maxWidth: '85%', // Ensure there's space and text doesn't overflow
    },
    consultationCause: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flexShrink: 1, // Allow text to shrink rather than overflow
    },
    consultationHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start', // Changed from 'center' to better align with multi-line text
      flex: 1,
    },
    consultationDetailValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
      flexWrap: 'wrap', // Ensure text wraps
    },
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
    consultationIconContainer: {
      backgroundColor: 'rgba(17, 159, 179, 0.1)',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
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
      width: 90,
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
