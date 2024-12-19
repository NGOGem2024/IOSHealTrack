import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import Modal from 'react-native-modal';
import {useSession} from '../context/SessionContext';

const BackTabTop: React.FC<{screenName: string}> = ({screenName}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const {session} = useSession();
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const toggleDropdown = () => setDropdownVisible(!isDropdownVisible);

  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName as never);
    setDropdownVisible(false);
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        <Image
          source={require('../assets/logo3.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <View style={styles.rightSection}>
        <Text style={styles.screenNameText}>{screenName}</Text>
        <TouchableOpacity style={styles.profileButton} onPress={toggleDropdown}>
          <Ionicons name="person-circle-outline" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal
        isVisible={isDropdownVisible}
        onBackdropPress={toggleDropdown}
        animationIn="slideInDown"
        animationOut="slideOutUp"
        animationInTiming={300}
        animationOutTiming={300}
        backdropTransitionInTiming={300}
        backdropTransitionOutTiming={300}
        style={styles.modal}>
        <View style={styles.dropdown}>
          <TouchableOpacity onPress={() => navigateToScreen('AllPatients')}>
            <Text style={styles.dropdownItem}>All Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateToScreen('DoctorDashboard')}>
            <Text style={styles.dropdownItem}>Dashboard</Text>
          </TouchableOpacity>
          {session.is_admin && ( // Only show Settings if the user is an admin
            <TouchableOpacity onPress={() => navigateToScreen('Settings')}>
              <Text style={styles.dropdownItem}>Settings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigateToScreen('Logout')}>
            <Text style={[styles.dropdownItem, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    paddingTop: 20,
    backgroundColor: '#119FB3',
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 110,
    height: 35,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenNameText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 15,
  },
  profileButton: {
    alignItems: 'flex-end',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdown: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginTop: 60,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 180,
    transform: [{translateY: -10}],
  },
  dropdownItem: {
    padding: 10,
    fontSize: 16,
  },
  logoutText: {
    color: 'red',
  },
});

export default BackTabTop;