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
  TextInput,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {Picker} from '@react-native-picker/picker';
import {useSession} from '../context/SessionContext';
import {handleError} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import CustomPicker from './customepicker';
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

// Skeleton animation component
const SkeletonAnimation = ({children}: {children: React.ReactNode}) => {
  const [opacity] = useState(new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return <Animated.View style={{opacity}}>{children}</Animated.View>;
};

// Patient card skeleton component
const PatientCardSkeleton = ({index}: {index: number}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  return (
    <View
      style={[
        styles.patientCard,
        styles.skeletonCard,
        index % 2 === 0 ? styles.leftCard : styles.rightCard,
      ]}
    />
  );
};

// Patient grid skeleton component - simplified version
const PatientGridSkeleton = () => {
  const rows = 10; // 10 rows of 2 cards each = 20 skeleton items

  return (
    <View>
      {/* Existing skeleton rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}>
          <View
            style={{
              flex: 1,
              marginRight: 5,
              height: 40,
              backgroundColor: 'rgba(180, 180, 180, 0.5)',
              borderRadius: 8,
            }}
          />
          <View
            style={{
              flex: 1,
              marginLeft: 5,
              height: 40,
              backgroundColor: 'rgba(180, 180, 180, 0.5)',
              borderRadius: 8,
            }}
          />
        </View>
      ))}
    </View>
  );
};

const AllPatients: React.FC<Props> = ({navigation}) => {
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
  useEffect(() => {
    fetchPatients();
  }, [session]);

  const fetchPatients = async (pageNumber = 1) => {
    if (!session.idToken) return;
    try {
      if (pageNumber === 1) setIsLoading(true);
      const response = await axiosInstance.get(
        `/patient/getall?page=${pageNumber}&limit=20`,
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

  if (isLoading && page === 1) {
    return (
      <View style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="black"
          translucent={false}
        />
        <ImageBackground
          source={require('../assets/bac2.jpg')}
          style={styles.backgroundImage}>
          <BackTabTop screenName="Patients" />
          <View
            style={[styles.container, {height: screenDimensions.height * 0.9}]}>
            <TouchableOpacity
              style={styles.searchContainer}
              onPress={handleSearch}
              activeOpacity={0.7}></TouchableOpacity>
            <View style={styles.filtersContainer1}>
              <View style={styles.filterContainer}>
                <View style={styles.skeletonPicker} />
              </View>
              <View style={styles.filterContainer}>
                <View style={styles.skeletonPicker} />
              </View>
            </View>
            <SkeletonAnimation>
              <PatientGridSkeleton />
            </SkeletonAnimation>
            <TouchableOpacity
              onPress={handleAddPatient}
              style={styles.addButton}>
              <Icon name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }

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

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />
      <ImageBackground
        source={require('../assets/bac2.jpg')}
        style={styles.backgroundImage}>
        <BackTabTop screenName="Patients" />
        <View
          style={[styles.container, {height: screenDimensions.height * 0.9}]}>
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={handleSearch}
            activeOpacity={0.7}>
            <View style={styles.searchInputWrapper}>
              <Text style={styles.searchPlaceholder}>
                Search by Name, Phone number
              </Text>
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
      </ImageBackground>
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
      padding: 16,
      backgroundColor: '#007B8E',
    },
    backgroundImage: {
      flex: 1,
      resizeMode: 'cover',
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#007B8E',
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
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 16,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: {width: 1, height: 1},
      textShadowRadius: 2,
    },
    searchBar: {
      flex: 1,
      marginRight: 8,
      fontSize: 16,
      color: '#ffffff',
    },
    loadingIndicator: {},
    footerContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      marginVertical: 10,
    },
    loadingText: {
      color: theme.colors.text,
      marginTop: 5,
      fontSize: 12,
      textAlign: 'center',
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
    filterLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.colors.text,
      textAlign: 'center',
    },
    picker: {
      backgroundColor: 'transparent',
      color: 'grey',
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
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: '#119FB3',
      justifyContent: 'space-between',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    backButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      marginLeft: 5,
      fontSize: 18,
    },
    searchButton: {
      padding: 10,
    },
    skeletonCard: {
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      height: 40,
      padding: 0,
    },
    skeletonPicker: {
      height: 40,
      backgroundColor: 'rgba(180, 180, 180, 0.5)',
      borderRadius: 20,
    },
  });

export default AllPatients;
