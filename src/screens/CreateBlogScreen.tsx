import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import axiosInstance from '../utils/axiosConfig';
import Icon from 'react-native-vector-icons/Ionicons';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import {useColorScheme} from 'react-native';
import BackTabTop from './BackTopTab';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, RootTabParamList} from '../types/types';
import {useNavigation} from '@react-navigation/native';
import BlogImageUploader from './blogimageupload';
import YouTubeVideoManager, {YouTubeVideo} from './videomanager';
import {Picker} from '@react-native-picker/picker';

interface BlogFormData {
  title: string;
  description: string;
  image: any;
  videos: YouTubeVideo[];
  genre: string;
  readTime: string;
  status: 'draft' | 'published';
}

type blogNavigationProp = NativeStackNavigationProp<RootTabParamList>;

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

// Read time options for dropdown
const readTimeOptions = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];

const themeColors = {
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    primary: '#007B8E',
    text: '#333333',
    secondary: '#666666',
    skeleton: '#E1E9EE',
    border: '#E2E8F0',
    inputBox: '#F8FAFC',
    placeholder: 'gray',
    error: '#FF6B6B',
    pickerText: '#333333', // Added specific text color for picker
    pickerBackground: '#F8FAFC', // Added specific background for picker
  },
  dark: {
    background: '#161c24',
    card: '#272d36',
    primary: '#007B8E',
    text: '#f3f4f6',
    secondary: '#cccccc',
    skeleton: '#3B3B3B',
    border: '#3E4C59',
    inputBox: '#1E293B',
    placeholder: 'gray',
    error: '#FF6B6B',
    pickerText: '#f3f4f6', // Added specific text color for picker in dark mode
    pickerBackground: '#1E293B', // Added specific background for picker in dark mode
  },
};

