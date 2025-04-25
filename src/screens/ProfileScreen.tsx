import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl,
  Animated,
  Appearance,
  useColorScheme,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';
import EnhancedProfilePhoto from './EnhancedProfilePhoto';
import BackTabTop from './BackTopTab';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, RootTabParamList} from '../types/types';

const {width} = Dimensions.get('window');

// Define your theme colors
const themeColors = {
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    primary: '#007B8E',
    text: '#333333',
    secondary: '#666666',
    skeleton: '#E1E9EE',
    border: '#E0E0E0',
  },
  dark: {
    background: '#161c24',
    card: '#272d36',
    primary: '#007B8E',
    text: '#f3f4f6',
    secondary: '#cccccc',
    skeleton: '#3B3B3B',
    border: '#3d4654',
  },
};

// Skeleton Loader Component with theme support
const SkeletonLoader: React.FC = () => {
  const fadeAnim = new Animated.Value(0.3);
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnim]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: currentColors.background}]}>
      <StatusBar backgroundColor={currentColors.background} barStyle="light-content" />
      <BackTabTop screenName="Profile" />
      <ScrollView>
        {/* Profile Card Skeleton */}
        <Animated.View 
          style={[
            styles.profileCard, 
            {opacity: fadeAnim, backgroundColor: currentColors.card}
          ]}>
          <View style={styles.profileImageContainer}>
            <View style={[styles.skeletonProfileImage, {backgroundColor: currentColors.skeleton}]} />
          </View>
          <View style={styles.profileInfoContainer}>
            <View style={[styles.skeletonLine1, {backgroundColor: currentColors.skeleton}]} />
            <View style={[styles.skeletonLine2, {backgroundColor: currentColors.skeleton}]} />
            <View style={[styles.skeletonLine3, {backgroundColor: currentColors.skeleton}]} />
            <View style={[styles.skeletonEditButton, {backgroundColor: currentColors.skeleton}]} />
          </View>
        </Animated.View>

        {/* Tab Navigation Skeleton */}
        <View style={styles.tabContainer}>
          <View style={[styles.skeletonTab, {backgroundColor: currentColors.skeleton}]} />
          <View style={[styles.skeletonTab, {backgroundColor: currentColors.skeleton}]} />
        </View>

        {/* Content Skeleton */}
        <View style={styles.tabContent}>
          <Animated.View 
            style={[
              styles.skeletonInfoCard, 
              {opacity: fadeAnim, backgroundColor: currentColors.skeleton}
            ]} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface DoctorInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
  doctor_phone: string;
  organization_name?: string;
  is_admin: boolean;
  qualification: string;
  patients?: any[];
  doctors_photo: string;
  address?: string;
  blogs?: string[];
}

interface Blog {
  _id: string;
  title: string;
  description: string;
  image?: string;
  genre: string;
  readTime: number;
  status: string;
  createdAt: string;
  doctor_name: string;
}

type DoctorProfileScreenProps = {
  navigation: StackNavigationProp<RootTabParamList, 'Profile'>;
};

// Function to format phone number with space after country code
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Check if the phone number starts with '+' and has at least 3 characters
  if (phone.startsWith('+') && phone.length >= 3) {
    // Insert a space after the country code (first 2 digits after the '+')
    return `${phone.substring(0, 3)} ${phone.substring(3)}`;
  }
  
  return phone;
};

// Function to format date to readable format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options as Intl.DateTimeFormatOptions);
};

