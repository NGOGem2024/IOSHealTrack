import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSession} from '../context/SessionContext';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import axiosInstance from '../utils/axiosConfig';
import axios from 'axios';

interface NotificationCount {
  unread: number;
  read: number;
  archived: number;
  total: number;
}

interface NotificationResponse {
  success: boolean;
  data: NotificationCount;
}

const DashboardHeader: React.FC = () => {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {session} = useSession();
  const {width} = useWindowDimensions();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState<NotificationCount>({
    unread: 0,
    read: 0,
    archived: 0,
    total: 0,
  });
  const [notificationLoading, setNotificationLoading] = useState(false);

  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
    insets,
  );

  // Fetch notification count
  const fetchNotificationCount = async () => {
    if (!session.idToken) return;
    setNotificationLoading(true);
    try {
      const notificationResponse = await axiosInstance.get(
        `/notification/count`,
        {
          headers: {Authorization: `Bearer ${session.idToken}`},
        },
      );
      
      if (notificationResponse.data.success) {
        setNotificationCount(notificationResponse.data.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setNotificationCount({
          unread: 0,
          read: 0,
          archived: 0,
          total: 0,
        });
      } else {
        console.error('Error fetching notification count:', error);
        // You can add handleError(error) here if you have a global error handler
      }
    } finally {
      setNotificationLoading(false);
    }
  };

  // Fetch notifications on component mount and set up interval
  useEffect(() => {
    fetchNotificationCount();
    
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = () => {
    setDropdownVisible(prev => !prev);
  };

  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName as never);
    setDropdownVisible(false);
  };

  const handleNotificationPress = () => {
    // Navigate to NotificationsScreen instead of showing modal
    navigation.navigate('NotificationsScreen' as never);
  };

  return (
    <View style={{zIndex: 1000}}>
      <View style={{backgroundColor: 'black', height: insets.top}} />
      <View style={styles.dashboardHeader}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="black"
          translucent={Platform.OS === 'android'}
        />
        <View>
          <Image
            source={require('../assets/healtrack_logo1.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.versionText}>v0.7</Text>
        </View>
        
        <View style={styles.headerActions}>
          {/* Notification Bell Icon */}
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {notificationCount.unread > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount.unread > 99 ? '99+' : notificationCount.unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Menu Button */}
          <TouchableOpacity style={styles.profileButton} onPress={toggleDropdown}>
            <Ionicons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Menu Dropdown Modal */}
        <Modal
          isVisible={isDropdownVisible}
          onBackdropPress={toggleDropdown}
          animationIn="slideInRight"
          animationOut="slideOutRight"
          animationInTiming={300}
          animationOutTiming={300}
          backdropTransitionInTiming={300}
          backdropTransitionOutTiming={300}
          style={styles.modal}
          propagateSwipe={true}
          backdropOpacity={0.5}>
          <View style={[styles.dropdown, {width: width * 0.5}]}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity onPress={toggleDropdown}>
                <Ionicons name="close" size={24} color="#007B8E" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerDivider} />

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => navigateToScreen('AllPatients')}>
              <Ionicons name="people-outline" size={24} color="#007B8E" />
              <Text style={styles.drawerItemText}>All Patients</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => navigateToScreen('DoctorDashboard')}>
              <Ionicons name="grid-outline" size={24} color="#007B8E" />
              <Text style={styles.drawerItemText}>Dashboard</Text>
            </TouchableOpacity>

            {session.is_admin && (
              <>
                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => navigateToScreen('Settings')}>
                  <Ionicons name="settings-outline" size={24} color="#007B8E" />
                  <Text style={styles.drawerItemText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => navigateToScreen('AdminReport')}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color="#007B8E"
                  />
                  <Text style={styles.drawerItemText}>Reports</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => navigateToScreen('PaymentHistory')}>
                  <Ionicons name="card-outline" size={24} color="#007B8E" />
                  <Text style={styles.drawerItemText}>Payment History</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.drawerDivider} />

            <TouchableOpacity
              style={[styles.drawerItem, styles.logoutItem]}
              onPress={() => navigateToScreen('Logout')}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              <Text style={[styles.drawerItemText, styles.logoutText]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>, insets: any) =>
  StyleSheet.create({
    modal: {
      margin: 0,
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: Platform.OS === 'ios' ? insets.top : 0,
    },
    dropdown: {
      backgroundColor: theme.colors.card,
      maxHeight: 400, // Increased height to accommodate new menu item
      minHeight: 50,
      padding: 0,
      shadowColor: '#000',
      shadowOffset: {
        width: -2,
        height: 0,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: theme.colors.card,
    },
    drawerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#007B8E',
    },
    drawerDivider: {
      height: 1,
      backgroundColor: '#E0E0E0',
      marginVertical: 2,
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    drawerItemText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 16,
    },
    logoutItem: {
      marginTop: 5,
      marginBottom: 2,
    },
    logoutText: {
      color: '#FF3B30',
    },
    dashboardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 15,
      backgroundColor: '#007B8E',
      borderBottomWidth: 1,
      borderBottomColor: 'white',
      borderTopColor: 'white',
      borderTopWidth: 1,
    },
    logoImage: {
      width: 110,
      height: 35,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationButton: {
      marginRight: 15,
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    profileButton: {
      alignItems: 'flex-end',
    },
    versionText: {
      position: 'absolute',
      bottom: 1,
      right: -12,
      color: '#FFFFFF',
      fontSize: 10,
      opacity: 0.8,
      fontWeight: 'bold',
    },
  });

export default DashboardHeader;