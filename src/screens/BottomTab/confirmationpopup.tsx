import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type ConfirmationPopupProps = {
  visible: boolean;
  onClose: () => void;
  appointmentDetails: {
    date: string;
    time: string;
    type: string;
    doctor: string;
    plan: string;
  };
};

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  visible,
  onClose,
  appointmentDetails,
}) => {
  const {colors} = useTheme();
  const styles = createStyles(colors);

  const DetailItem = ({icon, text}: {icon: string; text: string}) => (
    <View style={styles.detailItem}>
      <Icon name={icon} size={24} color="#119FB3" style={styles.detailIcon} />
      <Text style={[styles.detailText, {color: colors.text}]}>{text}</Text>
    </View>
  );

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Icon name="check-circle" size={60} color="#119FB3" />
          <Text style={styles.title}>Appointment Booked!</Text>
          <View style={styles.detailsContainer}>
            <DetailItem icon="event" text={appointmentDetails.date} />
            <DetailItem icon="access-time" text={appointmentDetails.time} />
            <DetailItem icon="local-hospital" text={appointmentDetails.type} />
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: {
  primary?: string;
  background?: string;
  card: any;
  text: any;
  border?: string;
  notification?: string;
}) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      width: '80%',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
      marginBottom: 24,
    },
    detailsContainer: {
      width: '100%',
      marginBottom: 24,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    detailIcon: {
      marginRight: 12,
    },
    detailText: {
      fontSize: 16,
    },
    closeButton: {
      // backgroundColor: colors.primary,
      backgroundColor: '#119FB3',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    closeButtonText: {
      color: colors.card,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default ConfirmationPopup;
