import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';

interface CustomPickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: Array<{label: string; value: string}>;
  placeholder: string;
  style?: any;
  inputStyle?: any;
  textColor?: string;
  placeholderColor?: string;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  selectedValue,
  onValueChange,
  items,
  placeholder,
  style,
  inputStyle,
  textColor = '#000000',
  placeholderColor,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(selectedValue);

  const isIOS = Platform.OS === 'ios';
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const handleConfirm = () => {
    onValueChange(tempValue);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setTempValue(selectedValue);
    setModalVisible(false);
  };

  const getDisplayText = () => {
    if (!selectedValue) return placeholder;
    const selectedItem = items.find(item => item.value === selectedValue);
    return selectedItem ? selectedItem.label : placeholder;
  };

  const displayTextColor = !selectedValue && placeholderColor 
    ? placeholderColor 
    : textColor;

  if (!isIOS) {
    return (
      <View style={[styles.pickerContainer, style]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={[styles.androidPicker, {color: displayTextColor}]}>
          {items.map(item => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
              color={item.value === '' ? placeholderColor : textColor}
            />
          ))}
        </Picker>
      </View>
    );
  }

  return (
    <View style={[styles.pickerContainer, style]}>
      <TouchableOpacity
        style={[styles.pickerButton, inputStyle]}
        onPress={() => setModalVisible(true)}>
        <Text style={[styles.pickerButtonText, {color: displayTextColor}]}>
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
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={tempValue}
              onValueChange={setTempValue}
              style={styles.iosPicker}>
              {items.map(item => (
                <Picker.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                  color={item.value === '' ? placeholderColor : textColor}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    pickerContainer: {
      width: '100%',
    },
    androidPicker: {
      height: 45,
      width: '100%',
    },
    pickerButton: {
      height: 45,
      justifyContent: 'center',
      paddingHorizontal: 10,
      borderRadius: 5,
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
      backgroundColor: theme.colors.card,
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
    iosPicker: {
      width: Dimensions.get('window').width,
      backgroundColor: theme.colors.card,
    },
  });

export default CustomPicker;