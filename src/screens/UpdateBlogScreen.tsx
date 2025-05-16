import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Appearance,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import Icon from 'react-native-vector-icons/Ionicons';
import BackTabTop from './BackTopTab';
import {Picker} from '@react-native-picker/picker';
import BlogImageUploader from './blogimageupload';
import YouTubeVideoManager, {YouTubeVideo} from './videomanager';

// Define theme colors (same as in BlogDetailsScreen for consistency)
const themeColors = {
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    primary: '#007B8E',
    text: '#333333',
    secondary: '#666666',
    skeleton: '#E1E9EE',
    border: '#E0E0E0',
    inputBg: '#F8F9FA',
    error: '#FF4848',
    inputBox: '#F8FAFC',
  },
  dark: {
    background: '#161c24',
    card: '#272d36',
    primary: '#007B8E',
    text: '#f3f4f6',
    secondary: '#cccccc',
    skeleton: '#3B3B3B',
    border: '#3d4654',
    inputBg: '#1e242d',
    error: '#FF6B6B',
    inputBox: '#1E293B',
  },
};

// Read time options for dropdown
const readTimeOptions = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];

type UpdateBlogScreenProps = {
  route: RouteProp<RootStackParamList, 'UpdateBlog'>;
  navigation: StackNavigationProp<RootStackParamList, 'UpdateBlog'>;
};

interface Blog {
  _id: string;
  title: string;
  imageWithSas?: string | undefined;
  description: string;
  image?: string;
  videos?: YouTubeVideo[]; // Updated to use the YouTube videos array
  genre: string;
  readTime: number;
  status: string;
  createdAt: string;
  doctor_id: string;
  doctor_name: string;
}

// Genres available for blogs
const genres = [
  'Mental Health',
  'Physical Health',
  'Nutrition',
  'Wellness',
  'Medical Research',
  'Health Tips',
  'Disease Prevention',
  'Healthcare',
  'Other',
];

