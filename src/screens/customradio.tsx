import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';

interface CustomPickerProps {
  selectedValue: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  style?: any;
  textColor?: string;
}

interface CustomRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{label: string; value: string}>;
  label: string;
  textColor?: string;
}

export const CustomPicker: React.FC<CustomPickerProps> = ({
  selectedValue,
  onValueChange,
  label,
  style,
  textColor = '#000000',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(selectedValue);

  const handleConfirm = () => {
    onValueChange(tempValue);
    setModalVisible(false);
  };

  const getDisplayText = () => {
    return selectedValue ? 'Admin' : 'Doctor';
  };

  if (Platform.OS === 'android') {
    return (
      <TouchableOpacity
        style={[styles.pickerButton, style]}
        onPress={() => onValueChange(!selectedValue)}>
        <Text style={[styles.pickerButtonText, {color: textColor}]}>
          {getDisplayText()}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.pickerButton, style]}
        onPress={() => setModalVisible(true)}>
        <Text style={[styles.pickerButtonText, {color: textColor}]}>
          {getDisplayText()}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  tempValue === false && styles.selectedOption,
                ]}
                onPress={() => setTempValue(false)}>
                <Text
                  style={[
                    styles.pickerOptionText,
                    tempValue === false && styles.selectedOptionText,
                  ]}>
                  Doctor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  tempValue === true && styles.selectedOption,
                ]}
                onPress={() => setTempValue(true)}>
                <Text
                  style={[
                    styles.pickerOptionText,
                    tempValue === true && styles.selectedOptionText,
                  ]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const CustomRadioGroup: React.FC<CustomRadioGroupProps> = ({
  value,
  onValueChange,
  options,
  label,
  textColor = '#000000',
}) => {
  return (
    <View style={styles.radioGroupContainer}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.radioButton,
            value === option.value && styles.radioButtonSelected,
            index < options.length - 1 && styles.radioButtonMargin,
          ]}
          onPress={() => onValueChange(option.value)}>
          <View style={styles.radioButtonOuter}>
            <View
              style={[
                styles.radioButtonInner,
                value === option.value && styles.radioButtonInnerSelected,
              ]}
            />
          </View>
          <Text
            style={[
              styles.radioButtonLabel,
              {color: textColor},
              value === option.value && styles.radioButtonLabelSelected,
            ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginVertical: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalButtonText: {
    color: '#119FB3',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerOptionsContainer: {
    padding: 15,
  },
  pickerOption: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: '#F5F5F5',
  },
  selectedOption: {
    backgroundColor: '#119FB3',
  },
  pickerOptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333333',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  radioGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  radioButtonSelected: {
    backgroundColor: '#E3F2FD',
  },
  radioButtonMargin: {
    marginRight: 15,
  },
  radioButtonOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#119FB3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioButtonInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  radioButtonInnerSelected: {
    backgroundColor: '#119FB3',
  },
  radioButtonLabel: {
    fontSize: 16,
    marginLeft: 4,
  },
  radioButtonLabelSelected: {
    color: '#119FB3',
    fontWeight: '500',
  },
});
