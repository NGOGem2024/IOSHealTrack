import React, {useState} from 'react';
import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Colors {
  inputBg: string;
  inputBorder: string;
  secondary: string;
  text: string;
  primary: string;
  card: string;
}

interface ParentStyles {
  pickerWrapper: ViewStyle;
  inputIcon: ViewStyle;
  picker: ViewStyle;
}

interface RolePickerProps {
  value: string;
  onChange: (value: string) => void;
  colors: Colors;
  styles: ParentStyles;
}

const RolePicker: React.FC<RolePickerProps> = ({
  value,
  onChange,
  colors,
  styles: parentStyles,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleValueChange = (itemValue: string) => {
    onChange(itemValue);
    if (Platform.OS === 'ios') {
      setShowPicker(false);
    }
  };

  const renderIOSPicker = () => (
    <>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={[
          parentStyles.pickerWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          },
        ]}>
        <Icon
          name="account-cog"
          size={20}
          color={colors.secondary}
          style={parentStyles.inputIcon}
        />
        <Text style={[styles.selectedValue, {color: colors.text}]}>
          {value === 'true' ? 'Admin' : 'Doctor'}
        </Text>
        <Icon
          name="chevron-down"
          size={20}
          color={colors.secondary}
          style={styles.chevron}
        />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <View style={[styles.pickerHeader, {borderBottomColor: colors.inputBorder}]}>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                style={styles.doneButton}>
                <Text style={[styles.doneText, {color: colors.primary}]}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={value}
              onValueChange={handleValueChange}
              style={[styles.iosPicker, {color: colors.text}]}>
              <Picker.Item label="Doctor" value="false" />
              <Picker.Item label="Admin" value="true" />
            </Picker>
          </View>
        </View>
      </Modal>
    </>
  );

  const renderAndroidPicker = () => (
    <View
      style={[
        parentStyles.pickerWrapper,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
        },
      ]}>
      <Icon
        name="account-cog"
        size={20}
        color={colors.secondary}
        style={[parentStyles.inputIcon, styles.iconSpacing]}
      />
      <Picker
        selectedValue={value}
        onValueChange={handleValueChange}
        style={[parentStyles.picker, {color: colors.text}]}
        dropdownIconColor={colors.text}>
        <Picker.Item label="Doctor" value="false" />
        <Picker.Item label="Admin" value="true" />
      </Picker>
    </View>
  );

  return Platform.OS === 'ios' ? renderIOSPicker() : renderAndroidPicker();
};

interface StylesType {
  selectedValue: TextStyle;
  chevron: ViewStyle;
  modalContainer: ViewStyle;
  modalContent: ViewStyle;
  pickerHeader: ViewStyle;
  doneButton: ViewStyle;
  doneText: TextStyle;
  iosPicker: ViewStyle;
  iconSpacing: ViewStyle;
}

const styles = StyleSheet.create<StylesType>({
  selectedValue: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    marginLeft : 12,
  },
  chevron: {
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    padding: 16,
  },
  doneButton: {
    padding: 4,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
  iconSpacing: {
    marginRight: 8, 
  },
});

export default RolePicker;