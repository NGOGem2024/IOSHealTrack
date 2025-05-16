import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Appearance,
  Share,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';
import Icon from 'react-native-vector-icons/Ionicons';
import BackTabTop from './BackTopTab';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LoadingScreen from '../components/loadingScreen';

// Define theme colors (same as in ProfileScreen for consistency)
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

const {width} = Dimensions.get('window');

type BlogDetailsScreenProps = {
  route: RouteProp<RootStackParamList, 'BlogDetails'>;
  navigation: StackNavigationProp<RootStackParamList, 'BlogDetails'>;
};

interface Blog {
  imageWithSas: string | undefined;
  _id: string;
  title: string;
  description: string;
  image?: string;
  video?: string;
  genre: string;
  readTime: number;
  status: string;
  createdAt: string;
  doctor_id: string;
  doctor_name: string;
}

// Function to format date to readable format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options = {year: 'numeric', month: 'short', day: 'numeric'};
  return date.toLocaleDateString(
    'en-US',
    options as Intl.DateTimeFormatOptions,
  );
};

const BlogDetailsScreen: React.FC<BlogDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const {blogId} = route.params;
  const {session} = useSession();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    fetchBlogDetails();
  }, [blogId]);

  // Effect to refresh blog data when navigating back to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh data when the screen is focused again
      fetchBlogDetails();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchBlogDetails = async () => {
    if (!session.idToken || !blogId) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/blog/${blogId}`, {
        headers: {Authorization: `Bearer ${session.idToken}`},
      });

      if (response.data.success) {
        setBlog(response.data.data);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBlogDetails();
    } finally {
      setRefreshing(false);
    }
  };

  const handleShare = async () => {
    if (!blog) return;

    try {
      const blogLink = `https://healtrackai.com/blog/${blog._id}`;

      await Share.share({
        message: `Check out this blog: ${
          blog.title
        }\n\n${blog.description.substring(0, 150)}...\n\n${blogLink}`,
        title: blog.title,
        url: blogLink, // This is used by some platforms that support URL sharing
      });
    } catch (error) {
      console.error('Error sharing blog:', error);
    }
  };

  const handleEditBlog = () => {
    if (blog) {
      navigation.navigate('UpdateBlog', {blogId: blog._id});
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          translucent={false}
          backgroundColor="black"
        />
        <LoadingScreen />
      </View>
    );
  }


  if (!blog) {
    return (
      <View
        style={[styles.container, {backgroundColor: currentColors.background}]}>
        <StatusBar
          backgroundColor={currentColors.background}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <BackTabTop screenName="Blog Details" />
        <View style={styles.errorContainer}>
          <Icon
            name="alert-circle-outline"
            size={60}
            color={currentColors.primary}
          />
          <Text style={[styles.errorText, {color: currentColors.text}]}>
            Blog not found or unable to load blog details
          </Text>
          <TouchableOpacity
            style={[styles.refreshButton, {backgroundColor: currentColors.primary}]}
            onPress={fetchBlogDetails}>
            <Icon name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, {backgroundColor: currentColors.background}]}>
      <StatusBar
        backgroundColor={currentColors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <BackTabTop screenName="Blog Details" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentColors.primary]}
            tintColor={currentColors.primary}
            progressBackgroundColor={currentColors.card}
          />
        }>
        {blog.imageWithSas && (
          <Image
            source={{uri: blog.imageWithSas}}
            style={styles.blogImage}
            resizeMode="cover"
          />
        )}

        <View
          style={[styles.blogContainer, {backgroundColor: currentColors.card}]}>
          <View style={styles.blogHeader}>
            <View style={styles.titleContainer}>
              <Text style={[styles.blogTitle, {color: currentColors.text}]}>
                {blog.title}
              </Text>

              <View
                style={[
                  styles.genreContainer,
                  {backgroundColor: currentColors.background},
                ]}>
                <Text
                  style={[styles.genreText, {color: currentColors.primary}]}>
                  {blog.genre}
                </Text>
              </View>
            </View>

            <View style={styles.metaContainer}>
              <View style={styles.authorDateContainer}>
                <Text
                  style={[styles.authorText, {color: currentColors.secondary}]}>
                  By {blog.doctor_name}
                </Text>
                <Text
                  style={[styles.dateText, {color: currentColors.secondary}]}>
                  {formatDate(blog.createdAt)}
                </Text>
              </View>

              <View style={styles.readTimeContainer}>
                <Icon
                  name="time-outline"
                  size={14}
                  color={currentColors.primary}
                />
                <Text
                  style={[
                    styles.readTimeText,
                    {color: currentColors.secondary},
                  ]}>
                  {blog.readTime} min read
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[styles.divider, {backgroundColor: currentColors.border}]}
          />

          <Text style={[styles.blogContent, {color: currentColors.text}]}>
            {blog.description}
          </Text>

          {blog.video && (
            <View style={styles.videoPlaceholder}>
              <Icon
                name="play-circle-outline"
                size={50}
                color={currentColors.primary}
              />
              <Text
                style={[styles.videoText, {color: currentColors.secondary}]}>
                Video content available
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {backgroundColor: currentColors.background},
              ]}
              onPress={handleShare}>
              <Icon
                name="share-social-outline"
                size={22}
                color={currentColors.primary}
              />
              <Text
                style={[styles.actionButtonText, {color: currentColors.text}]}>
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {backgroundColor: currentColors.primary},
              ]}
              onPress={handleEditBlog}>
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={24}
                color="#ffffff"
              />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
  },
  blogImage: {
    width: '100%',
    height: 200,
  },
  blogContainer: {
    flex: 1,
    padding: 20,
  },
  blogHeader: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  blogTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  genreContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorDateContainer: {
    flexDirection: 'column',
  },
  authorText: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  blogContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  videoPlaceholder: {
    height: 180,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  videoText: {
    marginTop: 10,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  editButtonText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default BlogDetailsScreen;