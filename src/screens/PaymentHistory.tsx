import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Appearance,
  useColorScheme,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../screens/ThemeContext';
import { getTheme } from '../screens/Theme';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab'; // Import the same header component used in ProfileScreen

interface TherapyPlan {
  plan_id: string;
  patient_name: string;
  therapy_name: string;
  received_amount: number;
  balance: number;
  completed_sessions: number;
  remaining_sessions: number;
  days_remaining: number;
  status: string;
}

interface PaymentHistoryResponse {
  message: string;
  plans: TherapyPlan[];
  total_plans: number;
}

// Define theme colors (same as ProfileScreen)
const themeColors = {
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    primary: '#007B8E',
    text: '#333333',
    secondary: '#666666',
    skeleton: '#E1E9EE',
    border: '#E0E0E0',
  },
  dark: {
    background: '#161c24',
    card: '#272d36',
    primary: '#007B8E',
    text: '#f3f4f6',
    secondary: '#cccccc',
    skeleton: '#3B3B3B',
    border: '#3d4654',
  },
};

const PaymentHistory: React.FC = () => {
  const { theme } = useTheme();
  const [plans, setPlans] = useState<TherapyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPlans, setTotalPlans] = useState(0);

  // Add theme detection (same as ProfileScreen)
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
    currentColors,
  );

  const fetchPaymentHistory = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await axiosInstance.get('/getplans/slimsessions'
      );

      if (response.status !== 200) {
        throw new Error('Failed to fetch payment history');
      }

      const data  =  response.data;
      setPlans(data.plans);
      setTotalPlans(data.total_plans);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      Alert.alert('Error', 'Failed to load payment history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentHistory();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return '#4CAF50';
      case 'payment_pending':
        return '#FF9800';
      case 'overdue':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'checkmark-circle';
      case 'payment_pending':
        return 'time';
      case 'overdue':
        return 'warning';
      default:
        return 'help-circle';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderPlanItem = ({ item }: { item: TherapyPlan }) => (
    <TouchableOpacity style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.patient_name}</Text>
          <Text style={styles.therapyName}>{item.therapy_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={12} 
            color="white" 
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>

      <View style={styles.planDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Received</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.received_amount)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Balance</Text>
            <Text style={[styles.detailValue, { color: item.balance > 0 ? '#F44336' : '#4CAF50' }]}>
              {formatCurrency(item.balance)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sessions</Text>
            <Text style={styles.detailValue}>
              {item.completed_sessions}/{item.completed_sessions + item.remaining_sessions}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Days Left</Text>
            <Text style={styles.detailValue}>{item.days_remaining} days</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Session Progress</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(item.completed_sessions / (item.completed_sessions + item.remaining_sessions)) * 100}%` 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {item.completed_sessions} of {item.completed_sessions + item.remaining_sessions} completed
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: currentColors.background}]}>
        <StatusBar
          backgroundColor={currentColors.background}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <BackTabTop screenName="Payment History" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentColors.primary} />
          <Text style={[styles.loadingText, {color: currentColors.text}]}>Loading payment history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: currentColors.background}]}>
      <StatusBar
        backgroundColor={currentColors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <BackTabTop screenName="Payment History" />
      
      <View style={[styles.header, {backgroundColor: currentColors.card}]}>
        <Text style={[styles.headerTitle, {color: currentColors.text}]}>Payment History</Text>
        <Text style={[styles.headerSubtitle, {color: currentColors.secondary}]}>Total Plans: {totalPlans}</Text>
      </View>

      <FlatList
        data={plans}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.plan_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentColors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={currentColors.secondary} />
            <Text style={[styles.emptyText, {color: currentColors.secondary}]}>No payment history found</Text>
            <TouchableOpacity style={[styles.refreshButton, {backgroundColor: currentColors.primary}]} onPress={onRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>, currentColors: any) =>
  StyleSheet.create({
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
      fontSize: 16,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: currentColors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 100,
    },
    planCard: {
      backgroundColor: currentColors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    patientInfo: {
      flex: 1,
    },
    patientName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.text,
      marginBottom: 2,
    },
    therapyName: {
      fontSize: 14,
      color: currentColors.secondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusIcon: {
      marginRight: 4,
    },
    statusText: {
      fontSize: 10,
      color: 'white',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    planDetails: {
      marginBottom: 16,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailItem: {
      flex: 1,
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 12,
      color: currentColors.secondary,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentColors.text,
    },
    progressContainer: {
      marginTop: 8,
    },
    progressLabel: {
      fontSize: 12,
      color: currentColors.secondary,
      marginBottom: 4,
    },
    progressBar: {
      height: 6,
      backgroundColor: currentColors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      backgroundColor: currentColors.primary,
      borderRadius: 3,
    },
    progressText: {
      fontSize: 10,
      color: currentColors.secondary,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyText: {
      fontSize: 16,
      marginTop: 16,
      marginBottom: 20,
    },
    refreshButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    refreshButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

  export default PaymentHistory;