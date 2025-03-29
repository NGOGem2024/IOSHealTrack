import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScaledSize,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useSession} from '../context/SessionContext';
import {handleError} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import CustomPicker from './customepicker';
import {RootStackNavProps} from '../types/types';
import LoadingScreen from '../components/loadingScreen';

interface Props {
  navigation: NavigationProp<ParamListBase>;
}

interface Patient {
  _id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_email: string;
  patient_registration_date: string;
}

const DoctorPatients: React.FC<RootStackNavProps<'MyPatient'>> = ({
  navigation,
}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const {session} = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [filterOption, setFilterOption] = useState('all');
  const [sortOption, setSortOption] = useState('date');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(
    Dimensions.get('window'),
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const updateDimensions = ({window}: {window: ScaledSize}) => {
      setScreenDimensions(window);
    };

    const subscription = Dimensions.addEventListener(
      'change',
      updateDimensions,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const filterOptions = [
    {label: 'All', value: 'all'},
    {label: 'One Week', value: 'oneWeek'},
    {label: 'One Month', value: 'oneMonth'},
    {label: 'One Year', value: 'oneYear'},
  ];

  const sortOptions = [
    {label: 'Sort by Date', value: 'date'},
    {label: 'Sort by Name', value: 'name'},
  ];

  // Updated to fetch only doctor's patients
  const fetchPatients = async (pageNumber = 1) => {
    if (!session.idToken) return;
    try {
      if (pageNumber === 1) setIsLoading(true);
      const response = await axiosInstance.get(
        `/patient/getAllMy?page=${pageNumber}&limit=20`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );
      if (pageNumber === 1) {
        setPatients(response.data.patients);
        setFilteredPatients(response.data.patients);
      } else {
        setPatients(prevPatients => [
          ...prevPatients,
          ...response.data.patients,
        ]);
        setFilteredPatients(prevFiltered => [
          ...prevFiltered,
          ...response.data.patients,
        ]);
      }
      setTotalPages(response.data.totalPages);
      setPage(response.data.currentPage);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [session]);

  const loadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchPatients(page + 1);
    }
  };

  useEffect(() => {
    const filtered = patients.filter(patient => {
      if (filterOption === 'all') {
        return true;
      } else if (filterOption === 'oneWeek') {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(patient.patient_registration_date) >= oneWeekAgo;
      } else if (filterOption === 'oneMonth') {
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return new Date(patient.patient_registration_date) >= oneMonthAgo;
      } else if (filterOption === 'oneYear') {
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        return new Date(patient.patient_registration_date) >= oneYearAgo;
      }
      return true;
    });

    const sorted =
      sortOption === 'date'
        ? filtered.sort((a, b) => {
            const dateA = new Date(a.patient_registration_date);
            const dateB = new Date(b.patient_registration_date);
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            return dateB.getTime() - dateA.getTime();
          })
        : filtered.sort((a, b) => {
            const fullName1 =
              `${a.patient_first_name} ${a.patient_last_name}`.toLowerCase();
            const fullName2 =
              `${b.patient_first_name} ${b.patient_last_name}`.toLowerCase();
            return fullName1.localeCompare(fullName2);
          });

    setFilteredPatients(sorted);
  }, [filterOption, sortOption, patients]);

  const handleAddPatient = () => {
    navigation.navigate('PatientRegister');
  };

  const handleSearch = () => {
    navigation.navigate('SearchPatients');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    try {
      await fetchPatients(1);
    } catch (error) {
      handleError(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const navigateToPatient = (patientId: string) => {
    if (patientId) {
      navigation.navigate('Patient', {patientId});
    } else {
      handleError(new Error('Invalid patient ID'));
    }
  };

  const renderFooter = () => {
    if (page >= totalPages) return null;

    return (
      <TouchableOpacity
        onPress={loadMore}
        style={styles.loadMoreButton}
        disabled={isLoadingMore}>
        <Text style={styles.loadMoreButtonText}>
          {isLoadingMore ? 'Loading..' : 'Load More'}
        </Text>
        {isLoadingMore && (
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.loadingIndicator}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderPatientItem = ({item, index}: {item: Patient; index: number}) => (
    <TouchableOpacity
      onPress={() => navigateToPatient(item._id)}
      style={[
        styles.patientCard,
        index % 2 === 0 ? styles.leftCard : styles.rightCard,
      ]}>
      <Text style={styles.patientName}>
        {item.patient_first_name} {item.patient_last_name}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" translucent={false} />
        <LoadingScreen />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />
        <BackTabTop screenName="My Patients" />
        <View
          style={[styles.container, {height: screenDimensions.height * 0.9}]}>
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={handleSearch}
            activeOpacity={0.7}>
            <View style={styles.searchInputWrapper}>
              
              <Text style={styles.searchPlaceholder}>Search by Name, Phone number</Text>
              <Icon
                name="search"
                size={18}
                color="#ffffff"
                style={styles.searchIcon}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.filtersContainer1}>
            <View style={styles.filterContainer}>
              <CustomPicker
                selectedValue={filterOption}
                onValueChange={value => setFilterOption(value)}
                items={filterOptions}
              />
            </View>
            <View style={styles.filterContainer}>
              <CustomPicker
                selectedValue={sortOption}
                onValueChange={value => setSortOption(value)}
                items={sortOptions}
              />
            </View>
          </View>
          <FlatList
            data={filteredPatients}
            keyExtractor={item => item._id}
            renderItem={renderPatientItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
          />
          <TouchableOpacity onPress={handleAddPatient} style={styles.addButton}>
            <Icon name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
    </SafeAreaView>
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
      padding: 16,
      backgroundColor: '#007B8E',
    },
    backgroundImage: {
      flex: 1,
      resizeMode: 'cover',
    },
    searchContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: 20,
      marginBottom: 16,
      height: 50,
      justifyContent: 'center',
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchPlaceholder: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      flex: 1,
    },
    filtersContainer1: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    filterContainer: {
      flex: 1,
      marginRight: 8,
      borderRadius: 20,
      overflow: 'hidden',
    },
    patientCard: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      elevation: 4,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    leftCard: {
      marginRight: 5,
    },
    rightCard: {
      marginLeft: 5,
    },
    row: {
      flex: 1,
      justifyContent: 'space-between',
    },
    patientName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    addButton: {
      backgroundColor: '#119FB3',
      borderRadius: 50,
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      bottom: 20,
      right: 20,
      elevation: 3,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
    },
    loadMoreButton: {
      backgroundColor: theme.colors.card,
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      marginVertical: 10,
    },
    loadMoreButtonText: {
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    loadingIndicator: {},
  });

export default DoctorPatients;
