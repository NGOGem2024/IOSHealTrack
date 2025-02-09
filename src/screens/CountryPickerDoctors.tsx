import React, { useState } from 'react';
import {
  Modal,
  FlatList,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { getTheme } from './Theme';
import { useTheme } from './ThemeContext';

interface Country {
  code: string;  // the value to be used in your input (e.g., "+91")
  label: string; // full label to show in the modal list (e.g., "+91 (India)")
}

interface CountryPickerProps {
  selectedCode: string;
  onValueChange: (code: string) => void;
}

const countries: Country[] = [
  { code: '+91', label: '+91  (India)' },
  { code: '+1', label: '+1  (USA)' },
  { code: '+44', label: '+44  (UK)' },
  { code: '+61', label: '+61  (Australia)' },
];

const CountryPicker: React.FC<CountryPickerProps> = ({ selectedCode, onValueChange }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedCountry = countries.find(country => country.code === selectedCode);
   const {theme} = useTheme();
    const styles = getStyles(
      getTheme(
        theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
      ),
    );

  return (
    <View>
      {/* Closed State: Shows dropdown icon and only the country code */}
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownIcon}>▼</Text>
        <Text style={styles.pickerText}>
          {selectedCountry ? selectedCountry.code : selectedCode}
        </Text>
      </TouchableOpacity>

      {/* Modal for selecting a country */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <FlatList
              data={countries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    onValueChange(item.code);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.itemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
    StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIcon: {
    marginRight: 5,
    fontSize: 16,
    color: theme.colors.text,
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.colors.card ,
    width: '80%',
    maxHeight: '60%',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 8,
  },
  closeIcon: {
    fontSize: 15,
    color: '#119FB3',
    fontWeight: '700',
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
});

export default CountryPicker;
