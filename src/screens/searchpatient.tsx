import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from '@react-navigation/native';
import axios from 'axios';
import {useSession} from '../context/SessionContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email: string;
}

interface Props {
  navigation: NavigationProp<ParamListBase>;
}

const SearchPatients: React.FC<Props> = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  const {session} = useSession();

  useEffect(() => {
    // Auto-focus the search input when component mounts
    const focusTimeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100); // Small delay to ensure component is fully mounted

    return () => clearTimeout(focusTimeout);
  }, []);

  useEffect(() => {
    // Clear any existing timeout to prevent multiple searches
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is empty
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    // Set a small timeout to wait for user to finish typing
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      // Modified to make a GET request that supports partial phone number and any part of name
      const response = await axiosInstance.get(
        `/search/patient?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );
      setSearchResults(response.data.patients);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setSearchResults([]);
      } else {
        console.error('Error searching patients:', error);
        setSearchResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // For locally filtering results if backend search isn't customizable
  const localFilterPatients = (
    patients: Patient[],
    query: string,
  ): Patient[] => {
    if (!query.trim()) return patients;

    const normalizedQuery = query.toLowerCase().trim();

    return patients.filter(patient => {
      const fullName =
        `${patient.patient_first_name} ${patient.patient_last_name}`.toLowerCase();
      const phone = patient.patient_phone;

      // Check if query is part of name (anywhere in the name, not just start)
      const nameMatch = fullName.includes(normalizedQuery);

      // Check if query is part of phone number (anywhere in the number)
      const phoneMatch = phone.includes(normalizedQuery);

      return nameMatch || phoneMatch;
    });
  };

  const navigateToPatient = (patientId: string) => {
    navigation.navigate('Patient', {patientId});
  };

  const renderPatientItem = ({item}: {item: Patient}) => (
    <TouchableOpacity
      style={styles.patientItem}
      onPress={() => navigateToPatient(item._id)}>
      <Text style={styles.patientName}>
        {item.patient_first_name} {item.patient_last_name}
      </Text>
      <Text style={styles.patientDetails}>{item.patient_phone}</Text>
      <Text style={styles.patientDetails}>{item.patient_email}</Text>
    </TouchableOpacity>
  );

  // No results component
  const NoResultsMessage = () => (
    <View style={styles.noResultsContainer}>
      <Icon name="exclamation-circle" size={50} color="#FFFFFF" />
      <Text style={styles.noResultsText}>No patient found</Text>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <BackTabTop screenName="Search" />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchBar}
            placeholder="Search by Name, Number, Email"
            placeholderTextColor="rgba(255, 255, 255, 0.8)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Icon
              name="search"
              size={20}
              color="#FFFFFF"
              style={styles.searchIcon}
            />
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderPatientItem}
            keyExtractor={item => item._id}
            ListEmptyComponent={
              hasSearched && searchQuery.trim() !== '' ? (
                <NoResultsMessage />
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: '#007B8E',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: 20,
      padding: 2,
      marginBottom: 16,
    },
    searchBar: {
      flex: 1,
      fontSize: 16,
      color: '#ffffff',
      paddingLeft: 20,
    },
    searchIcon: {
      marginLeft: 8,
      marginRight: 8,
    },
    searchButton: {
      padding: 10,
    },
    patientItem: {
      backgroundColor: theme.colors.card,
      padding: 15,
      borderRadius: 5,
      marginBottom: 10,
      marginLeft: 5,
      marginRight: 5,
    },
    patientName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    patientDetails: {
      fontSize: 14,
      color: theme.colors.text,
    },
    noResultsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      marginTop: 50,
    },
    noResultsText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 10,
      textAlign: 'center',
    },
  });

export default SearchPatients;