const CreateBlogScreen: React.FC = () => {
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    description: '',
    image: null,
    videos: [],
    genre: genres[0],
    readTime: readTimeOptions[3],
    status: 'draft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');
  // State for custom picker (iOS)
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showReadTimePicker, setShowReadTimePicker] = useState(false);

  const navigation = useNavigation<blogNavigationProp>();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  const handleInputChange = (
    field: keyof BlogFormData,
    value: string | YouTubeVideo[],
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleImageSelected = (imageData: any) => {
    setFormData({
      ...formData,
      image: imageData,
    });

    setIsUploadingImage(true);
    setTimeout(() => {
      setIsUploadingImage(false);
    }, 1000);
  };

  const handleImageRemoved = () => {
    setFormData({
      ...formData,
      image: null,
    });
  };

  const handleVideosChange = (videos: YouTubeVideo[]) => {
    setFormData({
      ...formData,
      videos: videos,
    });
  };

  const calculateReadTime = () => {
    const wordCount = formData.description.trim().split(/\s+/).length;
    const estimatedTime = Math.ceil(wordCount / 200);

    if (estimatedTime < 2) {
      handleInputChange('readTime', '2');
    } else if (estimatedTime > 10) {
      handleInputChange('readTime', '10');
    } else {
      handleInputChange('readTime', estimatedTime.toString());
    }
  };

  const validateDescription = () => {
    const wordCount = formData.description.trim().split(/\s+/).length;
    if (wordCount < 50) {
      setDescriptionError(
        `Description is too short. Current: ${wordCount} words (minimum 50 words)`,
      );
      return false;
    } else {
      setDescriptionError('');
      return true;
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert(
        'Validation Error',
        'Please enter a title for your blog post',
      );
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert(
        'Validation Error',
        'Please enter a description for your blog post',
      );
      return;
    }

    if (!validateDescription()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const blogFormData = new FormData();

      blogFormData.append('title', formData.title);
      blogFormData.append('description', formData.description);
      blogFormData.append('genre', formData.genre);
      blogFormData.append('readTime', formData.readTime);
      blogFormData.append('status', formData.status);

      if (formData.image) {
        const imageFile = {
          uri: formData.image.uri,
          type: formData.image.type,
          name: formData.image.name,
        };
        blogFormData.append('image', imageFile);
      }

      if (formData.videos && formData.videos.length > 0) {
        blogFormData.append('videos', JSON.stringify(formData.videos));
      }

      const response = await axiosInstance.post('/create/blog', blogFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showSuccessToast('Blog post created successfully');
      navigation.navigate('Profile');
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom picker display for iOS
  const renderIOSPicker = (
    options: string[],
    selectedValue: string,
    fieldName: 'genre' | 'readTime',
    placeholder: string,
    showPicker: boolean,
    setShowPicker: React.Dispatch<React.SetStateAction<boolean>>,
    formatLabel?: (value: string) => string,
  ) => {
    const displayValue = formatLabel
      ? formatLabel(selectedValue)
      : selectedValue;

    return (
      <>
        <TouchableOpacity
          style={[
            styles.inputWrapper,
            {
              backgroundColor: currentColors.inputBox,
              borderColor: currentColors.border,
            },
          ]}
          onPress={() => setShowPicker(true)}>
          <Text style={{color: currentColors.text}}>{displayValue}</Text>
          <Icon name="chevron-down" size={16} color={currentColors.text} />
        </TouchableOpacity>

        {showPicker && (
          <View style={styles.iosPickerOverlay}>
            <View
              style={[
                styles.iosPickerContainer,
                {backgroundColor: currentColors.card},
              ]}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity
                  style={styles.iosPickerButton}
                  onPress={() => setShowPicker(false)}>
                  <Text style={{color: currentColors.primary}}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={selectedValue}
                onValueChange={itemValue =>
                  handleInputChange(fieldName, itemValue)
                }
                itemStyle={{color: currentColors.pickerText}}>
                {options.map(option => (
                  <Picker.Item
                    key={option}
                    label={formatLabel ? formatLabel(option) : option}
                    value={option}
                    color={isDarkMode ? '#ffffff' : undefined}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}
      </>
    );
  };

  const renderMediaOptionsModal = () => {
    return (
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, {backgroundColor: currentColors.card}]}>
          <Text style={[styles.modalTitle, {color: currentColors.primary}]}>
            Add Media
          </Text>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setShowMediaOptions(false);
            }}>
            <Icon
              name="image-outline"
              size={24}
              color={currentColors.primary}
            />
            <Text style={[styles.modalOptionText, {color: currentColors.text}]}>
              Add Image
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowMediaOptions(false)}>
            <Text
              style={[
                styles.modalCancelButtonText,
                {color: currentColors.text},
              ]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, {backgroundColor: currentColors.background}]}>
      <BackTabTop screenName="Add blog" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View
          style={[styles.formContainer, {backgroundColor: currentColors.card}]}>
          <View style={styles.sectionHeader}>
            <Icon
              name="document-text-outline"
              size={22}
              color={currentColors.primary}
            />
            <Text style={[styles.sectionTitle, {color: currentColors.primary}]}>
              Blog Content
            </Text>
          </View>

          <View style={[styles.card, {backgroundColor: currentColors.card}]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, {color: currentColors.text}]}>
                Title
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: currentColors.inputBox,
                    borderColor: currentColors.border,
                  },
                ]}>
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="Enter blog title"
                  placeholderTextColor={currentColors.placeholder}
                  value={formData.title}
                  onChangeText={text => handleInputChange('title', text)}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.inputBorder]}>
              <Text style={[styles.label, {color: currentColors.text}]}>
                Description
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
                  placeholderTextColor={currentColors.placeholder}
                  multiline
                  numberOfLines={6}
                  value={formData.description}
                  onChangeText={text => handleInputChange('description', text)}
                  onBlur={calculateReadTime}
                />
              </View>
              {descriptionError ? (
                <Text style={[styles.errorText, {color: currentColors.error}]}>
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
            <Text style={[styles.sectionTitle, {color: currentColors.primary}]}>
              Blog Details
            </Text>
          </View>

          <View style={[styles.card, {backgroundColor: currentColors.card}]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, {color: currentColors.text}]}>
                Genre
              </Text>
              {Platform.OS === 'ios' ? (
                renderIOSPicker(
                  genres,
                  formData.genre,
                  'genre',
                  'Select genre',
                  showGenrePicker,
                  setShowGenrePicker,
                )
              ) : (
                <View
                  style={[
                    styles.pickerContainer,
                    {
                      backgroundColor: currentColors.pickerBackground,
                      borderColor: currentColors.border,
                    },
                  ]}>
                  <Picker
                    selectedValue={formData.genre}
                    onValueChange={itemValue =>
                      handleInputChange('genre', itemValue)
                    }
                    style={{color: currentColors.pickerText}}
                    dropdownIconColor={currentColors.text}>
                    {genres.map(genreOption => (
                      <Picker.Item
                        key={genreOption}
                        label={genreOption}
                        value={genreOption}
                        color={
                          isDarkMode && Platform.OS === 'android'
                            ? '#ffffff'
                            : undefined
                        }
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <View style={[styles.inputGroup, styles.inputBorder]}>
              <Text style={[styles.label, {color: currentColors.text}]}>
                Read Time (minutes)
              </Text>
              {Platform.OS === 'ios' ? (
                renderIOSPicker(
                  readTimeOptions,
                  formData.readTime,
                  'readTime',
                  'Select read time',
                  showReadTimePicker,
                  setShowReadTimePicker,
                  value => `${value} min`,
                )
              ) : (
                <View
                  style={[
                    styles.pickerContainer,
                    {
                      backgroundColor: currentColors.pickerBackground,
                      borderColor: currentColors.border,
                    },
                  ]}>
                  <Picker
                    selectedValue={formData.readTime}
                    onValueChange={itemValue =>
                      handleInputChange('readTime', itemValue)
                    }
                    style={{color: currentColors.pickerText}}
                    dropdownIconColor={currentColors.text}>
                    {readTimeOptions.map(option => (
                      <Picker.Item
                        key={option}
                        label={`${option} min`}
                        value={option}
                        color={
                          isDarkMode && Platform.OS === 'android'
                            ? '#ffffff'
                            : undefined
                        }
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Icon
              name="images-outline"
              size={22}
              color={currentColors.primary}
            />
            <Text style={[styles.sectionTitle, {color: currentColors.primary}]}>
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

            <View style={styles.blogImageUploaderContainer}>
              <Text style={[styles.label, {color: currentColors.text}]}>
                Featured Image
              </Text>
              <BlogImageUploader
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
                initialImage={formData.image?.uri || null}
                isUploading={isUploadingImage}
              />
            </View>

            <View style={styles.videoManagerContainer}>
              <Text style={[styles.label, {color: currentColors.text}]}>
                YouTube Videos
              </Text>
              <YouTubeVideoManager
                videos={formData.videos}
                onChange={handleVideosChange}
                themeColors={currentColors}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Icon name="flag-outline" size={22} color={currentColors.primary} />
            <Text style={[styles.sectionTitle, {color: currentColors.primary}]}>
              Status
            </Text>
          </View>

          <View style={[styles.card, {backgroundColor: currentColors.card}]}>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  formData.status === 'draft' && styles.activeStatusButton,
                  {
                    backgroundColor:
                      formData.status === 'draft'
                        ? currentColors.primary
                        : currentColors.inputBox,
                    borderColor: currentColors.border,
                  },
                ]}
                onPress={() => handleInputChange('status', 'draft')}>
                <Text
                  style={[
                    styles.statusButtonText,
                    {
                      color:
                        formData.status === 'draft'
                          ? '#fff'
                          : currentColors.text,
                    },
                  ]}>
                  Save as Draft
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  formData.status === 'published' && styles.activeStatusButton,
                  {
                    backgroundColor:
                      formData.status === 'published'
                        ? currentColors.primary
                        : currentColors.inputBox,
                    borderColor: currentColors.border,
                  },
                ]}
                onPress={() => handleInputChange('status', 'published')}>
                <Text
                  style={[
                    styles.statusButtonText,
                    {
                      color:
                        formData.status === 'published'
                          ? '#fff'
                          : currentColors.text,
                    },
                  ]}>
                  Publish Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {backgroundColor: currentColors.primary},
              isSubmitting && styles.savingButton,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="send-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {formData.status === 'draft' ? 'Save Draft' : 'Publish Blog'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showMediaOptions && renderMediaOptionsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 15,
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
    marginBottom: 5,
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
    justifyContent: 'space-between',
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
  // Updated picker styles
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // iOS specific picker styles
  iosPickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    width: '100%',
    backgroundColor: 'white',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  iosPickerButton: {
    paddingHorizontal: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
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
  },
  videosDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  modalCancelButton: {
    paddingTop: 15,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export {themeColors};
export default CreateBlogScreen;
