import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScaledSize,
  StatusBar,
  Animated,
  ScrollView,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useSession} from '../context/SessionContext';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import axiosInstance from '../utils/axiosConfig';
import axios from 'axios';
import BackTabTop from './BackTopTab';

interface Props {
  navigation: NavigationProp<ParamListBase>;
}

interface NotificationMetadata {
  subscription_plan?: string;
  days_remaining?: number;
  expiry_date?: string;
  auto_renew?: boolean;
  billing_cycle?: string;
  [key: string]: any;
}

interface Notification {
  _id: string;
  tenant_id: string;
  organization_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
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

interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: Pagination;
  };
}


// Notification card skeleton componen
const NotificationsScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const {session} = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterOption, setFilterOption] = useState('all');
  const [sortOption, setSortOption] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc'); // Changed from 'asc' to 'desc'
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(
    Dimensions.get('window'),
  );
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_prev: false,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const updateDimensions = ({window}: {window: ScaledSize}) => {
      setScreenDimensions(window);
    };

    const subscription = Dimensions.addEventListener(
      'change',
      updateDimensions,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Effect to fetch notifications when filters or sorting changes
  useEffect(() => {
    if (session.idToken) {
      fetchNotifications(1, true);
    }
  }, [session, filterOption, sortOption]);

  // Build query parameters based on current filters and sorting
  const buildQueryParams = (page: number = 1) => {
    const params = new URLSearchParams();

    params.append('page', page.toString());
    params.append('limit', '20');

    if (filterOption === 'all') {
      params.append('status', 'all');
    } else if (filterOption === 'unread' || filterOption === 'read') {
      params.append('status', filterOption);
    } else if (filterOption.includes('_priority')) {
      params.append('status', 'all');
      const priority = filterOption.replace('_priority', '');
      params.append('priority', priority);
    }

    // Always sort by created_at in descending order to show latest first
    params.append('sort', 'created_at');
    params.append('order', 'desc');

    // Debug log to see what parameters are being sent

    return params.toString();
  };

  // Fetch notifications
  const fetchNotifications = async (
    page: number = 1,
    reset: boolean = false,
  ) => {
    if (!session.idToken) return;

    try {
      if (page === 1 || reset) {
        setIsLoading(true);
      }

      const queryParams = buildQueryParams(page);
      
      const response = await axiosInstance.get<NotificationsResponse>(
        `/notification?${queryParams}`,
        {
          headers: {Authorization: `Bearer ${session.idToken}`},
        },
      );

      if (response.data.success) {
        let notificationsData = response.data.data.notifications;
        
        // Client-side sorting as fallback - sort by created_at descending
        notificationsData = notificationsData.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        if (page === 1 || reset) {
          setNotifications(notificationsData);
        } else {
          setNotifications(prev => [...prev, ...notificationsData]);
        }
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setNotifications([]);
          setPagination({
            current_page: 1,
            total_pages: 1,
            total_count: 0,
            has_next: false,
            has_prev: false,
          });
        } 
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (pagination.has_next && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchNotifications(pagination.current_page + 1);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    navigation.navigate('NotificationDetailScreen', {
      notificationId: notification._id,
    });
  };

  // Get priority color and icon
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {color: '#007b8e', icon: 'notifications', bgColor: '#e3f7fa'};
      case 'medium':
        return {color: '#FFB020', icon: 'warning', bgColor: '#FFF4E6'};
      case 'low':
        return {
          color: '#4ECDC4',
          icon: 'information-circle',
          bgColor: '#E6F9F7',
        };
      default:
        return {color: '#FF6B6B', icon: 'alert-circle', bgColor: '#FFE5E5'};
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'system':
        return 'settings';
      case 'billing':
        return 'card';
      case 'security':
        return 'shield-checkmark';
      case 'updates':
        return 'download';
      default:
        return 'notifications';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNotifications(1, true);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [filterOption, sortOption]);

  const renderFooter = () => {
    if (!pagination.has_next) return null;

    return (
      <TouchableOpacity
        onPress={loadMore}
        style={styles.loadMoreButton}
        disabled={isLoadingMore}>
        {isLoadingMore ? (
          <>
            <ActivityIndicator size="small" color="#007b8e" />
            <Text style={styles.loadMoreText}>Loading more...</Text>
          </>
        ) : (
          <>
            <Ionicons name="chevron-down" size={16} color="#6C5CE7" />
            <Text style={styles.loadMoreText}>Load More</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render notification item with new design
  const renderNotificationItem = ({item}: {item: Notification}) => {
    const priorityConfig = getPriorityConfig(item.priority);

    return (
      <TouchableOpacity
        style={[
          styles.modernNotificationCard,
          item.status === 'unread' && styles.unreadCard,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}>
        {/* Priority indicator */}
        <View
          style={[
            styles.priorityIndicator,
            {backgroundColor: priorityConfig.color},
          ]}
        />

        {/* Main content */}
        <View style={styles.cardContent}>
          {/* Header with icon and timestamp */}
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconContainer,
                {backgroundColor: priorityConfig.bgColor},
              ]}>
              <Ionicons
                name={getCategoryIcon(item.category)}
                size={20}
                color={priorityConfig.color}
              />
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.timestamp}>
                {formatDate(item.created_at)}
              </Text>
              {item.status === 'unread' && <View style={styles.unreadDot} />}
            </View>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.modernTitle,
              item.status === 'unread' && styles.unreadTitle,
            ]}
            numberOfLines={2}>
            {item.title}
          </Text>

          {/* Message */}
          <Text style={styles.modernMessage} numberOfLines={3}>
            {item.message}
          </Text>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View
              style={[
                styles.categoryChip,
                {backgroundColor: priorityConfig.bgColor},
              ]}>
              <Text
                style={[
                  styles.categoryChipText,
                  {color: priorityConfig.color},
                ]}>
                {item.category}
              </Text>
            </View>

            {item.action_required && (
              <View style={styles.actionRequiredBadge}>
                <Ionicons name="chevron-forward" size={12} color="#FFF" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.modernEmptyState}>
      <View style={styles.emptyStateIconContainer}>
        <Ionicons name="notifications-off" size={64} color="#DDD6FE" />
      </View>
      <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
      <Text style={styles.emptyStateMessage}>
        No new notifications to show. You're up to date with everything.
      </Text>
    </View>
  );

  if (isLoading && pagination.current_page === 1) {
    return (
      <View style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="black"
          translucent={false}
        />
        <BackTabTop screenName="Notifications" />
        <View style={styles.modernContainer}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonStats} />
             <View style={styles.skeletonStats} />
              <View style={styles.skeletonStats} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />

      <BackTabTop screenName="Notifications" />

      <View style={styles.modernContainer}>
        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderNotificationItem}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007b8e']}
              tintColor="#6C5CE7"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.modernListContainer,
            notifications.length === 0 && styles.emptyListContainer,
          ]}
        />
      </View>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    modernContainer: {
      flex: 1,
      backgroundColor: theme.colors.inputBox,
      paddingHorizontal: 16,
      paddingTop: 20,
    },

    // Header Stats
    headerStats: {
      flexDirection: 'row',
      backgroundColor: '#F8F9FA',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#2D3748',
    },
    statLabel: {
      fontSize: 12,
      color: '#718096',
      marginTop: 2,
      fontWeight: '500',
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: '#E2E8F0',
      marginHorizontal: 16,
    },

    // Category Tabs
    categoryTabsContainer: {
      marginBottom: 16,
    },
    categoryTabsContent: {
      paddingHorizontal: 4,
    },
    categoryTab: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: '#F7FAFC',
      marginRight: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    activeCategoryTab: {
      backgroundColor: '#6C5CE7',
      borderColor: '#6C5CE7',
    },
    categoryTabText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#4A5568',
    },
    activeCategoryTabText: {
      color: '#FFFFFF',
    },

    // Filters
    modernFiltersContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 12,
    },
    modernFilterItem: {
      flex: 1,
      backgroundColor: '#F7FAFC',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },

    // Notification Cards
    modernNotificationCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    unreadCard: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.mainColor,
    },
    priorityIndicator: {
      width: 4,
    },
    cardContent: {
      flex: 1,
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timestamp: {
      fontSize: 12,
      color: '#718096',
      fontWeight: '500',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF6B6B',
      marginLeft: 8,
    },
    modernTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      lineHeight: 22,
    },
    unreadTitle: {
      fontWeight: '700',
      color: theme.colors.text,
    },
    modernMessage: {
      fontSize: 14,
      color: theme.colors.text1,
      lineHeight: 20,
      marginBottom: 16,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    categoryChipText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    actionRequiredBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#007b8e',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // List
    modernListContainer: {
      paddingBottom: 20,
    },
    emptyListContainer: {
      flex: 1,
    },

    // Empty State
    modernEmptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#F7FAFC',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    emptyStateTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#2D3748',
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 16,
      color: '#718096',
      textAlign: 'center',
      lineHeight: 24,
    },

    // Load More
    loadMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F7FAFC',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    loadMoreText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6C5CE7',
      marginLeft: 8,
    },

    // Skeleton Styles
    skeletonHeader: {
      marginBottom: 20,
    },
    skeletonStats: {
      height: '30%',
      backgroundColor: 'rgba(180, 180, 180, 0.3)',
      borderRadius: 16,
      marginBottom: 16,
    },
    skeletonTabs: {
      height: 36,
      backgroundColor: 'rgba(180, 180, 180, 0.3)',
      borderRadius: 20,
      marginBottom: 16,
    },
    skeletonFilters: {
      height: 44,
      backgroundColor: 'rgba(180, 180, 180, 0.3)',
      borderRadius: 12,
      marginBottom: 20,
    },
    skeletonCard: {
      flexDirection: 'row',
      backgroundColor: 'rgba(180, 180, 180, 0.3)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
    },
    skeletonAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      marginRight: 12,
    },
    skeletonContent: {
      flex: 1,
    },
    skeletonTitle: {
      height: 16,
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      borderRadius: 8,
      marginBottom: 8,
    },
    skeletonMessage: {
      height: 12,
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      borderRadius: 6,
      marginBottom: 12,
      width: '80%',
    },
    skeletonFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    skeletonTag: {
      width: 60,
      height: 20,
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      borderRadius: 10,
    },
    skeletonDate: {
      width: 40,
      height: 12,
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      borderRadius: 6,
    },
  });

export default NotificationsScreen;