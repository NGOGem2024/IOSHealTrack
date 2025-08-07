import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import Icon1 from 'react-native-vector-icons/Ionicons';

const {width} = Dimensions.get('window');

interface Location {
  id: string;
  name: string;
  locationId: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressLink?: string; // Added address link field
}

interface OrganizationLocationsProps {
  locations: Location[];
  onLocationsChange: (locations: Location[]) => void;
}

const OrganizationLocations: React.FC<OrganizationLocationsProps> = ({
  locations,
  onLocationsChange,
}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationId, setNewLocationId] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newCountry, setNewCountry] = useState('India'); // Default to India
  const [newLandmark, setNewLandmark] = useState('');
  const [newAddressLink, setNewAddressLink] = useState(''); // Added address link state
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );

  const validatePincode = (pincode: string) => {
    // Indian pincode validation (6 digits)
    const indianPincodeRegex = /^[1-9][0-9]{5}$/;
    return indianPincodeRegex.test(pincode);
  };

  const validateURL = (url: string) => {
    if (!url.trim()) return true; // Empty URL is valid (optional field)
    
    // Basic URL validation
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlRegex.test(url.trim());
  };

  const formatAddress = (location: Location) => {
    const addressParts = [
      location.street,
      location.city,
      location.state,
      location.pincode,
      location.country,
    ].filter(part => part && part.trim()); // Added null check before trim
    
    return addressParts.join(', ');
  };

  const handleAddLocation = () => {
    // Safe trim function to handle undefined values
    const safeTrim = (value: string | undefined) => (value || '').trim();
    
    // Get trimmed values safely
    const trimmedName = safeTrim(newLocationName);
    const trimmedLocationId = safeTrim(newLocationId);
    const trimmedStreet = safeTrim(newStreet);
    const trimmedCity = safeTrim(newCity);
    const trimmedState = safeTrim(newState);
    const trimmedPincode = safeTrim(newPincode);
    const trimmedCountry = safeTrim(newCountry);
    const trimmedLandmark = safeTrim(newLandmark);
    const trimmedAddressLink = safeTrim(newAddressLink); // Added address link validation

    // Comprehensive validation
    if (
      !trimmedName ||
      !trimmedLocationId ||
      !trimmedStreet ||
      !trimmedCity ||
      !trimmedState ||
      !trimmedPincode ||
      !trimmedCountry
    ) {
      Alert.alert(
        'Invalid Input',
        'Please fill in all required fields (Name, ID, Street, City, State, Pincode, Country)',
      );
      return;
    }

    // Validate pincode format
    if (!validatePincode(trimmedPincode)) {
      Alert.alert(
        'Invalid Pincode',
        'Please enter a valid 6-digit pincode (e.g., 413001)',
      );
      return;
    }

    // Validate address link format (if provided)
    if (trimmedAddressLink && !validateURL(trimmedAddressLink)) {
      Alert.alert(
        'Invalid Address Link',
        'Please enter a valid URL (e.g., https://maps.google.com/...) or leave it empty',
      );
      return;
    }

    // Check if location ID already exists (only when adding new)
    if (
      !editingLocationId &&
      locations.some(loc => loc.locationId === trimmedLocationId)
    ) {
      Alert.alert(
        'Duplicate Location ID',
        'A location with this ID already exists. Please use a unique ID.',
      );
      return;
    }

    if (editingLocationId) {
      // Update existing location
      const updatedLocations = locations.map(location =>
        location.id === editingLocationId
          ? {
              ...location,
              name: trimmedName,
              locationId: trimmedLocationId,
              street: trimmedStreet,
              city: trimmedCity,
              state: trimmedState,
              pincode: trimmedPincode,
              country: trimmedCountry,
              landmark: trimmedLandmark,
              addressLink: trimmedAddressLink || undefined, // Added address link
            }
          : location,
      );

      onLocationsChange(updatedLocations);
    } else {
      // Add new location
      const newLocation: Location = {
        id: Date.now().toString(),
        name: trimmedName,
        locationId: trimmedLocationId,
        street: trimmedStreet,
        city: trimmedCity,
        state: trimmedState,
        pincode: trimmedPincode,
        country: trimmedCountry,
        ...(trimmedAddressLink && { addressLink: trimmedAddressLink }), // Added address link conditionally
      };

      onLocationsChange([...locations, newLocation]);
    }

    // Clear the inputs and close modal
    clearInputs();
  };

  const handleEditLocation = (location: Location) => {
    setNewLocationName(location.name || '');
    setNewLocationId(location.locationId || '');
    setNewStreet(location.street || '');
    setNewCity(location.city || '');
    setNewState(location.state || '');
    setNewPincode(location.pincode || '');
    setNewCountry(location.country || 'India');
    setNewAddressLink(location.addressLink || ''); // Added address link
    setEditingLocationId(location.id);
    setShowLocationModal(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to remove this location?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedLocations = locations.filter(
              location => location.id !== locationId,
            );
            onLocationsChange(updatedLocations);
          },
        },
      ],
    );
  };

  const clearInputs = () => {
    setNewLocationName('');
    setNewLocationId('');
    setNewStreet('');
    setNewCity('');
    setNewState('');
    setNewPincode('');
    setNewCountry('India');
    setNewLandmark('');
    setNewAddressLink(''); // Added address link clear
    setEditingLocationId(null);
    setShowLocationModal(false);
  };

  const renderLocationModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLocationModal}
        onRequestClose={clearInputs}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={clearInputs}>
          <TouchableOpacity 
            style={styles.locationModalContent}
            activeOpacity={1}
            onPress={() => {}} // Prevent modal from closing when tapping inside
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.locationModalTitle}>
                {editingLocationId ? 'Edit Location' : 'Add New Location'}
              </Text>

              {/* Basic Information */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeaderText}>Basic Information</Text>
                
                <View style={styles.locationInputGroup}>
                  <TextInput
                    style={styles.locationInput}
                    value={newLocationName || ''} // Added fallback
                    onChangeText={setNewLocationName}
                    placeholder="Clinic Name"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.locationInputGroup}>
                  <TextInput
                    style={styles.locationInput}
                    value={newLocationId || ''} // Added fallback
                    onChangeText={setNewLocationId}
                    placeholder="Clinic ID"
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Address Information */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeaderText}>Address Details</Text>
                
                <View style={styles.locationInputGroup}>
                  <TextInput
                    style={[styles.locationInput, styles.multilineInput]}
                    value={newStreet || ''} // Added fallback
                    onChangeText={setNewStreet}
                    placeholder="Street Address"
                    placeholderTextColor="#999"
                    multiline={true}
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.rowContainer}>
                  <View style={[styles.locationInputGroup, styles.halfWidth]}>
                    <TextInput
                      style={styles.locationInput}
                      value={newCity || ''} // Added fallback
                      onChangeText={setNewCity}
                      placeholder="City"
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={[styles.locationInputGroup, styles.halfWidth]}>
                    <TextInput
                      style={styles.locationInput}
                      value={newState || ''} // Added fallback
                      onChangeText={setNewState}
                      placeholder="State"
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.rowContainer}>
                  <View style={[styles.locationInputGroup, styles.halfWidth]}>
                    <TextInput
                      style={styles.locationInput}
                      value={newPincode || ''} // Added fallback
                      onChangeText={setNewPincode}
                      placeholder="Pincode "
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>

                  <View style={[styles.locationInputGroup, styles.halfWidth]}>
                    <TextInput
                      style={styles.locationInput}
                      value={newCountry || ''} // Added fallback
                      onChangeText={setNewCountry}
                      placeholder="Country"
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Address Link Field */}
                <View style={styles.locationInputGroup}>
                  <TextInput
                    style={styles.locationInput}
                    value={newAddressLink || ''}
                    onChangeText={setNewAddressLink}
                    placeholder="Address Link"
                    placeholderTextColor="#999"
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

              </View>

              <View style={styles.locationModalButtonsRow}>
                <TouchableOpacity
                  style={styles.locationModalCancelButton}
                  onPress={clearInputs}>
                  <Text style={styles.locationModalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.locationModalSaveButton}
                  onPress={handleAddLocation}>
                  <Text style={styles.locationModalSaveButtonText}>
                    {editingLocationId ? 'Update' : 'Add Location'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Icon1 name="location" size={22} color="#007B8E" />
        <Text style={styles.sectionTitle}>Organization Locations</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.locationsDescription}>
          Add multiple locations for your organization. Each location should
          have a unique ID and complete address details for better searchability.
        </Text>

        {locations.length === 0 ? (
          <View style={styles.noLocationsContainer}>
            <Icon1 name="location-outline" size={40} color="#CBD5E0" />
            <Text style={styles.noLocationsText}>No locations added yet</Text>
            <Text style={styles.noLocationsSubText}>
              Add your first location to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={locations}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({item}) => (
              <View style={styles.locationItem}>
                <View style={styles.locationInfo}>
                  <Icon1
                    name="location"
                    size={24}
                    color="#007B8E"
                    style={styles.locationIcon}
                  />
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.locationId} numberOfLines={1}>
                      ID: {item.locationId}
                    </Text>
                    <Text style={styles.locationAddress} numberOfLines={3}>
                      {formatAddress(item)}
                    </Text>
                    {/* Display address link if available */}
                    {item.addressLink && (
                      <TouchableOpacity 
                        style={styles.addressLinkContainer}
                        onPress={() => {
                          // Here you can add logic to open the link
                          // For example: Linking.openURL(item.addressLink)
                        }}>
                        <Icon1 name="link" size={14} color="#007B8E" />
                        <Text style={styles.addressLinkText} numberOfLines={1}>
                          View on Map
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.locationActions}>
                  <TouchableOpacity
                    style={styles.locationEditButton}
                    onPress={() => handleEditLocation(item)}>
                    <Icon1 name="create-outline" size={20} color="#007B8E" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.locationDeleteButton}
                    onPress={() => handleDeleteLocation(item.id)}>
                    <Icon1 name="trash-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => (
              <View style={styles.locationSeparator} />
            )}
          />
        )}

        <TouchableOpacity
          style={styles.addLocationButton}
          onPress={() => {
            clearInputs();
            setShowLocationModal(true);
          }}>
          <Icon1 name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addLocationButtonText}>Add Location</Text>
        </TouchableOpacity>
      </View>

      {renderLocationModal()}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 4,
      borderLeftColor: '#007b8e',
      paddingLeft: 12,
      marginBottom: 15,
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#007b8e',
      letterSpacing: 0.5,
      marginLeft: 8,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderColor: '#007b8e',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
      padding: 16,
    },
    locationsDescription: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 20,
      lineHeight: 20,
    },
    noLocationsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 30,
    },
    noLocationsText: {
      color: '#94A3B8',
      fontSize: 16,
      marginTop: 10,
      fontWeight: '600',
    },
    noLocationsSubText: {
      color: '#CBD5E0',
      fontSize: 14,
      marginTop: 5,
    },
    locationItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 14,
      backgroundColor: theme.colors.secondary,
      borderRadius: 10,
    },
    locationInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    locationIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    locationTextContainer: {
      flex: 1,
    },
    locationName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    locationId: {
      fontSize: 13,
      color: '#007B8E',
      marginTop: 2,
      fontWeight: '500',
    },
    locationAddress: {
      fontSize: 13,
      color: '#64748B',
      marginTop: 4,
      lineHeight: 18,
    },
    locationLandmark: {
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 4,
      fontStyle: 'italic',
    },
    // Added styles for address link
    addressLinkContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    addressLinkText: {
      fontSize: 12,
      color: '#007B8E',
      marginLeft: 4,
      textDecorationLine: 'underline',
    },
    locationActions: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 2,
    },
    locationEditButton: {
      padding: 8,
      marginRight: 5,
    },
    locationDeleteButton: {
      padding: 8,
    },
    locationSeparator: {
      height: 1,
      backgroundColor: '#E2E8F0',
      marginVertical: 10,
    },
    addLocationButton: {
      backgroundColor: '#007B8E',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    addLocationButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationModalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 15,
      padding: 20,
      width: width * 0.95,
      maxWidth: 450,
      maxHeight: '90%',
    },
    locationModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#007B8E',
      marginBottom: 20,
      textAlign: 'center',
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionHeaderText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2C3E50',
      marginBottom: 15,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    locationInputGroup: {
      marginBottom: 16,
    },
    locationInput: {
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      height: 50,
      paddingHorizontal: 16,
      fontSize: 16,
      color: '#2C3E50',
    },
    multilineInput: {
      height: 70,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    halfWidth: {
      flex: 0.48,
    },
    locationModalButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    locationModalCancelButton: {
      flex: 1,
      backgroundColor: '#F1F5F9',
      borderRadius: 12,
      paddingVertical: 14,
      marginRight: 8,
      alignItems: 'center',
    },
    locationModalCancelButtonText: {
      color: '#64748B',
      fontSize: 16,
      fontWeight: '600',
    },
    locationModalSaveButton: {
      flex: 1,
      backgroundColor: '#007B8E',
      borderRadius: 12,
      paddingVertical: 14,
      marginLeft: 8,
      alignItems: 'center',
    },
    locationModalSaveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  export default OrganizationLocations;