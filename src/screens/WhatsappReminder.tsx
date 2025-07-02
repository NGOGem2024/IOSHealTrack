import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';

interface WhatsAppReminderProps {
  sessionId: string;
  patientName?: string;
  isDarkMode?: boolean;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

const WhatsAppReminderButton: React.FC<WhatsAppReminderProps> = ({
  sessionId,
  patientName = 'Patient',
  isDarkMode = false,
  size = 'medium',
  disabled = false,
  onSuccess,
  onError,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const styles = getStyles(isDarkMode, size);

  const sendWhatsAppReminder = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/send/whatsapp/reminder', {
        sessionId: sessionId,
      });

      if (response.status === 200) {
        Alert.alert(
          'Success',
          `WhatsApp reminder sent successfully to ${patientName}!`,
          [{text: 'OK', onPress: () => setIsModalVisible(false)}],
        );
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error sending WhatsApp reminder:', error);
      handleError(error);
      Alert.alert(
        'Error',
        'Failed to send WhatsApp reminder. Please try again.',
        [{text: 'OK'}],
      );
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    setIsModalVisible(false);
    sendWhatsAppReminder();
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.reminderButton, disabled && styles.disabledButton]}
        onPress={() => setIsModalVisible(true)}
        disabled={disabled || isLoading}
        activeOpacity={0.7}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Icon name="logo-whatsapp" size={getIconSize()} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon
                name="logo-whatsapp"
                size={32}
                color="#25D366"
                style={styles.modalIcon}
              />
              <Text style={styles.modalTitle}>Send WhatsApp Reminder</Text>
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to send a WhatsApp reminder to{' '}
              <Text style={styles.patientName}>{patientName}</Text>?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirm}>
                <Icon name="send" size={16} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Send Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const getStyles = (isDarkMode: boolean, size: 'small' | 'medium' | 'large') => {
  const buttonSize = size === 'small' ? 32 : size === 'large' ? 44 : 38;

  return StyleSheet.create({
    reminderButton: {
      width: buttonSize,
      height: buttonSize,
      backgroundColor: '#25D366', // WhatsApp green
      borderRadius: buttonSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
    disabledButton: {
      backgroundColor: '#A0A0A0',
      elevation: 0,
      shadowOpacity: 0,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 350,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    modalHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    modalIcon: {
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#2C3E50',
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 16,
      color: isDarkMode ? '#B0B0B0' : '#555555',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    patientName: {
      fontWeight: 'bold',
      color: isDarkMode ? '#4DD0E1' : '#119FB3',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    cancelButton: {
      backgroundColor: isDarkMode ? '#404040' : '#E0E0E0',
    },
    confirmButton: {
      backgroundColor: '#25D366',
    },
    cancelButtonText: {
      color: isDarkMode ? '#FFFFFF' : '#666666',
      fontSize: 16,
      fontWeight: '600',
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });
};

export default WhatsAppReminderButton;
