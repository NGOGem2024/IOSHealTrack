import React, {useState, useCallback, memo, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform,
  Appearance,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Doctor {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
}

interface DoctorPickerProps {
  doctors: Doctor[];
  selectedDoctorId: string;
  onDoctorSelect: (doctorId: string) => void;
  isLoading?: boolean;
}

const themeColors = {
  light: {
    background: '#f8f9fa',
    card: '#ffffff',
    primary: '#007B8E',
    text: '#333333',
    inputBg: '#F9FAFB',
    inputBorder: '#007B8E',
    placeholderText: '#9ca3af',
  },
  dark: {
    background: '#161c24',
    card: '#272d36',
    primary: '#007B8E',
    text: '#f3f4f6',
    inputBg: '#282d33',
    inputBorder: '#007B8E',
    placeholderText: '#9ca3af',
  },
};

const DoctorPicker = memo<DoctorPickerProps>(
  ({doctors, selectedDoctorId, onDoctorSelect, isLoading = false}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedDoctor = doctors.find(doc => doc._id === selectedDoctorId);

    // Theme handling
    const colorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

    useEffect(() => {
      const subscription = Appearance.addChangeListener(({colorScheme}) => {
        setIsDarkMode(colorScheme === 'dark');
      });
      return () => subscription.remove();
    }, []);

    const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

    const handleSelect = useCallback(
      (doctorId: string) => {
        onDoctorSelect(doctorId);
        setModalVisible(false);
      },
      [onDoctorSelect],
    );

    const renderDoctorItem = useCallback(
      ({item}: {item: Doctor}) => (
        <TouchableOpacity
          style={[
            styles.doctorItem,
            {backgroundColor: currentColors.card},
            item._id === selectedDoctorId && {
              backgroundColor: currentColors.inputBg,
              borderColor: currentColors.primary,
              borderWidth: 1,
            },
          ]}
          onPress={() => handleSelect(item._id)}>
          <View style={styles.doctorItemContent}>
            <View style={[styles.doctorAvatar, {backgroundColor: currentColors.primary}]}>
              <Text style={styles.avatarText}>
                {`${item.doctor_first_name[0]}${item.doctor_last_name[0]}`}
              </Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={[styles.doctorName, {color: currentColors.text}]}>
                {`${item.doctor_first_name} ${item.doctor_last_name}`}
              </Text>
              <Text style={[styles.doctorEmail, {color: currentColors.placeholderText}]}>
                {item.doctor_email}
              </Text>
            </View>
          </View>
          {item._id === selectedDoctorId && (
            <Icon name="check" size={24} color={currentColors.primary} />
          )}
        </TouchableOpacity>
      ),
      [selectedDoctorId, handleSelect, currentColors],
    );

    return (
      <View style={[styles.container, {borderColor: currentColors.primary}]}>
        <TouchableOpacity
          style={[
            styles.pickerButton,
            {backgroundColor: currentColors.inputBg},
          ]}
          onPress={() => setModalVisible(true)}
          disabled={isLoading}>
          <Icon name="person" size={24} color={currentColors.primary} />
          <Text style={[styles.selectedText, {color: currentColors.text}]}>
            {selectedDoctor
              ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
              : 'Select Doctor'}
          </Text>
          <Icon name="keyboard-arrow-down" size={24} color={currentColors.primary} />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}>
          <SafeAreaView style={[styles.modalContainer, {backgroundColor: currentColors.background}]}>
            <View style={[styles.modalHeader, {backgroundColor: currentColors.card, borderBottomColor: currentColors.inputBorder}]}>
              <Text style={[styles.modalTitle, {color: currentColors.text}]}>Select Doctor</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}>
                <Text style={[styles.closeButtonText, {color: currentColors.primary}]}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={doctors}
              renderItem={renderDoctorItem}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </SafeAreaView>
        </Modal>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    borderWidth: 1,
    borderRadius: 10,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  doctorItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  doctorEmail: {
    fontSize: 14,
  },
});

export default DoctorPicker;
