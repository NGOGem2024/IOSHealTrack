import React, {useState} from 'react';
import {
  Modal,
  FlatList,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import {getTheme} from './Theme';
import {useTheme} from './ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Country {
  code: string; // the value to be used in your input (e.g., "+91")
  label: string;
  flag: string; // full label to show in the modal list (e.g., "+91 (India)")
}

interface CountryPickerProps {
  selectedCode: string;
  onValueChange: (code: string) => void;
}

const countries: Country[] = [
  {code: '+91', label: '+91  (India)', flag: '🇮🇳'},
  {code: '+1', label: '+1  (USA)', flag: '🇺🇸'},
  {code: '+44', label: '+44  (UK)', flag: '🇬🇧'},
  {code: '+61', label: '+61  (Australia)', flag: '🇦🇺'},
  {code: '+49', label: '+49  (Germany)', flag: '🇩🇪'},
  {code: '+33', label: '+33  (France)', flag: '🇫🇷'},
  {code: '+39', label: '+39  (Italy)', flag: '🇮🇹'},
  {code: '+34', label: '+34  (Spain)', flag: '🇪🇸'},
  {code: '+81', label: '+81  (Japan)', flag: '🇯🇵'},
];

const CountryPicker: React.FC<CountryPickerProps> = ({
  selectedCode,
  onValueChange,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedCountry = countries.find(
    country => country.code === selectedCode,
  );
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const closeModal = () => {
    setModalVisible(false);
  };
  return (
    <View>
      {/* Closed State: Shows dropdown icon and only the country code */}
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}>
        {selectedCountry && (
          <Text style={styles.flagText}>{selectedCountry.flag}</Text>
        )}
        <Text style={styles.pickerText}>
          {selectedCountry ? selectedCountry.code : selectedCode}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={20} color="#007b8e" />
      </TouchableOpacity>

      {/* Modal for selecting a country */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContainer}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}>
                  <MaterialIcons name="close" size={18} color="#119FB3" />
                </TouchableOpacity>

                <FlatList
                  data={countries}
                  keyExtractor={item => item.code}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.item}
                      onPress={() => {
                        onValueChange(item.code);
                        closeModal();
                      }}>
                      <Text style={styles.flagText}>{item.flag}</Text>
                      <Text style={styles.itemText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    flagText: {
      fontSize: 16,
      marginRight: 5,
    },
    pickerText: {
      fontSize: 16,
      color: theme.colors.text,
      marginRight: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.card,
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
    item: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
  });

export default CountryPicker;
