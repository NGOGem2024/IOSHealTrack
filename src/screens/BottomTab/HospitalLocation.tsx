import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import {useTheme} from '../ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Picker} from '@react-native-picker/picker';
import {handleError, showSuccessToast} from '../../utils/errorHandler';
import {useSession} from '../../context/SessionContext';
import axiosinstance from '../../utils/axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

interface Location {
  _id: string;
  id: string;
  name: string;
  locationId: string;
  addressLink: string; // Updated from 'address' to 'address_link'
  createdAt: string;
  updatedAt: string;
}

interface LocationPickerProps {
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  disabled?: boolean;
  showSetAsDefault?: boolean; // New prop to show/hide set as default option
  autoSelectPreferred?: boolean; // New prop to auto-select preferred location
}

// No Locations Popup Component
const NoLocationsPopup: React.FC<{
  visible: boolean;
  onClose: () => void;
  onNavigateToOrganization: () => void;
  theme: any;
  isDarkMode: boolean;
}> = ({visible, onClose, onNavigateToOrganization, theme, isDarkMode}) => {
  const styles = createNoLocationPopupStyles(theme.colors, isDarkMode);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.popupContainer}>
          <View style={styles.iconContainer}>
            <Icon name="location-off" size={60} color="#FF6B6B" />
          </View>
          
          <Text style={styles.title}>No Locations Available</Text>
          
          <Text style={styles.message}>
            No locations have been configured for your organization yet. 
            Please contact your administrator or add locations through the Organization settings.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onNavigateToOrganization}>
              <Icon name="business" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Organization Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  selectedLocation,
  onLocationSelect,
  disabled = false,
  showSetAsDefault = true,
  autoSelectPreferred = true,
}) => {
  const {theme, isDarkMode} = useTheme();
  const {session, setSession} = useSession();
  const navigation = useNavigation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [isSettingPreferred, setIsSettingPreferred] = useState<boolean>(false);
  const [showNoLocationsPopup, setShowNoLocationsPopup] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const styles = createStyles(theme.colors, isDarkMode);

  useEffect(() => {
    fetchLocations();
  }, []);

  // Auto-select preferred location when locations are loaded
  useEffect(() => {
    if (
      autoSelectPreferred &&
      locations.length > 0 &&
      session.preferred_location &&
      !selectedLocation
    ) {
      const preferredLocation = locations.find(
        loc => loc._id === session.preferred_location,
      );
      if (preferredLocation) {
        onLocationSelect(preferredLocation);
      }
    }
  }, [
    locations,
    session.preferred_location,
    selectedLocation,
    autoSelectPreferred,
  ]);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const response = await axiosinstance.get('/get/orgLocations', {
        headers: {
          Authorization: `Bearer ${session.idToken}`,
        },
      });

      if (response.data && response.data.locations) {
        setLocations(response.data.locations);
        
        // Check if no locations are available
        if (response.data.locations.length === 0) {
          setShowNoLocationsPopup(true);
        }
      } else {
        // Handle case where response doesn't have locations
        setLocations([]);
        setShowNoLocationsPopup(true);
      }
    } catch (error) {
      handleError(error);
      setLocations([]);
      setShowNoLocationsPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setAsPreferredLocation = async (location: Location) => {
    try {
      setIsSettingPreferred(true);

      // Save to local storage
      await AsyncStorage.setItem('preferred_location', location._id);

      // Update session context
      setSession(prevSession => ({
        ...prevSession,
        preferred_location: location._id,
      }));

      showSuccessToast(`${location.name} set as default location`);
    } catch (error) {
      handleError(new Error('Failed to set default location'));
    } finally {
      setIsSettingPreferred(false);
    }
  };

  const handleSetAsDefault = (location: Location) => {
    Alert.alert(
      'Set Default Location',
      `Set "${location.name}" as your default location for future appointments?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Set Default',
          onPress: () => setAsPreferredLocation(location),
        },
      ],
    );
  };

  const resetScrollPosition = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: 0, animated: false});
    }
  };

  const openLocationPicker = () => {
    if (!disabled) {
      if (locations.length === 0) {
        setShowNoLocationsPopup(true);
        return;
      }
      setShowLocationPicker(true);
      resetScrollPosition();
    }
  };

  const handleLocationPress = (location: Location) => {
    onLocationSelect(location);
    setShowLocationPicker(false);
  };

  const openLocationInMaps = (addressLink: string) => {
    if (addressLink) {

      Linking.openURL(addressLink).catch(err => {
        console.error('Failed to open maps:', err);
        handleError(new Error('Failed to open location in maps'));
      });
    }
  };

  const isPreferredLocation = (locationId: string) => {
    return session.preferred_location === locationId;
  };

  const handleNavigateToOrganization = () => {
    setShowNoLocationsPopup(false);
    // Navigate to Organization screen
    // Adjust the navigation route name according to your navigation structure
    navigation.navigate('OrganizationSettings' as never);
  };

  const renderPickerField = () => {
    const locationName = selectedLocation ? selectedLocation.name : undefined;
    const isPreferred =
      selectedLocation && isPreferredLocation(selectedLocation._id);

    return (
      <TouchableOpacity
        style={[styles.pickerField, disabled && styles.disabledPickerField]}
        onPress={openLocationPicker}
        disabled={disabled}>
        <View style={styles.pickerFieldContent}>
          <View style={styles.locationNameContainer}>
            <Text
              style={[
                styles.pickerFieldText,
                !locationName && styles.pickerPlaceholder,
                disabled && styles.disabledText,
              ]}>
              {locationName || 'Select a location'}
            </Text>
            {isPreferred && (
              <View style={styles.preferredBadge}>
                <Icon name="star" size={14} color="#FFD700" />
                <Text style={styles.preferredText}>Default</Text>
              </View>
            )}
          </View>
          {selectedLocation && (
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openLocationInMaps(selectedLocation.addressLink)}>
              <Icon name="map" size={20} color="#007B8E" />
            </TouchableOpacity>
          )}
        </View>
        <Icon
          name="arrow-drop-down"
          size={24}
          color={disabled ? '#999' : '#007B8E'}
        />
      </TouchableOpacity>
    );
  };

  const renderLocationModal = () => {
    return (
      <Modal
        visible={showLocationPicker}
        transparent={true}
        animationType="slide"
        onShow={resetScrollPosition}>
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Location</Text>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007B8E" />
                <Text style={styles.loadingText}>Loading locations...</Text>
              </View>
            ) : (
              <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContentContainer}>
                {locations.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No locations available</Text>
                    <TouchableOpacity
                      style={styles.addLocationButton}
                      onPress={handleNavigateToOrganization}>
                      <Icon name="add-location" size={20} color="#007B8E" />
                      <Text style={styles.addLocationButtonText}>
                        Add Locations
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  locations.map(location => (
                    <View key={location._id} style={styles.locationItemWrapper}>
                      <TouchableOpacity
                        style={[
                          styles.locationItem,
                          selectedLocation?._id === location._id &&
                            styles.selectedLocationItem,
                        ]}
                        onPress={() => handleLocationPress(location)}>
                        <View style={styles.locationItemContent}>
                          <View style={styles.locationInfo}>
                            <View style={styles.locationNameRow}>
                              <Text
                                style={[
                                  styles.locationItemText,
                                  selectedLocation?._id === location._id &&
                                    styles.selectedLocationItemText,
                                ]}>
                                {location.name}
                              </Text>
                              {isPreferredLocation(location._id) && (
                                <View style={styles.preferredBadgeSmall}>
                                  <Icon name="star" size={12} color="#FFD700" />
                                </View>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.locationIdText,
                                selectedLocation?._id === location._id &&
                                  styles.selectedLocationIdText,
                              ]}>
                              ID: {location.locationId}
                            </Text>
                          </View>
                          <View style={styles.locationActions}>
                            <TouchableOpacity
                              style={styles.mapIconButton}
                              onPress={() =>
                                openLocationInMaps(location.addressLink)
                              }>
                              <Icon name="map" size={20} color="#007B8E" />
                            </TouchableOpacity>
                            {showSetAsDefault &&
                              !isPreferredLocation(location._id) && (
                                <TouchableOpacity
                                  style={styles.setDefaultButton}
                                  onPress={() => handleSetAsDefault(location)}
                                  disabled={isSettingPreferred}>
                                  {isSettingPreferred ? (
                                    <ActivityIndicator
                                      size="small"
                                      color="#007B8E"
                                    />
                                  ) : (
                                    <Icon
                                      name="star-border"
                                      size={20}
                                      color="#007B8E"
                                    />
                                  )}
                                </TouchableOpacity>
                              )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (Platform.OS === 'ios') {
    return (
      <View>
        {renderPickerField()}
        {renderLocationModal()}
        <NoLocationsPopup
          visible={showNoLocationsPopup}
          onClose={() => setShowNoLocationsPopup(false)}
          onNavigateToOrganization={handleNavigateToOrganization}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      </View>
    );
  }

  // Android version with native Picker
  return (
    <View style={styles.pickerWrapper}>
      <Picker
        selectedValue={selectedLocation?._id || ''}
        onValueChange={(itemValue: string) => {
          if (itemValue !== '') {
            const location = locations.find(loc => loc._id === itemValue);
            if (location) {
              onLocationSelect(location);
            }
          }
        }}
        style={styles.picker}
        dropdownIconColor="#007b8e"
        enabled={!disabled && locations.length > 0}>
        <Picker.Item label="Select a location" value="" />
        {locations.map(location => (
          <Picker.Item
            key={location._id}
            label={`${location.name} (${location.locationId})${
              isPreferredLocation(location._id) ? ' ⭐' : ''
            }`}
            value={location._id}
          />
        ))}
      </Picker>
      
      {locations.length === 0 && (
        <View style={styles.androidEmptyContainer}>
          <Text style={styles.androidEmptyText}>No locations available</Text>
          <TouchableOpacity
            style={styles.androidAddLocationButton}
            onPress={handleNavigateToOrganization}>
            <Icon name="business" size={18} color="#007B8E" />
            <Text style={styles.androidAddLocationButtonText}>
              Organization Settings
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.androidButtonsContainer}>
        {selectedLocation && (
          <TouchableOpacity
            style={styles.androidMapButton}
            onPress={() => openLocationInMaps(selectedLocation.addressLink)}>
            <Icon name="map" size={20} color="#007B8E" />
            <Text style={styles.mapButtonText}>View on Map</Text>
          </TouchableOpacity>
        )}
        {showSetAsDefault &&
          selectedLocation &&
          !isPreferredLocation(selectedLocation._id) && (
            <TouchableOpacity
              style={styles.androidSetDefaultButton}
              onPress={() => handleSetAsDefault(selectedLocation)}
              disabled={isSettingPreferred}>
              {isSettingPreferred ? (
                <ActivityIndicator size="small" color="#007B8E" />
              ) : (
                <>
                  <Icon name="star-border" size={20} color="#007B8E" />
                  <Text style={styles.setDefaultButtonText}>
                    Set as Default
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
      </View>
      
      <NoLocationsPopup
        visible={showNoLocationsPopup}
        onClose={() => setShowNoLocationsPopup(false)}
        onNavigateToOrganization={handleNavigateToOrganization}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    pickerWrapper: {
      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? colors.border : '#E0E0E0',
      marginTop: 8,
      overflow: 'hidden',
    },
    picker: {
      backgroundColor: 'transparent',
      color: colors.text,
      paddingVertical: 8,
      marginTop: 0,
      marginBottom: 0,
    },
    pickerField: {
      backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
      borderRadius: 10,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? colors.border : '#E0E0E0',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    disabledPickerField: {
      backgroundColor: isDarkMode ? colors.border : '#F5F5F5',
      opacity: 0.6,
    },
    pickerFieldContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locationNameContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    pickerFieldText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    pickerPlaceholder: {
      color: `${colors.text}80`,
    },
    disabledText: {
      color: `${colors.text}60`,
    },
    preferredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFD70020',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    preferredText: {
      fontSize: 12,
      color: '#B8860B',
      marginLeft: 2,
      fontWeight: '500',
    },
    preferredBadgeSmall: {
      marginLeft: 6,
    },
    mapButton: {
      padding: 4,
      marginLeft: 8,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    doneButton: {
      padding: 8,
    },
    doneButtonText: {
      color: '#007B8E',
      fontSize: 16,
      fontWeight: '600',
    },
    scrollContainer: {
      maxHeight: 300,
      width: '100%',
    },
    scrollContentContainer: {
      paddingBottom: 20,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 10,
      color: colors.text,
      fontSize: 16,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: colors.text,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
    },
    addLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#007B8E10',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#007B8E40',
    },
    addLocationButtonText: {
      color: '#007B8E',
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
    },
    androidEmptyContainer: {
      padding: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    androidEmptyText: {
      color: colors.text,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 12,
    },
    androidAddLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#007B8E10',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
    },
    androidAddLocationButtonText: {
      color: '#007B8E',
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 6,
    },
    locationItemWrapper: {
      // Container for each location item
    },
    locationItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedLocationItem: {
      backgroundColor: '#007B8E20',
    },
    locationItemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    locationInfo: {
      flex: 1,
    },
    locationNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationItemText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    selectedLocationItemText: {
      color: '#007B8E',
      fontWeight: 'bold',
    },
    locationIdText: {
      fontSize: 14,
      color: `${colors.text}80`,
      marginTop: 2,
    },
    selectedLocationIdText: {
      color: '#007B8E80',
    },
    locationActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mapIconButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: '#007B8E10',
      marginRight: 8,
    },
    setDefaultButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: '#FFD70010',
    },
    androidButtonsContainer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    androidMapButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: '#007B8E10',
    },
    androidSetDefaultButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: '#FFD70010',
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    mapButtonText: {
      marginLeft: 4,
      color: '#007B8E',
      fontSize: 14,
      fontWeight: '500',
    },
    setDefaultButtonText: {
      marginLeft: 4,
      color: '#B8860B',
      fontSize: 14,
      fontWeight: '500',
    },
  });

const createNoLocationPopupStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    popupContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    iconContainer: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: '#FF6B6B20',
      borderRadius: 50,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      fontSize: 16,
      color: `${colors.text}CC`,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    primaryButton: {
      backgroundColor: '#007B8E',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: `${colors.text}40`,
    },
    primaryButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    buttonIcon: {
      marginRight: 4,
    },
  });

export default LocationPicker;