import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
  Animated,
  Linking, // Add this import
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSession} from '../context/SessionContext';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import axiosInstance from '../utils/axiosConfig';
import axios from 'axios';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import BackTabTop from './BackTopTab';

interface NotificationMetadata {
  subscription_plan?: string;
  days_remaining?: number;
  expiry_date?: string;
  auto_renew?: boolean;
  billing_cycle?: string;
  [key: string]: any;
}
interface InfoCardProps {
  icon: string;
  label: string;
  value: string;
  color?: string;
}

interface NotificationDetail {
  _id: string;
  tenant_id: string;
  organization_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high'| 'critical';
  status: 'read' | 'unread';
  category: string;
  metadata: NotificationMetadata;
  recipient: string;
  is_global: boolean;
  action_required: boolean;
  action_url?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface NotificationDetailResponse {
  success: boolean;
  data: NotificationDetail;
}

type NotificationDetailScreenProps = StackScreenProps<RootStackParamList, 'NotificationDetailScreen'>;

const NotificationDetailScreen: React.FC<NotificationDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const {notificationId} = route.params;
  const {theme} = useTheme();
  const {session} = useSession();
  const {width, height} = useWindowDimensions();
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
    width,
    height,
  );

  // Fetch notification details
  const fetchNotificationDetail = async () => {
    if (!session.idToken) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.get<NotificationDetailResponse>(
        `/notification/${notificationId}`,
        {
          headers: {Authorization: `Bearer ${session.idToken}`},
        },
      );
      
      if (response.data.success) {
        setNotification(response.data.data);
        // Animate content in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching notification details:', error);
        Alert.alert(
          'Error',
          'Failed to fetch notification details. Please try again.',
          [
            {text: 'Go Back', onPress: () => navigation.goBack()},
            {text: 'Retry', onPress: fetchNotificationDetail},
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleActionPress = async () => {
    const targetUrl = 'https://doctor.healtrackai.com/payment';
    
    Alert.alert(
      'Open Payment Page',
      'This will open the payment page in your browser.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Continue',
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(targetUrl);
              if (supported) {
                await Linking.openURL(targetUrl);
              } else {
                Alert.alert('Error', 'Unable to open the payment link.');
              }
            } catch (error) {
              console.error('Error opening URL:', error);
              Alert.alert('Error', 'Unable to open the payment link.');
            }
          },
        },
      ]
    );
  };
  

  // Get priority configuration
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          color: '#FF6B6B',
          bgColor: 'rgba(255, 107, 107, 0.15)',
          icon: 'warning',
          label: 'High Priority'
        };
      case 'medium':
        return {
          color: '#FFB946',
          bgColor: 'rgba(255, 185, 70, 0.15)',
          icon: 'alert-circle',
          label: 'Medium Priority'
        };
      case 'low':
        return {
          color: '#51CF66',
          bgColor: 'rgba(81, 207, 102, 0.15)',
          icon: 'information-circle',
          label: 'Low Priority'
        };
         case 'critical':
        return {
          color: '#ffffff',
          bgColor: 'rgba(255, 0, 0, 0.68)',
          icon: 'information-circle',
          label: 'Critical Priority'
        };
      default:
        return {
          color: '#4DABF7',
          bgColor: 'rgba(77, 171, 247, 0.15)',
          icon: 'information-circle',
          label: 'Normal Priority'
        };
    }
  };

  // Format date with relative time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    let relative = '';
    if (diffDays > 0) {
      relative = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      relative = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      relative = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      relative = 'Just now';
    }

    return {
      formatted: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      relative,
    };
  };

  // Get category configuration
const getCategoryConfig = (category: string) => {
  const configs: Record<string, { icon: string; color: string; bg: string }> = {
    subscription: { icon: 'card-outline', color: '#007B8E', bg: '##c7f8ff' },
    security: { icon: 'shield-checkmark-outline', color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)' },
    system: { icon: 'settings-outline', color: '#4DABF7', bg: 'rgba(77, 171, 247, 0.1)' },
    billing: { icon: 'receipt-outline', color: '#51CF66', bg: 'rgba(81, 207, 102, 0.1)' },
    update: { icon: 'download-outline', color: '#FFB946', bg: 'rgba(255, 185, 70, 0.1)' },
    default: { icon: 'notifications-outline', color: '#6C757D', bg: 'rgba(108, 117, 125, 0.1)' }
  };

  return configs[category.toLowerCase()] || configs.default;
};


  // Render info card
