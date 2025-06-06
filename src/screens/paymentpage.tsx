import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import BackTabTop from './BackTopTab';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import PaymentModal from './PaymentModal';
import EditPaymentModal from './EditPaymentModal';
import LoadingScreen from '../components/loadingScreen';

type Props = StackScreenProps<RootStackParamList, 'payment'>;

interface Addon {
  name: string;
  amount: number;
}

interface TherapySession {
  _id: string;
  status: string;
  date: string;
  session_number: number;
}

interface PaymentInfo {
  therapy_name: string;
  payment_summary: {
    total_amount: number;
    received_amount: number;
    balance: number;
    addons_amount: number;
  };
  session_info: {
    per_session_amount: number;
    estimated_sessions: number;
    completed_sessions: number;
    remaining_sessions: number;
  };
  payment_structure: {
    payment_type: string;
    next_payment_due: string;
    next_payment_number?: number;
  };
  addons: Array<any>;
  payment_history: Array<{
    payment_number: any;
    amount: number;
    date: string;
    type: string;
    session_number: number;
    addon_services?: Addon[];
    therapyId?: string; // Add this to match your data structure
  }>;
  therapy_sessions?: TherapySession[];
}

const PaymentDetailsScreen: React.FC<Props> = ({navigation, route}) => {
  const {theme} = useTheme();
  const {planId, patientId, therapyId} = route.params || {}; // Extract therapyId from params
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Add state for session selection
  const [availableSessions, setAvailableSessions] = useState<TherapySession[]>(
    [],
  );
  const [filteredSessions, setFilteredSessions] = useState<TherapySession[]>(
    [],
  ); // New state for filtered sessions
  const [isSessionDropdownVisible, setIsSessionDropdownVisible] =
    useState(false);
  const [selectedSession, setSelectedSession] = useState<TherapySession | null>(
    null,
  );

  useEffect(() => {
    fetchPaymentInfo();
    fetchPlanDetails();
  }, []);

  // New useEffect to filter sessions and auto-select when data is loaded
  useEffect(() => {
    if (availableSessions.length > 0 && paymentInfo?.payment_history) {
      filterAvailableSessions();
    }
  }, [availableSessions, paymentInfo, therapyId]);

  const fetchPaymentInfo = async () => {
    try {
      setError(null);
      const response = await axiosInstance.get(`/get/paymentinfo/${planId}`);

      if (response.status === 200 && response.data) {
        setPaymentInfo(response.data);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanDetails = async () => {
    try {
      const response = await axiosInstance.get(`/get/plan/${planId}`);

      if (
        response.status === 200 &&
        response.data.therapy_plan.therapy_sessions
      ) {
        setAvailableSessions(response.data.therapy_plan.therapy_sessions);
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };

  const filterAvailableSessions = () => {
    if (!availableSessions.length) {
      setFilteredSessions([]);
      setSelectedSession(null);
      return;
    }

    // If no payment history, all sessions are available
    if (
      !paymentInfo?.payment_history ||
      paymentInfo.payment_history.length === 0
    ) {
      setFilteredSessions(availableSessions);
      setSelectedSession(
        availableSessions.length > 0 ? availableSessions[0] : null,
      );
      return;
    }

    // Get session IDs that already have payments - only check therapyId field
    const paidSessionIds = new Set();

    paymentInfo.payment_history.forEach(payment => {
      // Only add therapyId to the set (ignore payments without therapyId)
      if (payment.therapyId) {
        paidSessionIds.add(payment.therapyId);
      }
    });

    // Filter out sessions that already have payments (by therapyId only)
    const filtered = availableSessions.filter(session => {
      const hasPayment = paidSessionIds.has(session._id);
      return !hasPayment;
    });

    console.log('Filtered Sessions:', filtered);
    setFilteredSessions(filtered);

    // Auto-select session logic
    let sessionToSelect = null;

    if (therapyId) {
      // If therapyId is provided in params, try to select that session
      sessionToSelect = filtered.find(session => session._id === therapyId);

      if (!sessionToSelect) {
        // If the specified therapyId is not available (maybe already paid),
        // show an alert and select the first available session
        Alert.alert(
          'Session Not Available',
          'The specified session is not available for payment. It may have already been paid for.',
          [{text: 'OK'}],
        );
        sessionToSelect = filtered.length > 0 ? filtered[0] : null;
      }
    } else {
      // If no therapyId in params, select the first available session
      sessionToSelect = filtered.length > 0 ? filtered[0] : null;
    }

    setSelectedSession(sessionToSelect);
  };
  const handleRecordPayment = async (
    amount: number,
    type: string,
    addons: Addon[] = [],
  ) => {
    try {
      if (!selectedSession) {
        Alert.alert('Error', 'Please select a session');
        return;
      }

      setLoading(true);

      const response = await axiosInstance.post(
        `/put/payment/${planId}/${selectedSession._id}`,
        {
          amount,
          type,
          session_number: selectedSession.session_number,
          addon_services: addons.map(addon => ({
            name: addon.name,
            amount: addon.amount,
          })),
        },
      );

      if (response.status === 200) {
        showSuccessToast('Payment Recorded Successfully');
        await fetchPaymentInfo(); // Refresh payment info
        await fetchPlanDetails(); // Refresh session data
      } else {
        Alert.alert('Error', 'Failed to record payment');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
      setIsPaymentModalVisible(false);
    }
  };

  const handleEditPayment = async (
    amount: number,
    type: string,
    addons: Addon[] = [],
  ) => {
    try {
      if (!selectedPayment) return;

      setLoading(true);
      const response = await axiosInstance.put(
        `/plans/${planId}/payments/${selectedPayment.date}`,
        {
          amount,
          type,
          addon_services: addons.map(addon => ({
            name: addon.name,
            amount: addon.amount,
          })),
        },
      );

      if (response.status === 200) {
        showSuccessToast('Payment Updated Successfully');
        await fetchPaymentInfo(); // Refresh payment info
      } else {
        Alert.alert('Error', 'Failed to update payment');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
      setIsEditModalVisible(false);
      setSelectedPayment(null);
    }
  };

  const handleDeletePayment = async (payment: any) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment?',
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
              setLoading(true);
              const response = await axiosInstance.delete(
                `/plans/${planId}/payments/${payment.date}`,
              );

              if (response.status === 200) {
                showSuccessToast('Payment Deleted Successfully');
                await fetchPaymentInfo(); // Refresh payment info
              } else {
                Alert.alert('Error', 'Failed to delete payment');
              }
            } catch (error) {
              handleError(error);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹ ${Number(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Updated session dropdown component to use filtered sessions
  const renderSessionDropdown = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Select Session</Text>
      {filteredSessions.length === 0 ? (
        <View style={styles.noSessionsContainer}>
          <Text style={styles.noSessionsText}>
            All sessions have been paid for or no sessions available
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsSessionDropdownVisible(true)}>
          <Text style={styles.dropdownButtonText}>
            {selectedSession
              ? `Session ${selectedSession.session_number} - ${formatDate(
                  selectedSession.date,
                )}`
              : 'Select a session'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      )}

      {/* Session Dropdown Modal - Updated to use filteredSessions */}
      <Modal
        visible={isSessionDropdownVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSessionDropdownVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.dropdownModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.dropdownModalTitle}>Select Session</Text>
              <TouchableOpacity
                onPress={() => setIsSessionDropdownVisible(false)}
                style={styles.closeButton1}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.sessionList}
              showsVerticalScrollIndicator={false}>
              {filteredSessions.map(session => (
                <TouchableOpacity
                  key={session._id}
                  style={[
                    styles.sessionOption,
                    selectedSession?._id === session._id &&
                      styles.selectedSessionOption,
                  ]}
                  onPress={() => {
                    setSelectedSession(session);
                    setIsSessionDropdownVisible(false);
                  }}>
                  <View style={styles.sessionOptionContent}>
                    <View style={styles.sessionOptionHeader}>
                      <Text style={styles.sessionOptionNumber}>
                        Session {session.session_number}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          session.status === 'Completed'
                            ? styles.completedBadge
                            : session.status === 'In Progress'
                            ? styles.inProgressBadge
                            : styles.scheduledBadge,
                        ]}>
                        <Text style={styles.statusBadgeText}>
                          {session.status}
                        </Text>
                      </View>
                      <Text style={styles.sessionOptionDate}>
                        {formatDate(session.date)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingScreen />
      </View>
    );
  }

  if (error || !paymentInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Failed to load payment details'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPaymentInfo}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <BackTabTop screenName="Payment Details" />
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}>
          {/* Session Selection Dropdown */}
          {renderSessionDropdown()}

          {/* Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{paymentInfo.therapy_name}</Text>
            <View style={styles.rowContainer}>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text style={styles.amountValue}>
                  {formatCurrency(paymentInfo.payment_summary.total_amount)}
                </Text>
              </View>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Balance</Text>
                <Text style={[styles.amountValue, {color: '#e74c3c'}]}>
                  {formatCurrency(paymentInfo.payment_summary.balance)}
                </Text>
              </View>
            </View>
            {paymentInfo.payment_summary.addons_amount > 0 && (
              <View style={styles.addonsContainer}>
                <Text style={styles.addonsLabel}>Additional Services</Text>
                <Text style={styles.addonsValue}>
                  {formatCurrency(paymentInfo.payment_summary.addons_amount)}
                </Text>
              </View>
            )}
          </View>

          {/* Session Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Session Information</Text>
            <View style={styles.sessionGrid}>
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Total Sessions</Text>
                <Text style={styles.sessionValue}>
                  {paymentInfo.session_info.estimated_sessions}
                </Text>
              </View>
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Completed</Text>
                <Text style={styles.sessionValue}>
                  {paymentInfo.session_info.completed_sessions}
                </Text>
              </View>
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Remaining</Text>
                <Text style={styles.sessionValue}>
                  {paymentInfo.session_info.remaining_sessions}
                </Text>
              </View>
              <View style={styles.sessionItem}>
                <Text style={styles.sessionLabel}>Per Session</Text>
                <Text style={styles.sessionValue}>
                  {formatCurrency(paymentInfo.session_info.per_session_amount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Structure */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Structure</Text>
            <View style={styles.paymentTypeContainer}>
              <Text style={styles.paymentTypeLabel}>Payment Type:</Text>
              <View style={styles.paymentTypeBadge}>
                <Text style={styles.paymentTypeText}>
                  {paymentInfo.payment_structure.payment_type}
                </Text>
              </View>
            </View>
            {paymentInfo.payment_structure.next_payment_due && (
              <View style={styles.nextPaymentContainer}>
                <Text style={styles.nextPaymentLabel}>Next Payment Due:</Text>
                <Text style={styles.nextPaymentDate}>
                  {formatDate(paymentInfo.payment_structure.next_payment_due)}
                </Text>
              </View>
            )}
          </View>

          {/* Payment History */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {paymentInfo.payment_history.length > 0 ? (
              paymentInfo.payment_history.map((payment, index) => (
                <View key={index} style={styles.paymentHistoryItem}>
                  <TouchableOpacity
                    style={styles.paymentHistoryContent}
                    onPress={() => {
                      setSelectedPayment(payment);
                      setIsEditModalVisible(true);
                    }}>
                    <View style={styles.paymentHistoryLeft}>
                      <Text style={styles.paymentHistorySession}>
                        {payment.payment_number &&
                          `Payment #${payment.payment_number}`}
                      </Text>
                      <Text style={styles.paymentHistoryDate}>
                        {formatDate(payment.date)}
                      </Text>
                    </View>
                    <View style={styles.paymentHistoryRight}>
                      <Text style={styles.paymentHistoryAmount}>
                        {formatCurrency(payment.amount)}
                      </Text>
                      <Text style={styles.paymentHistoryType}>
                        {payment.type}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePayment(payment)}>
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  No Payment History Available
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footerContainer}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={() => setIsCloseModalVisible(true)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.recordPaymentButton,
                  (!selectedSession || filteredSessions.length === 0) &&
                    styles.disabledButton,
                ]}
                onPress={() => setIsPaymentModalVisible(true)}
                disabled={!selectedSession || filteredSessions.length === 0}>
                <Text style={styles.buttonText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Modal
            visible={isCloseModalVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setIsCloseModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setIsCloseModalVisible(false)}
                    style={styles.closeButton1}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>
                  What would you like to do?
                </Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setIsCloseModalVisible(false);
                    navigation.navigate('DoctorDashboard');
                  }}>
                  <Text style={styles.buttonText}>Go to Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setIsCloseModalVisible(false);
                    navigation.navigate('CreateTherapy', {
                      patientId: patientId,
                    });
                  }}>
                  <Text style={styles.buttonText}>Next Appointment</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
        <PaymentModal
          visible={isPaymentModalVisible}
          onClose={() => setIsPaymentModalVisible(false)}
          onSubmit={handleRecordPayment}
          currentSession={paymentInfo.session_info.completed_sessions}
          paymentInfo={paymentInfo}
          selectedSession={selectedSession}
        />
        <EditPaymentModal
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedPayment(null);
          }}
          onSubmit={handleEditPayment}
          paymentData={
            selectedPayment
              ? {
                  amount: selectedPayment.amount,
                  type: selectedPayment.type,
                  addon_services: selectedPayment.addon_services || [],
                }
              : {
                  amount: 0,
                  type: 'CASH',
                  addon_services: [],
                }
          }
        />
      </View>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: 16,
    },
    noSessionsContainer: {
      backgroundColor: theme.colors.border,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noSessionsText: {
      fontSize: 16,
      color: '#6c757d',
      fontStyle: 'italic',
      textAlign: 'center',
    },
    dropdownModal: {
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 0, // Remove padding to handle it in sections
      width: '95%',
      maxWidth: 400,
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },

    dropdownModalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#007b8e',
      textAlign: 'center',
      flex: 1,
    },

    closeButton1: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: '#f8f9fa',
      minWidth: 36,
      minHeight: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },

    closeButtonText: {
      fontSize: 18,
      color: '#6c757d',
      fontWeight: '600',
      lineHeight: 18,
    },

    sessionList: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxHeight: 400,
    },

    sessionOption: {
      backgroundColor: '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },

    selectedSessionOption: {
      backgroundColor: '#e8f4f8',
      borderColor: '#007B8E',
      borderWidth: 2,
    },

    sessionOptionContent: {
      flexDirection: 'column',
      gap: 8,
    },

    sessionOptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    sessionOptionNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2c3e50',
    },

    sessionOptionDate: {
      fontSize: 14,
      color: '#6c757d',
    },

    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },

    completedBadge: {
      backgroundColor: '#d4edda',
    },

    inProgressBadge: {
      backgroundColor: '#fff3cd',
    },

    scheduledBadge: {
      backgroundColor: '#cce5ff',
    },

    statusBadgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#2c3e50',
    },
    dropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.border,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    disabledButton: {
      backgroundColor: 'gray',
    },
    dropdownButtonText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    dropdownArrow: {
      fontSize: 12,
      color: '#6c757d',
      marginLeft: 8,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: '#007B8E',
      overflow: 'hidden',
    },
    footerContainer: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      width: '100%',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      maxWidth: 500,
      alignSelf: 'center',
      gap: 12,
    },
    noDataContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
    },
    noDataText: {
      fontSize: 16,
      color: '#6c757d',
      fontStyle: 'italic',
    },
    button: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    recordPaymentButton: {
      backgroundColor: '#00A0B8',
      flex: 1.2, // Makes the Record Payment button slightly wider
    },
    closeButton: {
      backgroundColor: '#6c757d',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },

    fixedHeader: {
      backgroundColor: '#119FB3',
      height: Platform.OS === 'ios' ? 50 : 45,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginTop: 10,
    },
    scrollViewContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 30,
    },
    container: {
      flex: 1,
      backgroundColor: '#007B8E',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    enhancedModalContainer: {
      width: '95%',
      maxWidth: 500,
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },

    inputSection: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 16,
      color: '#2c3e50',
      marginBottom: 8,
      fontWeight: '600',
    },
    currencyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ced4da',
      borderRadius: 10,
      backgroundColor: '#f8f9fa',
    },
    currencySymbol: {
      fontSize: 18,
      color: '#6c757d',
      paddingLeft: 12,
      paddingRight: 8,
    },
    currencyInput: {
      flex: 1,
      fontSize: 18,
      color: '#2c3e50',
      padding: 12,
    },
    modalContent: {
      backgroundColor: theme.colors.border,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxWidth: 400,
      position: 'relative',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#007b8e',
      marginTop: 28,
      marginBottom: 18,
      textAlign: 'center',
    },
    actionButton: {
      backgroundColor: '#007B8E',
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 8,
      width: '100%',
    },
    modalSubtitle: {
      fontSize: 16,
      color: '#6c757d',
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ced4da',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
    },
    paymentTypeSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    typeButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#f8f9fa',
      marginHorizontal: 4,
      alignItems: 'center',
    },
    selectedTypeButton: {
      backgroundColor: '#119FB3',
    },
    typeButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#2c3e50',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cancelButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#6c757d',
      marginRight: 8,
      alignItems: 'center',
    },
    submitButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#119FB3',
      marginLeft: 8,
      alignItems: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    errorText: {
      fontSize: 16,
      color: '#e74c3c',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: '#119FB3',
      padding: 12,
      borderRadius: 8,
      minWidth: 120,
      alignItems: 'center',
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 15,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#007B8E',
      marginBottom: 16,
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    amountBox: {
      flex: 1,
      padding: 12,
      backgroundColor: theme.colors.border,
      borderRadius: 8,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    amountLabel: {
      fontSize: 14,
      color: '#6c757d',
      marginBottom: 4,
    },
    amountValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    addonsContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: theme.colors.border,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    addonsLabel: {
      fontSize: 14,
      color: '#6c757d',
    },
    addonsValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#119FB3',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#007B8E',
      marginBottom: 12,
    },
    sessionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    sessionItem: {
      width: '48%',
      backgroundColor: theme.colors.border,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    sessionLabel: {
      fontSize: 14,
      color: '#6c757d',
      marginBottom: 4,
    },
    sessionValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    paymentTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    paymentTypeLabel: {
      fontSize: 16,
      color: '#6c757d',
      marginRight: 8,
    },
    paymentTypeBadge: {
      backgroundColor: '#007B8E',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
    },
    paymentNumberContainer: {
      marginTop: 8,
    },
    paymentNumberLabel: {
      fontSize: 16,
      color: '#6c757d',
      marginBottom: 4,
    },
    paymentNumberText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#2c3e50',
    },
    paymentTypeText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    nextPaymentContainer: {
      marginRight: 8,
      flexDirection: 'row',
    },
    nextPaymentLabel: {
      fontSize: 16,
      color: '#6c757d',
      marginBottom: 4,
      marginRight: 5,
    },
    nextPaymentDate: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    paymentHistoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    paymentHistoryLeft: {
      flex: 1,
    },
    paymentHistoryRight: {
      alignItems: 'flex-end',
    },
    paymentHistorySession: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    paymentHistoryDate: {
      fontSize: 14,
      color: '#6c757d',
      marginTop: 2,
    },
    paymentHistoryAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#007B8E',
    },
    paymentHistoryType: {
      fontSize: 12,
      color: '#6c757d',
      marginTop: 2,
    },
    paymentHistoryContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    deleteButton: {
      padding: 10,
      marginLeft: 10,
    },
    deleteButtonText: {
      color: '#e74c3c',
      fontSize: 20,
      fontWeight: 'bold',
    },
  });
export default PaymentDetailsScreen;
