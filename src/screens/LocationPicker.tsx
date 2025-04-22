import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent  } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const { width, height } = Dimensions.get('window');

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onLocationSelected: (latitude: string, longitude: string) => void;
  theme: any; // Pass theme from parent component
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationSelected,
  theme,
}) => {
  const [mapVisible, setMapVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: latitude ? parseFloat(latitude) : 37.78825,
    longitude: longitude ? parseFloat(longitude) : -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  });
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      
      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        setPermissionDenied(true);
        setLoading(false);
        setMapVisible(true);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLoading(false);
      setMapVisible(true);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({
          ...currentLocation,
          latitude,
          longitude,
        });
        if (!selectedLocation.latitude) {
          setSelectedLocation({ latitude, longitude });
        }
        setLoading(false);
        setMapVisible(true);
      },
      (error) => {
        console.error('Error getting current location:', error);
        setLoading(false);
        setMapVisible(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };
  const handleMapPress = (event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  };

  const handleOpenMap = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(url);
      },
      (error) => {
        console.error('Error getting location:', error);
        const url = `https://www.google.com/maps/search/?api=1`;
        Linking.openURL(url); // fallback if location access denied
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };
  const handleConfirmLocation = () => {
    if (selectedLocation.latitude && selectedLocation.longitude) {
      onLocationSelected(
        selectedLocation.latitude.toString(),
        selectedLocation.longitude.toString()
      );
    }
    setMapVisible(false);
  };

  const handleCloseMap = () => {
    setMapVisible(false);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleOpenMap}
        disabled={loading}
      >
        <Icon name="map-marker" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>
          {latitude && longitude ? 'Change Location Coordinates' : 'Add Location Coordinates'}
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      <Modal
        visible={mapVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseMap}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseMap}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Select Location</Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmLocation}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {permissionDenied && (
            <View style={styles.permissionDeniedContainer}>
              <Icon name="alert-circle" size={36} color="#DC2626" />
              <Text style={styles.permissionDeniedText}>
                Location permission denied. You can still select a location manually on the map.
              </Text>
            </View>
          )}

          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={currentLocation}
            onPress={handleMapPress}
          >
            {selectedLocation.latitude && selectedLocation.longitude && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                pinColor="#007B8E"
              />
            )}
          </MapView>

          {selectedLocation.latitude && selectedLocation.longitude && (
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesText}>
                Latitude: {selectedLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordinatesText}>
                Longitude: {selectedLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
          >
            <Icon name="crosshairs-gps" size={24} color="#007B8E" />
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {latitude && longitude && (
        <View style={styles.selectedLocationContainer}>
          <Icon name="map-marker" size={20} color="#007B8E" />
          <View style={styles.coordsTextContainer}>
            <Text style={styles.coordsLabel}>Selected Coordinates:</Text>
            <Text style={styles.coordsText}>
              Lat: {parseFloat(latitude).toFixed(6)}, Long: {parseFloat(longitude).toFixed(6)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007B8E',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: theme.colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 4,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  confirmButton: {
    backgroundColor: '#007B8E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  map: {
    width: '100%',
    height: '80%',
  },
  currentLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  coordinatesContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coordinatesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginVertical: 2,
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#007B8E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  coordsTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  coordsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  coordsText: {
    fontSize: 14,
    color: '#007B8E',
    marginTop: 2,
  },
  permissionDeniedContainer: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  permissionDeniedText: {
    flex: 1,
    marginLeft: 10,
    color: '#7F1D1D',
    fontSize: 14,
  },
});

export default LocationPicker;