const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, color = '#6C757D' }) => (
  <View style={styles.infoCard}>
    <View style={[styles.infoIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

  // Render metadata
  const renderMetadata = () => {
    if (!notification?.metadata || Object.keys(notification.metadata).length === 0) {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={20} color="#007b8e" />
          <Text style={styles.cardTitle}>Additional Details</Text>
        </View>
        <View style={styles.metadataGrid}>
          {Object.entries(notification.metadata).map(([key, value]) => {
            if (value === null || value === undefined) return null;
            
            let displayValue = value;
            if (key.includes('date') && typeof value === 'string') {
              const dateTime = formatDateTime(value);
              displayValue = dateTime.formatted;
            } else if (typeof value === 'boolean') {
              displayValue = value ? 'Yes' : 'No';
            }

            return (
              <View key={key} style={styles.metadataItem}>
                <Text style={styles.metadataKey}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text style={styles.metadataValue}>{String(displayValue)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  useEffect(() => {
    fetchNotificationDetail();
  }, [notificationId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#845EC2" translucent={false} />
        <BackTabTop screenName="Notification" />
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007b8e" />
            <Text style={styles.loadingText}>Loading notification...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!notification) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#845EC2" translucent={false} />
        <BackTabTop screenName="Notification" />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Ionicons name="document-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyTitle}>Notification Not Found</Text>
            <Text style={styles.emptyMessage}>
              This notification may have been removed or doesn't exist.
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.emptyButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const priorityConfig = getPriorityConfig(notification.priority);
  const categoryConfig = getCategoryConfig(notification.category);
  const createdDateTime = formatDateTime(notification.created_at);
  const expiresDateTime = formatDateTime(notification.expires_at);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#845EC2" translucent={false} />
      <BackTabTop screenName="Notification Details" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.bg }]}>
                <Ionicons name={categoryConfig.icon} size={16} color={categoryConfig.color} />
                <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
                  {notification.category}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bgColor }]}>
                <Ionicons name={priorityConfig.icon} size={14} color={priorityConfig.color} />
                <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                  {priorityConfig.label}
                </Text>
              </View>
            </View>
            
            <Text style={styles.heroTitle}>{notification.title}</Text>
            <Text style={styles.heroTimestamp}>{createdDateTime.relative}</Text>
          </View>

          {/* Message Card */}
          <View style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <Ionicons name="chatbubble-outline" size={20} color="#007b8e" />
              <Text style={styles.messageTitle}>Message</Text>
            </View>
            <Text style={styles.messageText}>{notification.message}</Text>
          </View>
          
          {/* Metadata */}
          {renderMetadata()}

          {/* Quick Info Cards */}
          <View style={styles.quickInfoGrid}>
            <InfoCard
              icon="person-outline"
              label="Recipient"
              value={notification.recipient}
              color="#4DABF7"
            />
            <InfoCard
              icon={notification.status === 'read' ? 'checkmark-circle-outline' : 'radio-button-off-outline'}
              label="Status"
              value={notification.status === 'read' ? 'Read' : 'Unread'}
              color={notification.status === 'read' ? '#51CF66' : '#FFB946'}
            />
            <InfoCard
              icon="globe-outline"
              label="Scope"
              value={notification.is_global ? 'Global' : 'Personal'}
              color="#845EC2"
            />
            <InfoCard
              icon="layers-outline"
              label="Type"
              value={notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              color="#6C757D"
            />
          </View>

          {/* Action Button */}
          {notification.action_required && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleActionPress}
              activeOpacity={0.8}
            >
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonText}>Subscribe</Text>
                 <View style={styles.actionIconContainer}>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>, width: number, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.inputBox,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingCard: {
      backgroundColor: '#FFFFFF',
      padding: 40,
      borderRadius: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#6C757D',
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyCard: {
      backgroundColor: '#FFFFFF',
      padding: 40,
      borderRadius: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      maxWidth: 300,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#343A40',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 16,
      color: '#6C757D',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    emptyButton: {
      backgroundColor: '#845EC2',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    emptyButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    heroSection: {
      backgroundColor: theme.colors.card,
      padding: 24,
      borderRadius: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    },
    categoryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 12,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      lineHeight: 32,
      marginBottom: 8,
    },
    heroTimestamp: {
      fontSize: 14,
      color: '#6C757D',
      fontWeight: '500',
    },
    messageCard: {
      backgroundColor: theme.colors.card,
      padding: 20,
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    messageTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    messageText: {
      fontSize: 16,
      color: theme.colors.text1,
      lineHeight: 24,
      fontWeight: '400',
    },
    quickInfoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
      marginBottom: 16,
    },
    infoCard: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      margin: 6,
      flex: 1,
      minWidth: (width - 64) / 2,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '500',
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.text1,
      fontWeight: '600',
    },
    card: {
      backgroundColor: theme.colors.card,
      padding: 20,
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginLeft: 8,
    },
    timelineContainer: {
      position: 'relative',
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 16,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 16,
    },
    timelineLine: {
      position: 'absolute',
      left: 5.5,
      top: 28,
      width: 1,
      height: 20,
      backgroundColor: '#DEE2E6',
    },
    timelineContent: {
      flex: 1,
    },
    timelineLabel: {
      fontSize: 12,
      color: '#6C757D',
      fontWeight: '500',
      marginBottom: 2,
    },
    timelineValue: {
      fontSize: 14,
      color: '#212529',
      fontWeight: '600',
    },
    metadataGrid: {
      gap: 12,
    },
    metadataItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F3F4',
    },
    metadataKey: {
      fontSize: 14,
      color: '#6C757D',
      fontWeight: '500',
      flex: 1,
    },
    metadataValue: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '600',
      textAlign: 'right',
      flex: 1,
    },
    actionButton: {
  backgroundColor: '#007b8e',
  borderRadius: 16,
  marginTop: 8,
},
actionButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center', // Center the content horizontally
  padding: 15,
},
actionIconContainer: {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  width: 25,
  height: 25,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 8, 
},
actionButtonText: {
  fontSize: 18,
  fontWeight: '700',
  color: '#FFFFFF',
  
},
    actionButtonSubtext: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
    },
  });

export default NotificationDetailScreen;