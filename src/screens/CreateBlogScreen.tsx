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

interface BlogFormData {
  title: string;
  description: string;
  image: any;
  video: string | null;
  genre: string;
  readTime: string;
  status: 'draft' | 'published';
}

type blogNavigationProp = NativeStackNavigationProp<RootTabParamList>;

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
  },
};

const CreateBlogScreen: React.FC = () => {
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    description: '',
    image: null,
    video: null,
    genre: '',
    readTime: '',
    status: 'draft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  const navigation = useNavigation<blogNavigationProp>();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  const handleInputChange = (field: keyof BlogFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleImageSelected = (imageData: any) => {
    // Update the form data with the selected image
    setFormData({
      ...formData,
      image: imageData,
    });

    // Show uploading indicator (will be handled during actual submission)
    setIsUploadingImage(true);
    setTimeout(() => {
      setIsUploadingImage(false);
    }, 1000); // Just to show the indicator briefly for UX feedback
  };

  const handleImageRemoved = () => {
    setFormData({
      ...formData,
      image: null,
    });
  };

  const selectVideo = () => {
    // Your existing video selection logic
    setShowMediaOptions(false);
    Alert.alert('Video Feature', 'Video selection would be handled here');
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

    setIsSubmitting(true);
    try {
      // Create a FormData object for multipart/form-data submission
      const blogFormData = new FormData();

      // Add text fields
      blogFormData.append('title', formData.title);
      blogFormData.append('description', formData.description);
      blogFormData.append('genre', formData.genre);
      blogFormData.append('readTime', formData.readTime);
      blogFormData.append('status', formData.status);

      // Add image if exists
      if (formData.image) {
        const imageFile = {
          uri: formData.image.uri,
          type: formData.image.type,
          name: formData.image.name,
        };
        blogFormData.append('image', imageFile);
      }

      // Add video if exists (would need similar handling to image)
      if (formData.video) {
        blogFormData.append('video', formData.video);
      }

      // Set proper headers for multipart/form-data
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
              // We'll handle image selection through the BlogImageUploader now
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
            style={styles.modalOption}
            onPress={() => {
              setShowMediaOptions(false);
              selectVideo();
            }}>
            <Icon
              name="videocam-outline"
              size={24}
              color={currentColors.primary}
            />
            <Text style={[styles.modalOptionText, {color: currentColors.text}]}>
              Add Video
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
    <SafeAreaView
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
                  {backgroundColor: currentColors.inputBox},
                ]}>
                <Icon
                  name="text-outline"
                  size={20}
                  color={currentColors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="Enter blog title"
                  placeholderTextColor={currentColors.secondary}
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
                  {backgroundColor: currentColors.inputBox},
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
                  value={formData.description}
                  onChangeText={text => handleInputChange('description', text)}
                />
              </View>
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
              <View
                style={[
                  styles.inputWrapper,
                  {backgroundColor: currentColors.inputBox},
                ]}>
                <Icon
                  name="pricetag-outline"
                  size={20}
                  color={currentColors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="e.g., Health, Technology, Lifestyle"
                  placeholderTextColor={currentColors.secondary}
                  value={formData.genre}
                  onChangeText={text => handleInputChange('genre', text)}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.inputBorder]}>
              <Text style={[styles.label, {color: currentColors.text}]}>
                Read Time
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {backgroundColor: currentColors.inputBox},
                ]}>
                <Icon
                  name="time-outline"
                  size={20}
                  color={currentColors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, {color: currentColors.text}]}
                  placeholder="e.g., 5 min"
                  placeholderTextColor={currentColors.secondary}
                  value={formData.readTime}
                  onChangeText={text => handleInputChange('readTime', text)}
                  keyboardType="numeric"
                />
              </View>
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

            {/* BlogImageUploader component for selecting and previewing images */}
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

            {formData.video ? (
              <View style={styles.mediaPreviewContainer}>
                <View style={styles.videoPreviewPlaceholder}>
                  <Icon
                    name="play-circle"
                    size={50}
                    color={currentColors.primary}
                  />
                  <Text
                    style={[
                      styles.videoPreviewText,
                      {color: currentColors.text},
                    ]}>
                    Video Selected
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteMediaButton}
                  onPress={() => setFormData({...formData, video: null})}>
                  <Icon name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.addVideoSection}>
                <TouchableOpacity
                  style={[
                    styles.addVideoButton,
                    {
                      backgroundColor: currentColors.inputBox,
                      borderColor: currentColors.border,
                    },
                  ]}
                  onPress={() => setShowMediaOptions(true)}
                  disabled={isSubmitting}>
                  <Icon
                    name="videocam-outline"
                    size={24}
                    color={currentColors.primary}
                  />
                  <Text
                    style={[
                      styles.addVideoButtonText,
                      {color: currentColors.text},
                    ]}>
                    Add Video
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
    </SafeAreaView>
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
  mediaPreviewContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    backgroundColor: '#E2E8F0',
  },
  videoPreviewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewText: {
    marginTop: 10,
    fontSize: 16,
  },
  deleteMediaButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVideoSection: {
    marginTop: 10,
  },
  addVideoButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVideoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
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
