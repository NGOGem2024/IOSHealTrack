import React, {useState} from 'react';
import {useColorScheme} from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const {width, height} = Dimensions.get('window');

interface TherapyCategoryDropdownProps {
  value: string;
  onValueChange: (category: string) => void;
  items: string[];
}

const TherapyCategoryDropdown: React.FC<TherapyCategoryDropdownProps> = ({
  value,
  onValueChange,
  items,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleSelectCategory = (category: string) => {
    onValueChange(category);
    setModalVisible(false);
  };

  const CategoryItem = ({item}: {item: string}) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleSelectCategory(item)}>
      <Text style={[styles.categoryItemText, isDarkMode && styles.textDark]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.inputContainer,
          isDarkMode && styles.balanceContainerDark,
        ]}
        onPress={() => setModalVisible(true)}>
        <MaterialIcons
          name="category"
          size={24}
          color={isDarkMode ? '#66D9E8' : '#119FB3'}
        />
        <Text
          style={[
            styles.dropdownButtonText,
            !value && styles.placeholderText,
            isDarkMode && styles.textDark,
          ]}>
          {value || 'Select Plan Category'}
        </Text>
        <MaterialIcons
          name="arrow-drop-down"
          size={24}
          color={isDarkMode ? '#66D9E8' : '#119FB3'}
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              isDarkMode && styles.balanceContainerDark,
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>
                Select Plan Category
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={isDarkMode ? '#66D9E8' : '#119FB3'}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              renderItem={({item}) => <CategoryItem item={item} />}
              keyExtractor={item => item}
              style={styles.categoryList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 2,
    height: 50,
  },
  balanceContainerDark: {
    backgroundColor: '#333333',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
  },
  dropdownButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333333',
  },
  placeholderText: {
    color: '#A0A0A0',
  },
  textDark: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 15,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#119FB3',
  },
  closeButton: {
    padding: 5,
  },
  categoryList: {
    padding: 10,
  },
  categoryItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
});

export default TherapyCategoryDropdown;