const ProfileScreen: React.FC<DoctorProfileScreenProps> = ({navigation}) => {
  const {session} = useSession();
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedTab, setSelectedTab] = useState('about');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogsPage, setBlogsPage] = useState(1);
  const [hasMoreBlogs, setHasMoreBlogs] = useState(true);

  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  const fetchDoctorInfo = async () => {
    if (!session.idToken) return;
    try {
      const [doctorResponse, appointmentsResponse] = await Promise.all([
        axiosInstance.get(`/doctor`, {
          headers: {Authorization: `Bearer ${session.idToken}`},
        }),
        axiosInstance.get(`/appointments/getevents`, {
          headers: {Authorization: `Bearer ${session.idToken}`},
        }),
      ]);
      setDoctorInfo(doctorResponse.data);
      setAppointments(appointmentsResponse.data.appointments || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async (page = 1, refresh = false) => {
    if (!session.idToken || !doctorInfo?._id) return;
    
    setBlogsLoading(true);
    try {
      const response = await axiosInstance.get('/blogs', {
        headers: {Authorization: `Bearer ${session.idToken}`},
        params: {
          page,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: -1,
        },
      });
      
      const newBlogs = response.data.data;
      //console.log('Fetched blogs:', newBlogs); // Add logging for debugging
      
      if (refresh) {
        setBlogs(newBlogs);
      } else {
        setBlogs(prev => [...prev, ...newBlogs]);
      }
      
      setHasMoreBlogs(newBlogs.length > 0 && page < response.data.pagination.pages);
      setBlogsPage(page);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      handleError(error);
    } finally {
      setBlogsLoading(false);
    }
  };
  

  useEffect(() => {
    fetchDoctorInfo();
  }, [session.idToken]);

  useEffect(() => {
    if (doctorInfo && selectedTab === 'blogs') {
      fetchBlogs(1, true);
    }
  }, [doctorInfo, selectedTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDoctorInfo();
    if (selectedTab === 'blogs') {
      await fetchBlogs(1, true);
    }
    setRefreshing(false);
  };

  const loadMoreBlogs = () => {
    if (!blogsLoading && hasMoreBlogs) {
      fetchBlogs(blogsPage + 1);
    }
  };

  const navigateToCreateBlog = () => {
    navigation.navigate('CreateBlog');
  };

  const navigateToBlogDetails = (blogId: string) => {
    navigation.navigate('BlogDetails', { blogId });
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  const renderBlogItem = ({ item }: { item: Blog }) => (
    <TouchableOpacity 
      style={[styles.blogCard, { backgroundColor: currentColors.card }]}
      onPress={() => navigateToBlogDetails(item._id)}
    >
      {item.image && (
        <Image 
          source={{ uri: item.image }} 
          style={styles.blogImage} 
          resizeMode="cover"
        />
      )}
      <View style={styles.blogContent}>
        <Text style={[styles.blogTitle, { color: currentColors.text }]}>{item.title}</Text>
        <Text 
          style={[styles.blogDescription, { color: currentColors.secondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
        <View style={styles.blogMeta}>
          <View style={styles.blogMetaItem}>
            <Icon name="book-outline" size={14} color={currentColors.primary} />
            <Text style={[styles.blogMetaText, { color: currentColors.secondary }]}>
              {item.readTime} min read
            </Text>
          </View>
          <View style={styles.blogMetaItem}>
            <Icon name="time-outline" size={14} color={currentColors.primary} />
            <Text style={[styles.blogMetaText, { color: currentColors.secondary }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        <View style={[styles.blogGenre, { backgroundColor: currentColors.background }]}>
          <Text style={{ color: currentColors.primary, fontSize: 12 }}>{item.genre}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'about':
        return (
          <View style={styles.tabContent}>
            <View style={[styles.infoCard, {backgroundColor: currentColors.card}]}>
              <View style={styles.infoHeader}>
                <Icon name="call" size={20} color={currentColors.primary} />
                <Text style={[styles.infoHeaderText, {color: currentColors.text}]}>Contact</Text>
              </View>
              <Text style={[styles.infoText, {color: currentColors.secondary}]}>
                {formatPhoneNumber(doctorInfo?.doctor_phone || '')}
              </Text>
              <Text style={[styles.infoText, {color: currentColors.secondary}]}>
                {doctorInfo?.doctor_email}
              </Text>
            </View>
            
            {/* Statistics section moved to About tab */}
            <View style={[styles.infoCard, {backgroundColor: currentColors.card}]}>
              <View style={styles.infoHeader}>
                <Icon name="stats-chart" size={20} color={currentColors.primary} />
                <Text style={[styles.infoHeaderText, {color: currentColors.text}]}>Statistics</Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { borderRightColor: currentColors.border }]}>
                  <Text style={[styles.statNumber, {color: currentColors.text}]}>
                    {doctorInfo?.patients?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, {color: currentColors.secondary}]}>
                    Patients
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, {color: currentColors.text}]}>
                    {appointments.length}
                  </Text>
                  <Text style={[styles.statLabel, {color: currentColors.secondary}]}>
                    Appointments
                  </Text>
                </View>
                <View style={[styles.statItem, { borderRightColor: currentColors.border, borderTopColor: currentColors.border }]}>
                  <Text style={[styles.statNumber, {color: currentColors.text}]}>
                    {doctorInfo?.blogs?.length || 0}
                  </Text>
                  <Text style={[styles.statLabel, {color: currentColors.secondary}]}>
                    Blogs
                  </Text>
                </View>
                <View style={[styles.statItem, { borderTopColor: currentColors.border }]}>
                  <Text style={[styles.statNumber, {color: currentColors.text}]}>0</Text>
                  <Text style={[styles.statLabel, {color: currentColors.secondary}]}>
                    Reviews
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      case 'blogs':
        return (
          <View style={styles.tabContent}>
            {blogs.length === 0 && !blogsLoading ? (
              <View style={[styles.emptyBlogsContainer, { backgroundColor: currentColors.card }]}>
                <Icon name="document-text-outline" size={50} color={currentColors.primary} />
                <Text style={[styles.emptyBlogsText, { color: currentColors.text }]}>
                  You haven't created any blogs yet
                </Text>
                <TouchableOpacity
                  style={styles.createBlogButton}
                  onPress={navigateToCreateBlog}>
                  <Text style={styles.createBlogButtonText}>Create Your First Blog</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={blogs}
                renderItem={renderBlogItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.blogsList}
                onEndReached={loadMoreBlogs}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  blogsLoading ? (
                    <ActivityIndicator size="small" color={currentColors.primary} style={styles.loadingIndicator} />
                  ) : null
                }
                showsVerticalScrollIndicator={false}
                scrollEnabled={false} // Disable scrolling as parent ScrollView handles it
              />
            )}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: currentColors.background}]}>
      <StatusBar backgroundColor={currentColors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <BackTabTop screenName="Profile" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Profile Card */}
        <View style={[styles.profileCard, {backgroundColor: currentColors.card}]}>
          <View style={styles.profileImageContainer}>
            <EnhancedProfilePhoto
              photoUri={doctorInfo?.doctors_photo}
              size={90}
              defaultImage={require('../assets/profile.png')}
            />
          </View>
          <View style={styles.profileInfoContainer}>
            <Text style={[styles.name, {color: currentColors.text}]}>
               {doctorInfo?.doctor_first_name} {doctorInfo?.doctor_last_name}
            </Text>
            <Text style={[styles.specialization, {color: currentColors.secondary}]}>
              {doctorInfo?.qualification}
            </Text>
            {doctorInfo?.organization_name && (
              <Text style={[styles.organization, {color: currentColors.primary}]}>
                {doctorInfo.organization_name}
              </Text>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('DoctorProfileEdit')}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addBlogButton}
                onPress={navigateToCreateBlog}>
                <Text style={styles.addBlogButtonText}>Add Blog</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, {backgroundColor: currentColors.card}]}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'about' && styles.activeTab]}
            onPress={() => setSelectedTab('about')}>
            <Text style={[styles.tabText, selectedTab === 'about' && styles.activeTabText]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'blogs' && styles.activeTab]}
            onPress={() => setSelectedTab('blogs')}>
            <Text style={[styles.tabText, selectedTab === 'blogs' && styles.activeTabText]}>
              Your Blogs
            </Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    margin: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileInfoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  specialization: {
    fontSize: 15,
    marginBottom: 4,
  },
  organization: {
    fontSize: 15,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#007b8e',
    padding: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  addBlogButton: {
    flexDirection: 'row',
    backgroundColor: '#007B8E',
    padding: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBlogButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    borderRadius: 12,
    padding: 4,
    marginBottom: 9,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007B8E',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 15,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statItem: {
    width: '50%',
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderTopWidth: 0,
    borderRightColor: '#E0E0E0',
    borderTopColor: '#E0E0E0',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  // Blog related styles
  blogsList: {
    paddingBottom: 16,
  },
  blogCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  blogImage: {
    width: '100%',
    height: 150,
  },
  blogContent: {
    padding: 16,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  blogDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  blogMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  blogMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  blogMetaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  blogGenre: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  emptyBlogsContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBlogsText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  createBlogButton: {
    backgroundColor: '#007B8E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  createBlogButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginVertical: 16,
  },
  // Skeleton Loader Styles
  skeletonProfileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  skeletonLine1: {
    height: 20,
    width: '70%',
    marginBottom: 8,
  },
  skeletonLine2: {
    height: 15,
    width: '50%',
    marginBottom: 4,
  },
  skeletonLine3: {
    height: 15,
    width: '60%',
    marginBottom: 16,
  },
  skeletonEditButton: {
    width: 80,
    height: 30,
    borderRadius: 10,
  },
  skeletonTab: {
    flex: 1,
    height: 40,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  skeletonInfoCard: {
    height: 150,
    borderRadius: 12,
  },
});

export default ProfileScreen;