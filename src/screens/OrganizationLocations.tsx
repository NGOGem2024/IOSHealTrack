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
} from 'react-native';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import Icon1 from 'react-native-vector-icons/Ionicons';

const {width} = Dimensions.get('window');

interface Location {
  id: string;
  name: string;
  locationId: string;
  address: string;
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
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );

  const handleAddLocation = () => {
    // Simple validation
    if (
      !newLocationName.trim() ||
      !newLocationId.trim() ||
      !newLocationAddress.trim()
    ) {
      Alert.alert(
        'Invalid Input',
        'Please fill in all fields for the location',
      );
      return;
    }

    // Check if location ID already exists (only when adding new)
    if (
      !editingLocationId &&
      locations.some(loc => loc.locationId === newLocationId.trim())
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
              name: newLocationName.trim(),
              locationId: newLocationId.trim(),
              address: newLocationAddress.trim(),
            }
          : location,
      );

      onLocationsChange(updatedLocations);
    } else {
      // Add new location
      const newLocation: Location = {
        id: Date.now().toString(),
        name: newLocationName.trim(),
        locationId: newLocationId.trim(),
        address: newLocationAddress.trim(),
      };

      onLocationsChange([...locations, newLocation]);
    }

    // Clear the inputs and close modal
    clearInputs();
  };

  const handleEditLocation = (location: Location) => {
    setNewLocationName(location.name);
    setNewLocationId(location.locationId);
    setNewLocationAddress(location.address);
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
    setNewLocationAddress('');
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
          <View style={styles.locationModalContent}>
            <Text style={styles.locationModalTitle}>
              {editingLocationId ? 'Edit Location' : 'Add New Location'}
            </Text>

            <View style={styles.locationInputGroup}>
              <Text style={styles.locationInputLabel}>Location Name</Text>
              <TextInput
                style={styles.locationInput}
                value={newLocationName}
                onChangeText={setNewLocationName}
                placeholder="Enter location name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.locationInputGroup}>
              <Text style={styles.locationInputLabel}>Location ID</Text>
              <TextInput
                style={styles.locationInput}
                value={newLocationId}
                onChangeText={setNewLocationId}
                placeholder="Enter unique location ID"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.locationInputGroup}>
              <Text style={styles.locationInputLabel}>Address</Text>
              <TextInput
                style={[styles.locationInput, styles.locationAddressInput]}
                value={newLocationAddress}
                onChangeText={setNewLocationAddress}
                placeholder="Enter complete address"
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={3}
              />
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
                  {editingLocationId ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
          have a unique ID for identification purposes.
        </Text>

        {locations.length === 0 ? (
          <View style={styles.noLocationsContainer}>
            <Icon1 name="location-outline" size={40} color="#CBD5E0" />
            <Text style={styles.noLocationsText}>No locations added yet</Text>
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
                    <Text style={styles.locationAddress} numberOfLines={2}>
                      {item.address}
                    </Text>
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
    },
    locationItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.secondary,
      borderRadius: 10,
    },
    locationInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    locationIcon: {
      marginRight: 10,
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
    locationActions: {
      flexDirection: 'row',
      alignItems: 'center',
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
      width: width * 0.9,
      maxWidth: 400,
    },
    locationModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#007B8E',
      marginBottom: 20,
      textAlign: 'center',
    },
    locationInputGroup: {
      marginBottom: 16,
    },
    locationInputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#2C3E50',
      marginBottom: 8,
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
    locationAddressInput: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: 12,
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
