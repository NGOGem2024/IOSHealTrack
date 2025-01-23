import React, {useState, useCallback, memo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform,
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

const DoctorPicker = memo<DoctorPickerProps>(
  ({doctors, selectedDoctorId, onDoctorSelect, isLoading = false}) => {
    const [modalVisible, setModalVisible] = useState(false);

    const selectedDoctor = doctors.find(doc => doc._id === selectedDoctorId);

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
            item._id === selectedDoctorId && styles.selectedDoctorItem,
          ]}
          onPress={() => handleSelect(item._id)}>
          <View style={styles.doctorItemContent}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.avatarText}>
                {`${item.doctor_first_name[0]}${item.doctor_last_name[0]}`}
              </Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>
                {`${item.doctor_first_name} ${item.doctor_last_name}`}
              </Text>
              <Text style={styles.doctorEmail}>{item.doctor_email}</Text>
            </View>
          </View>
          {item._id === selectedDoctorId && (
            <Icon name="check" size={24} color="#119FB3" />
          )}
        </TouchableOpacity>
      ),
      [selectedDoctorId, handleSelect],
    );

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setModalVisible(true)}
          disabled={isLoading}>
          <Icon name="person" size={24} color="#119FB3" />
          <Text style={styles.selectedText}>
            {selectedDoctor
              ? `${selectedDoctor.doctor_first_name} ${selectedDoctor.doctor_last_name}`
              : 'Select Doctor'}
          </Text>
          <Icon name="keyboard-arrow-down" size={24} color="#119FB3" />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Doctor</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Done</Text>
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
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    marginLeft: 10,
    fontSize: 16,
    color: '#333333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#119FB3',
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
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDoctorItem: {
    backgroundColor: '#F0FBFF',
    borderColor: '#119FB3',
    borderWidth: 1,
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
    backgroundColor: '#119FB3',
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
    color: '#333333',
    marginBottom: 4,
  },
  doctorEmail: {
    fontSize: 14,
    color: '#666666',
  },
});

export default DoctorPicker;
