import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Text,
  Modal,
  SafeAreaView,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';

interface CustomPickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: Array<{label: string; value: string}>;
  placeholder?: string;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  selectedValue,
  onValueChange,
  items,
  placeholder,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const getSelectedLabel = () => {
    const selected = items.find(item => item.value === selectedValue);
    return selected ? selected.label : placeholder || 'Select...';
  };

  if (Platform.OS === 'android') {
    return (
      <View style={styles.androidPickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={value => {
            onValueChange(value);
          }}
          style={styles.androidPicker}
          dropdownIconColor="#000000">
          {items.map(item => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
              color="#000000"
            />
          ))}
        </Picker>
      </View>
    );
  }

  // For iOS
  return (
    <View style={styles.iosPickerContainer}>
      <TouchableOpacity
        style={styles.iosPickerButton}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.selectedText}>{getSelectedLabel()}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={selectedValue}
              onValueChange={value => {
                onValueChange(value);
              }}
              style={styles.iosPicker}>
              {items.map(item => (
                <Picker.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                  color="#000000"
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  androidPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  androidPicker: {
    height: 48,
    width: '100%',
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  iosPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  iosPickerButton: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  selectedText: {
    fontSize: 16,
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalButtonText: {
    color: '#119FB3',
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    backgroundColor: '#FFFFFF',
    height: 216,
  },
});

export default CustomPicker;
