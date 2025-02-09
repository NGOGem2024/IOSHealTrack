import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import Modal from 'react-native-modal';
import {useSession} from '../context/SessionContext';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const BackTabTop: React.FC<{screenName: string}> = ({screenName}) => {
  const navigation = useNavigation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();

  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
    insets,
  );
  const route = useRoute();
  const {session} = useSession();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [storedPhoto, setStoredPhoto] = useState<string | null>(null);

  const toggleDropdown = () => setDropdownVisible(!isDropdownVisible);

  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName as never);
    setDropdownVisible(false);
  };

  // Fetch stored photo from AsyncStorage
  useEffect(() => {
    const getStoredPhoto = async () => {
      try {
        const photo = await AsyncStorage.getItem('doctor_photo');
        if (photo) {
          setStoredPhoto(photo);
        }
      } catch (error) {
        console.error('Error fetching stored photo:', error);
      }
    };
    getStoredPhoto();
  }, []);

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        <Image
          source={require('../assets/healtrack_logo1.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.versionText}>v0.5</Text>
      </TouchableOpacity>

      <View style={styles.rightSection}>
        <Text style={styles.screenNameText}>{screenName}</Text>
        <TouchableOpacity style={styles.profileButton} onPress={toggleDropdown}>
          {storedPhoto ? (
            <Image source={{uri: storedPhoto}} style={styles.profilePhoto} />
          ) : (
            <Image
              source={require('../assets/profile.png')}
              style={styles.profilePhoto}
            />
          )}
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
          {session.is_admin && (
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

const getStyles = (theme: ReturnType<typeof getTheme>, insets: any) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 15,
      backgroundColor: '#007B8E',
      borderBottomWidth: 1,
      borderBottomColor: 'white',
      borderTopColor: 'white',
      borderTopWidth: 1,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft:-5,
    },
    logoImage: {
      width: 110,
      height: 35,
      marginLeft: -5,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profilePhoto: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: '#c6eff5',
    },
    screenNameText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
      marginRight: 10,
    },
    profileButton: {
      alignItems: 'flex-end',
    },
    logoContainer: {
      alignItems: 'center',
    },
    versionText: {
      position: 'absolute',
      bottom: 1,
      right: -11,
      color: '#FFFFFF',
      fontSize: 10,
      opacity: 0.8,
      fontWeight: 'bold',
    },
    modal: {
      margin: 0,
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    },
    dropdown: {
      backgroundColor: theme.colors.card,
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
      color: theme.colors.text,
      fontSize: 16,
    },
    logoutText: {
      color: 'red',
    },
  });

export default BackTabTop;
