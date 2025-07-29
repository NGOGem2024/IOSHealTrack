import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';

// Define the industry type
interface Industry {
  id: string;
  name: string;
}

// Define the props interface for the IndustryDropdown component
interface IndustryDropdownProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}

// Define the theme type (you might want to import this from your Theme file)

const industries: Industry[] = [
  {id: 'physiotherapy', name: 'Physiotherapy'},
  {id: 'dentistry', name: 'Dentistry'},
  {id: 'gynacologist', name: 'Gynecologist'},
  {id: 'ayurveda', name: 'Ayurveda'},
  {id: 'homeopathy', name: 'Homeopathy'},
  {id: 'pediatrics', name: 'Pediatrics'},
];

const IndustryDropdown: React.FC<IndustryDropdownProps> = ({
  selectedValue,
  onValueChange,
  placeholder = 'Select Speciality',
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  const handleSelect = (industry: Industry) => {
    onValueChange(industry.id);
    setIsVisible(false);
  };

  const renderItem = ({item, index}: {item: Industry; index: number}) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selectedValue === item.id && styles.selectedItem,
        // Add rounded corners to the last item
        index === industries.length - 1 && styles.lastItem,
      ]}
      onPress={() => handleSelect(item)}>
      <Text
        style={[
          styles.dropdownItemText,
          selectedValue === item.id && styles.selectedItemText,
        ]}>
        {item.name}
      </Text>
      {selectedValue === item.id && (
        <Icon name="check" size={20} color="#007B8E" />
      )}
    </TouchableOpacity>
  );

  const selectedIndustry = industries.find(
    (industry: Industry) => industry.id === selectedValue,
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsVisible(true)}>
        <Text style={styles.selectorText}>
          {selectedIndustry ? selectedIndustry.name : 'Select Speciality'}
        </Text>
        <Icon name="chevron-down" size={24} color="#007B8E" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Speciality</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}>
                <Icon name="close" size={24} color="#007B8E" />
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownContainer}>
              <FlatList
                data={industries}
                keyExtractor={(item: Industry) => item.id}
                renderItem={renderItem}
                style={styles.dropdown}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      position: 'relative',
    },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: '#007B8E',
      minHeight: 50,
    },
    selectorText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderRadius: 15,
      width: '85%',
      maxWidth: 400,
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      overflow: 'hidden', // Ensures rounded corners are visible
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 5,
    },
    dropdownContainer: {
      borderBottomLeftRadius: 15,
      borderBottomRightRadius: 15,
      overflow: 'hidden',
    },
    dropdown: {
      maxHeight: 300,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.card,
    },
    selectedItem: {
      backgroundColor: theme.colors.secondary,
    },
    lastItem: {
      borderBottomLeftRadius: 15,
      borderBottomRightRadius: 15,
    },
    dropdownItemText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    selectedItemText: {
      color: '#007B8E',
      fontWeight: '600',
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 20,
    },
  });

export default IndustryDropdown;
