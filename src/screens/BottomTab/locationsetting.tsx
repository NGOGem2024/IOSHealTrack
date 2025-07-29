import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSession} from '../../context/SessionContext';
import {handleError, showSuccessToast} from '../../utils/errorHandler';
import axiosinstance from '../../utils/axiosConfig';
import LocationPicker from './HospitalLocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Location {
  _id: string;
  id: string;
  name: string;
  locationId: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface DefaultLocationSetterProps {
  onLocationSet?: (location: Location) => void;
  showImmediately?: boolean;
}

const DefaultLocationSetter: React.FC<DefaultLocationSetterProps> = ({
  onLocationSet,
  showImmediately = false,
}) => {
  const {theme, isDarkMode} = useTheme();
  const {session, setSession} = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  const styles = createStyles(theme.colors, isDarkMode);

  useEffect(() => {
    // Check if we should show the default location setter
    const checkPreferredLocation = () => {
      if (showImmediately) {
        setShouldShow(true);
        setIsVisible(true);
        return;
      }

      // Show if user is logged in but doesn't have a preferred location
      if (session.isLoggedIn && !session.preferred_location) {
        setShouldShow(true);
        setIsVisible(true);
      }
    };

    checkPreferredLocation();
  }, [session.isLoggedIn, session.preferred_location, showImmediately]);

  const handleSetDefaultLocation = async () => {
    if (!selectedLocation) {
      handleError(new Error('Please select a location first'));
      return;
    }

    try {
      setIsSettingDefault(true);

      // Save to local storage only
      await AsyncStorage.setItem('preferred_location', selectedLocation._id);

      // Update session context
      setSession(prevSession => ({
        ...prevSession,
        preferred_location: selectedLocation._id,
      }));

      showSuccessToast('Default location set successfully');

      // Call callback if provided
      if (onLocationSet) {
        onLocationSet(selectedLocation);
      }

      setIsVisible(false);
    } catch (error) {
      handleError(error);
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  // Don't render if we shouldn't show
  if (!shouldShow) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        if (!showImmediately) {
          handleSkip();
        }
      }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Icon name="location-on" size={32} color="#007B8E" />
            <Text style={styles.title}>Set Default Location</Text>
            <Text style={styles.subtitle}>
              Choose a default location to streamline your appointment booking
              process.
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Select Location</Text>
            <LocationPicker
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              disabled={isSettingDefault}
            />

            {selectedLocation && (
              <View style={styles.selectedLocationInfo}>
                <Icon name="check-circle" size={20} color="#007B8E" />
                <Text style={styles.selectedLocationText}>
                  {selectedLocation.name} selected
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.setButton,
                (!selectedLocation || isSettingDefault) &&
                  styles.setButtonDisabled,
              ]}
              onPress={handleSetDefaultLocation}
              disabled={!selectedLocation || isSettingDefault}>
              {isSettingDefault ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.setButtonText}>Setting...</Text>
                </View>
              ) : (
                <Text style={styles.setButtonText}>Set as Default</Text>
              )}
            </TouchableOpacity>

            {!showImmediately && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={isSettingDefault}>
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: `${colors.text}80`,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    content: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#007B8E',
      marginBottom: 8,
    },
    selectedLocationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      padding: 12,
      backgroundColor: '#007B8E10',
      borderRadius: 8,
    },
    selectedLocationText: {
      fontSize: 14,
      color: '#007B8E',
      marginLeft: 8,
      fontWeight: '500',
    },
    buttonContainer: {
      gap: 12,
    },
    setButton: {
      backgroundColor: '#007B8E',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
    },
    setButtonDisabled: {
      backgroundColor: '#007B8E60',
      opacity: 0.6,
    },
    setButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    skipButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: `${colors.text}40`,
    },
    skipButtonText: {
      color: `${colors.text}80`,
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default DefaultLocationSetter;
