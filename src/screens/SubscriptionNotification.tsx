import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from './ThemeContext';
import { getTheme } from './Theme';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

interface SubscriptionNotificationProps {
  expirationDate: Date | null; // Date when subscription ends
}

const SubscriptionNotification: React.FC<SubscriptionNotificationProps> = ({
  expirationDate,
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!expirationDate) return;

    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if subscription has ended or will end soon
    if (diffDays <= 0) {
      setMessage('Your subscription has ended. Please renew to continue using the service.');
      setIsExpired(true);
      setVisible(true);
    } else if (diffDays <= 3) {
      setMessage(`Your subscription will end in ${diffDays} day${diffDays > 1 ? 's' : ''}. Please extend your subscription.`);
      setIsExpired(false);
      setVisible(true);
    } else {
      setVisible(false);
    }

    // Animate notification appearance
    if (diffDays <= 3) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [expirationDate]);

  const dismissNotification = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  const openPaymentPage = async () => {
    const url = 'https://doctor.healtrackai.com/payment';
    
    // Check if InAppBrowser is available
    if (await InAppBrowser.isAvailable()) {
      try {
        // Open the payment URL in the in-app browser
        const result = await InAppBrowser.open(url, {
          // Browser configuration options
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: theme.name === 'dark' ? '#222222' : '#FFFFFF',
          preferredControlTintColor: theme.name === 'dark' ? '#FFFFFF' : '#007B8E',
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          // iOS only
          readerMode: false,
          // Android only
          showTitle: true,
          toolbarColor: theme.name === 'dark' ? '#222222' : '#FFFFFF',
          secondaryToolbarColor: theme.name === 'dark' ? '#3B3B3B' : '#F3F3F3',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
        });
        console.log('Browser closed with result:', result);
      } catch (error) {
        console.error('Error opening in-app browser:', error);
        // Fallback to external browser if in-app browser fails
        Linking.openURL(url);
      }
    } else {
      // If in-app browser is not available, use the default browser
      Linking.openURL(url);
    }
    
    // Dismiss the notification after opening the payment page
    dismissNotification();
  };

  const handleRenewPress = () => {
    openPaymentPage();
  };

  if (!visible) return null;

  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.4}
      animationIn="slideInDown"
      animationOut="slideOutUp"
      style={styles.modalContainer}>
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim },
          isExpired ? styles.expiredContainer : styles.warningContainer,
        ]}>
        <View style={styles.contentContainer}>
          <Ionicons
            name={isExpired ? 'alert-circle' : 'time-outline'}
            size={24}
            color={isExpired ? '#FFFFFF' : '#FFFFFF'}
            style={styles.icon}
          />
          <Text style={styles.message}>{message}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={dismissNotification}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.renewButton}
            onPress={handleRenewPress}>
            <Text style={styles.renewText}>
              {isExpired ? 'Renew Now' : 'Extend'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    modalContainer: {
      margin: 0,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    container: {
      width: '90%',
      borderRadius: 10,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      marginTop: 10,
    },
    warningContainer: {
      backgroundColor: '#FFA500',
    },
    expiredContainer: {
      backgroundColor: '#FF3B30',
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    icon: {
      marginRight: 10,
    },
    message: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '500',
      flex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 5,
    },
    dismissButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 5,
      marginRight: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    dismissText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    renewButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 5,
      backgroundColor: '#FFFFFF',
    },
    renewText: {
      color: '#007B8E',
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default SubscriptionNotification;