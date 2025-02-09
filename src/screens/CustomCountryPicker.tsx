import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';

interface Country {
  name: string;
  code: string;
  flag: string;
  callingCode: string;
}

interface CustomCountryPickerProps {
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  visible: boolean;
  onClose: () => void;
  theme: any;
}

const countries: Country[] = [
  { name: 'United States', code: 'US', flag: '🇺🇸', callingCode: '1' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', callingCode: '44' },
  { name: 'India', code: 'IN', flag: '🇮🇳', callingCode: '91' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', callingCode: '1' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', callingCode: '61' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', callingCode: '49' },
  { name: 'France', code: 'FR', flag: '🇫🇷', callingCode: '33' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', callingCode: '39' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', callingCode: '34' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', callingCode: '81' },
  { name: 'China', code: 'CN', flag: '🇨🇳', callingCode: '86' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', callingCode: '55' },
  { name: 'Russia', code: 'RU', flag: '🇷🇺', callingCode: '7' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', callingCode: '27' },
  { name: 'UAE', code: 'AE', flag: '🇦🇪', callingCode: '971' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', callingCode: '65' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', callingCode: '64' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪', callingCode: '353' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱', callingCode: '31' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪', callingCode: '46' },
];

const CustomCountryPicker: React.FC<CustomCountryPickerProps> = ({
  selectedCountry,
  onSelect,
  visible,
  onClose,
  theme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.callingCode.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[styles.countryItem, { borderBottomColor: theme.inputBorder }]}
      onPress={() => {
        onSelect(item);
        onClose();
      }}>
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={[styles.countryName, { color: theme.text }]}>{item.name}</Text>
      <Text style={[styles.callingCode, { color: theme.text }]}>
        +{item.callingCode}
      </Text>
    </TouchableOpacity>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.text }]}>
        No search results found
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        <View 
          style={[
            styles.pickerContainer, 
            { 
              backgroundColor: theme.card,
              maxHeight: Dimensions.get('window').height * 0.7 - keyboardHeight
            }
          ]}
        >
          <View style={[styles.header, { borderBottomColor: theme.inputBorder }]}>
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.inputBorder
              }]}
              placeholder="Search country..."
              placeholderTextColor={theme.placeholderText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}>
              <Text style={[styles.closeButtonText, { color: theme.primary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredCountries}
            renderItem={renderItem}
            keyExtractor={item => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={ListEmptyComponent}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 2,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
  },
  callingCode: {
    fontSize: 16,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CustomCountryPicker;