const UpdateBlogScreen: React.FC<UpdateBlogScreenProps> = ({
  route,
  navigation,
}) => {
  const {blogId} = route.params;
  const {session} = useSession();
  const scrollViewRef = useRef<ScrollView>(null);

  const [blog, setBlog] = useState<Blog | null>(null);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [genreError, setGenreError] = useState('');
  const [readTime, setReadTime] = useState('');
  const [status, setStatus] = useState('draft');
  const [image, setImage] = useState<any>(null); // Changed to any to match CreateBlogScreen
  const [videos, setVideos] = useState<YouTubeVideo[]>([]); // New state for YouTube videos
  const [imageRemoved, setImageRemoved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false); // For image upload indicator
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Error notification states
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields] = useState<string[]>([]);

  // States for iOS picker modals
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showReadTimeModal, setShowReadTimeModal] = useState(false);
  const [tempGenre, setTempGenre] = useState('');
  const [tempReadTime, setTempReadTime] = useState('');

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
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    fetchBlogDetails();
  }, [blogId]);

  // Clear errors when inputs change
  useEffect(() => {
    if (title.trim()) setTitleError('');
    if (genre) setGenreError('');

    // Check description length on change
    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount >= 50) setDescriptionError('');

    // If any validation errors were fixed, clear the error banner
    if (title.trim() && genre && wordCount >= 50) {
      setHasError(false);
      setErrorMessage('');
      setErrorFields([]);
    }
  }, [title, description, genre]);

  const scrollToField = (fieldName: string) => {
    // Use measurements to scroll to the appropriate position
    switch (fieldName) {
      case 'title':
        scrollViewRef.current?.scrollTo({y: 0, animated: true});
        break;
      case 'description':
        scrollViewRef.current?.scrollTo({y: 100, animated: true});
        break;
      case 'genre':
        scrollViewRef.current?.scrollTo({y: 300, animated: true});
        break;
      default:
        scrollViewRef.current?.scrollToEnd({animated: true});
    }
  };

  const fetchBlogDetails = async () => {
    if (!session.idToken || !blogId) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/blog/${blogId}`, {
        headers: {Authorization: `Bearer ${session.idToken}`},
      });

      if (response.data.success) {
        const blogData = response.data.data;
        setBlog(blogData);
        setTitle(blogData.title);
        setDescription(blogData.description);
        setGenre(blogData.genre);
        setReadTime(blogData.readTime.toString());
        setStatus(blogData.status);
        setTempGenre(blogData.genre); // Set temp value for picker
        setTempReadTime(blogData.readTime.toString()); // Set temp value for picker

        // Handle image - set as object with uri to match CreateBlogScreen
        if (blogData.image) {
          setImage({
            uri: blogData.imageWithSas,
            type: 'image/jpeg', // Assuming JPEG, adjust if needed
            name: 'blog_image.jpg',
          });
        }

        // Handle videos
        if (blogData.videos && Array.isArray(blogData.videos)) {
          setVideos(blogData.videos);
        }
      }
    } catch (error) {
      setHasError(true);
      setErrorMessage('Failed to load blog details. Please try again.');
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errorList: string[] = [];

    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
      errorList.push('title');
    }

    // Validate genre
    if (!genre) {
      setGenreError('Please select a genre');
      isValid = false;
      errorList.push('genre');
    }

    // Validate description length
    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount < 50) {
      setDescriptionError(
        `Description is too short. Current: ${wordCount} words, minimum required: 50 words`,
      );
      isValid = false;
      errorList.push('description');
    }

    // Set error fields for scrolling
    setErrorFields(errorList);

    // If validation failed, show error banner
    if (!isValid) {
      // Scroll to the first error
      if (errorList.length > 0) {
        setTimeout(() => {
          scrollToField(errorList[0]);
        }, 100);
      }
    }

    return isValid;
  };

  const handleUpdateBlog = async () => {
    // Validate form first
    Keyboard.dismiss();
    if (!validateForm()) {
      return;
    }

    setUpdating(true);
    try {
      // Create a FormData object for multipart/form-data submission
      const blogFormData = new FormData();

      // Add text fields
      blogFormData.append('title', title);
      blogFormData.append('description', description);
      blogFormData.append('genre', genre);
      blogFormData.append('readTime', readTime);
      blogFormData.append('status', status);

      // Add removeImage flag if the image was removed
      if (imageRemoved) {
        blogFormData.append('removeImage', 'true');
      }

      // Add image if exists and was not removed
      if (image && !imageRemoved) {
        const imageFile = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || 'blog_image.jpg',
        };
        blogFormData.append('image', imageFile);
      }

      // Add videos if they exist
      if (videos && videos.length > 0) {
        // Convert videos array to JSON string
        blogFormData.append('videos', JSON.stringify(videos));
      }

      console.log(
        'Form data being sent:',
        JSON.stringify({
          removeImage: imageRemoved ? 'true' : 'false',
          hasImage: image ? 'yes' : 'no',
        }),
      );

      const response = await axiosInstance.put(
        `/update/blog/${blogId}`,
        blogFormData,
        {
          headers: {
            Authorization: `Bearer ${session.idToken}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data.success) {
        showSuccessToast('Blog updated successfully');
        navigation.navigate('BlogDetails', {blogId});
      }
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        setIsPermissionError(true);
        setHasError(true);
        setErrorMessage("You don't have permission to update this blog");
      } else {
        setHasError(true);
        setErrorMessage(
          error.response?.data?.message ||
            'Failed to update blog. Please check your connection and try again.',
        );
        handleError(error);
      }

      // Scroll to top to show error banner
      scrollViewRef.current?.scrollTo({y: 0, animated: true});
    } finally {
      setUpdating(false);
    }
  };

  // Image handling functions
  const handleImageSelected = (imageData: any) => {
    // Update the form data with the selected image
    setImage(imageData);

    // Show uploading indicator for better user experience
    setIsUploadingImage(true);
    setTimeout(() => {
      setIsUploadingImage(false);
    }, 1000); // Just to show the indicator briefly for UX feedback
  };

  const handleImageRemoved = () => {
    setImage(null);
    setImageRemoved(true);
  };

  // YouTube videos handling
  const handleVideosChange = (updatedVideos: YouTubeVideo[]) => {
    setVideos(updatedVideos);
  };

  const calculateReadTime = () => {
    // Average reading speed: 200-250 words per minute
    const wordCount = description.trim().split(/\s+/).length;
    const estimatedTime = Math.ceil(wordCount / 200);

    // Make sure the estimated time is within our dropdown options
    if (estimatedTime < 2) {
      setReadTime('2');
      setTempReadTime('2');
    } else if (estimatedTime > 10) {
      setReadTime('10');
      setTempReadTime('10');
    } else {
      setReadTime(estimatedTime.toString());
      setTempReadTime(estimatedTime.toString());
    }
  };

  const dismissErrorBanner = () => {
    setHasError(false);
    setErrorMessage('');
  };

  // Function to render the Picker component based on the platform
  const renderPicker = (
    type: 'genre' | 'readTime',
    value: string,
    onValueChange: (value: string) => void,
    options: string[],
    labelFormatter?: (value: string) => string,
  ) => {
    // For iOS, we'll show a custom touchable that opens a modal
    if (Platform.OS === 'ios') {
      const displayValue = type === 'readTime' ? `${value} min` : value;

      return (
        <TouchableOpacity
          style={[
            styles.iosPickerButton,
            {
              backgroundColor: currentColors.inputBox,
              borderColor:
                type === 'genre' && genreError
                  ? currentColors.error
                  : currentColors.border,
            },
          ]}
          onPress={() => {
            if (type === 'genre') {
              setShowGenreModal(true);
              setTempGenre(value);
            } else {
              setShowReadTimeModal(true);
              setTempReadTime(value);
            }
          }}>
          <Text style={{color: currentColors.text}}>{displayValue}</Text>
          <Icon name="chevron-down" size={20} color={currentColors.primary} />
        </TouchableOpacity>
      );
    }

    // For Android, use the regular Picker
    return (
      <View
        style={[
          styles.pickerContainer,
          {
            backgroundColor: currentColors.inputBox,
            borderColor:
              type === 'genre' && genreError
                ? currentColors.error
                : currentColors.border,
          },
        ]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={{color: currentColors.text}}
          dropdownIconColor={currentColors.text}>
          {options.map(option => (
            <Picker.Item
              key={option}
              label={labelFormatter ? labelFormatter(option) : option}
              value={option}
            />
          ))}
        </Picker>
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={[styles.container, {backgroundColor: currentColors.background}]}>
        <StatusBar
          backgroundColor={currentColors.background}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <BackTabTop screenName="Update Blog" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentColors.primary} />
        </View>
      </View>
    );
  }

  if (!blog || isPermissionError) {
    return (
      <View
        style={[styles.container, {backgroundColor: currentColors.background}]}>
        <StatusBar
          backgroundColor={currentColors.background}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <BackTabTop screenName="Update Blog" />
        <View style={styles.errorContainer}>
          <Icon
            name="alert-circle-outline"
            size={60}
            color={currentColors.primary}
          />
          <Text style={[styles.errorText, {color: currentColors.text}]}>
            {isPermissionError
              ? "You don't have permission to edit this blog"
              : 'Blog not found or unable to load blog details'}
          </Text>
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
      <BackTabTop screenName="Update Blog" />

      {/* Error Banner */}
      {hasError && (
        <View
          style={[styles.errorBanner, {backgroundColor: currentColors.error}]}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
          <TouchableOpacity onPress={dismissErrorBanner}>
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{flex: 1}}>
         <View style={{flex: 1}}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{paddingBottom: 0}} // Add extra padding at bottom
          keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.formContainer,
              {backgroundColor: currentColors.card},
            ]}>
            <View style={styles.sectionHeader}>
              <Icon
                name="document-text-outline"
                size={22}
                color={currentColors.primary}
              />
              <Text
                style={[styles.sectionTitle, {color: currentColors.primary}]}>
                Blog Content
              </Text>
            </View>

            <View style={[styles.card, {backgroundColor: currentColors.card}]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, {color: currentColors.text}]}>
                  Title{' '}
                  {titleError && (
                    <Text style={{color: currentColors.error}}>*</Text>
                  )}
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: currentColors.inputBox,
                      borderColor: titleError
                        ? currentColors.error
                        : currentColors.border,
                    },
                  ]}>
                  <Icon
                    name="text-outline"
                    size={20}
                    color={
                      titleError ? currentColors.error : currentColors.primary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, {color: currentColors.text}]}
                    placeholder="Enter blog title"
                    placeholderTextColor={currentColors.secondary}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
                {titleError ? (
                  <Text
                    style={[
                      styles.fieldErrorText,
                      {color: currentColors.error},
                    ]}>
                    {titleError}
                  </Text>
                ) : null}
              </View>

              <View style={[styles.inputGroup, styles.inputBorder]}>
                <Text style={[styles.label, {color: currentColors.text}]}>
                  Description{' '}
                  {descriptionError && (
                    <Text style={{color: currentColors.error}}>*</Text>
                  )}
                </Text>
                <View
                  style={[
                    styles.textAreaWrapper,
                    {
                      backgroundColor: currentColors.inputBox,
                      borderColor: descriptionError
                        ? currentColors.error
                        : currentColors.border,
                    },
                  ]}>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        color: currentColors.text,
                        backgroundColor: currentColors.inputBox,
                      },
                    ]}
                    placeholder="Write your blog content here..."
                    placeholderTextColor={currentColors.secondary}
                    multiline
                    numberOfLines={6}
                    value={description}
                    onChangeText={setDescription}
                    onBlur={calculateReadTime}
                  />
                </View>
                {descriptionError ? (
                  <Text
                    style={[
                      styles.fieldErrorText,
                      {color: currentColors.error},
                    ]}>
                    {descriptionError}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Icon
                name="pricetags-outline"
                size={22}
                color={currentColors.primary}
              />
              <Text
                style={[styles.sectionTitle, {color: currentColors.primary}]}>
                Blog Details
              </Text>
            </View>

            <View style={[styles.card, {backgroundColor: currentColors.card}]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, {color: currentColors.text}]}>
                  Genre{' '}
                  {genreError && (
                    <Text style={{color: currentColors.error}}>*</Text>
                  )}
                </Text>
                {renderPicker('genre', genre, setGenre, genres)}
                {genreError ? (
                  <Text
                    style={[
                      styles.fieldErrorText,
                      {color: currentColors.error},
                    ]}>
                    {genreError}
                  </Text>
                ) : null}
              </View>

              <View style={[styles.inputGroup, styles.inputBorder]}>
                <Text style={[styles.label, {color: currentColors.text}]}>
                  Read Time (minutes)
                </Text>
                {renderPicker(
                  'readTime',
                  readTime,
                  setReadTime,
                  readTimeOptions,
                  option => `${option} min`,
                )}
                <Text
                  style={[styles.helperText, {color: currentColors.secondary}]}>
                  Auto-calculated based on word count, but you can adjust it
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Icon
                name="images-outline"
                size={22}
                color={currentColors.primary}
              />
              <Text
                style={[styles.sectionTitle, {color: currentColors.primary}]}>
                Media
              </Text>
            </View>

            <View style={[styles.card, {backgroundColor: currentColors.card}]}>
              <Text
                style={[
                  styles.videosDescription,
                  {color: currentColors.secondary},
                ]}>
                Add images or videos to make your blog post more engaging.
              </Text>

              {/* BlogImageUploader component for selecting and previewing images */}
              <View style={styles.blogImageUploaderContainer}>
                <Text style={[styles.label, {color: currentColors.text}]}>
                  Featured Image
                </Text>
                <BlogImageUploader
                  onImageSelected={handleImageSelected}
                  onImageRemoved={handleImageRemoved}
                  initialImage={image?.uri || null}
                  isUploading={isUploadingImage}
                />
              </View>

              {/* YouTube Video Manager Component */}
              <View style={styles.videoManagerContainer}>
                <Text style={[styles.label, {color: currentColors.text}]}>
                  YouTube Videos
                </Text>
                <YouTubeVideoManager
                  videos={videos}
                  onChange={handleVideosChange}
                  themeColors={currentColors}
                />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Icon
                name="flag-outline"
                size={22}
                color={currentColors.primary}
              />
              <Text
                style={[styles.sectionTitle, {color: currentColors.primary}]}>
                Status
              </Text>
            </View>

            <View style={[styles.card, {backgroundColor: currentColors.card}]}>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === 'draft' && styles.activeStatusButton,
                    {
                      backgroundColor:
                        status === 'draft'
                          ? currentColors.primary
                          : currentColors.inputBox,
                      borderColor: currentColors.border,
                    },
                  ]}
                  onPress={() => setStatus('draft')}>
                  <Text
                    style={[
                      styles.statusButtonText,
                      {
                        color: status === 'draft' ? '#fff' : currentColors.text,
                      },
                    ]}>
                    Save as Draft
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === 'published' && styles.activeStatusButton,
                    {
                      backgroundColor:
                        status === 'published'
                          ? currentColors.primary
                          : currentColors.inputBox,
                      borderColor: currentColors.border,
                    },
                  ]}
                  onPress={() => setStatus('published')}>
                  <Text
                    style={[
                      styles.statusButtonText,
                      {
                        color:
                          status === 'published' ? '#fff' : currentColors.text,
                      },
                    ]}>
                    Publish Now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {backgroundColor: currentColors.background},
                ]}
                onPress={() => navigation.goBack()}>
                <Text
                  style={[
                    styles.cancelButtonText,
                    {color: currentColors.text},
                  ]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {backgroundColor: currentColors.primary},
                  updating && styles.savingButton,
                ]}
                onPress={handleUpdateBlog}
                disabled={updating}>
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="save-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      {status === 'draft' ? 'Save Draft' : 'Update & Publish'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* iOS Genre Picker Modal */}
      <Modal
        visible={showGenreModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenreModal(false)}>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: currentColors.card},
            ]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowGenreModal(false)}>
                <Text style={{color: currentColors.primary}}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, {color: currentColors.text}]}>
                Select Genre
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setGenre(tempGenre);
                  setShowGenreModal(false);
                }}>
                <Text style={{color: currentColors.primary}}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={tempGenre}
              onValueChange={setTempGenre}
              itemStyle={{color: currentColors.text, height: 150}}>
              {genres.map(option => (
                <Picker.Item
                  key={option}
                  label={option}
                  value={option}
                  color={isDarkMode ? '#fff' : '#000'}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* iOS Read Time Picker Modal */}
      <Modal
        visible={showReadTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReadTimeModal(false)}>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: currentColors.card},
            ]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowReadTimeModal(false)}>
                <Text style={{color: currentColors.primary}}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, {color: currentColors.text}]}>
                Select Read Time
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReadTime(tempReadTime);
                  setShowReadTimeModal(false);
                }}>
                <Text style={{color: currentColors.primary}}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={tempReadTime}
              onValueChange={setTempReadTime}
              itemStyle={{color: currentColors.text, height: 150}}>
              {readTimeOptions.map(option => (
                <Picker.Item
                  key={option}
                  label={`${option} min`}
                  value={option}
                  color={isDarkMode ? '#fff' : '#000'}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorBannerText: {
    color: 'gray',
  },
  errorBannerClose: {
    color: 'gray',
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
  },
  // New error banner styles
  errorBanner: {
    backgroundColor: '#FF4848',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  fieldErrorText: {
    color: 'gray',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    paddingHorizontal: 15,
  },
  fixedActionButtons: {
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  card: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputBorder: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
  },
  iosPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 12,
  },
  textAreaWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  textArea: {
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 5,
  },
  activeStatusButton: {
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  blogImageUploaderContainer: {
    marginBottom: 16,
  },
  videoManagerContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 16,
    borderColor: '#E2E8F0',
  },
  videosDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
  },
  savingButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UpdateBlogScreen;
