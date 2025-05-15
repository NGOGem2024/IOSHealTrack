import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  useWindowDimensions,
  Platform,
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
  const route = useRoute();
  const {session} = useSession();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [storedPhoto, setStoredPhoto] = useState<string | null>(null);
  const {width} = useWindowDimensions();

  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
    insets,
  );

  const toggleDropdown = () => setDropdownVisible(!isDropdownVisible);

  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName as never);
    setDropdownVisible(false);
  };

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
    <View style={{zIndex: 1000}}>
      {/* Status bar area */}
      <View style={{backgroundColor: 'black', height: insets.top}} />

      {/* Blue header */}
      <View style={styles.header}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="black"
          translucent={Platform.OS === 'android'}
        />

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
          <TouchableOpacity
            style={styles.profileButton}
            onPress={toggleDropdown}>
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

        {/* Dropdown Modal */}
        <Modal
          isVisible={isDropdownVisible}
          onBackdropPress={toggleDropdown}
          animationIn="slideInRight"
          animationOut="slideOutRight"
          animationInTiming={300}
          animationOutTiming={300}
          backdropTransitionInTiming={300}
          backdropTransitionOutTiming={300}
          style={styles.modal}
          propagateSwipe={true}
          backdropOpacity={0.5}>
          <View style={[styles.dropdown, {width: width * 0.5}]}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity onPress={toggleDropdown}>
                <Ionicons name="close" size={24} color="#007B8E" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerDivider} />

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => navigateToScreen('AllPatients')}>
              <Ionicons name="people-outline" size={24} color="#007B8E" />
              <Text style={styles.drawerItemText}>All Patients</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => navigateToScreen('DoctorDashboard')}>
              <Ionicons name="grid-outline" size={24} color="#007B8E" />
              <Text style={styles.drawerItemText}>Dashboard</Text>
            </TouchableOpacity>

            {session.is_admin && (
              <>
                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => navigateToScreen('Settings')}>
                  <Ionicons name="settings-outline" size={24} color="#007B8E" />
                  <Text style={styles.drawerItemText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => navigateToScreen('AdminReport')}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color="#007B8E"
                  />
                  <Text style={styles.drawerItemText}>Reports</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.drawerDivider} />

            <TouchableOpacity
              style={[styles.drawerItem, styles.logoutItem]}
              onPress={() => navigateToScreen('Logout')}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              <Text style={[styles.drawerItemText, styles.logoutText]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
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
    dropdown: {
      backgroundColor: theme.colors.card,
      maxHeight: 320,
      minHeight: 50,
      padding: 0,
      shadowColor: '#000',
      shadowOffset: {
        width: -2,
        height: 0,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: theme.colors.card,
    },
    drawerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#007B8E',
    },
    drawerDivider: {
      height: 1,
      backgroundColor: '#E0E0E0',
      marginVertical: 2,
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    drawerItemText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 16,
    },
    logoutItem: {
      marginTop: 5,
      marginBottom: 2,
    },
    logoutText: {
      color: '#FF3B30',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: -5,
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
      // Ensure we respect the safe area insets for the modal
      paddingTop: Platform.OS === 'ios' ? insets.top : 0,
    },
  });

export default BackTabTop;
