import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/types';
import { useSession } from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import { handleError } from '../utils/errorHandler';
import Icon from 'react-native-vector-icons/Ionicons';
import BackTabTop from './BackTopTab';
// import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

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
  },
};

type UpdateBlogScreenProps = {
  route: RouteProp<RootStackParamList, 'UpdateBlog'>;
  navigation: StackNavigationProp<RootStackParamList, 'UpdateBlog'>;
};

interface Blog {
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
  'Other'
];

const UpdateBlogScreen: React.FC<UpdateBlogScreenProps> = ({ route, navigation }) => {
  const { blogId } = route.params;
  const { session } = useSession();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [readTime, setReadTime] = useState('');
  const [status, setStatus] = useState('draft');
  const [image, setImage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');
  
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    fetchBlogDetails();
  }, [blogId]);

  const fetchBlogDetails = async () => {
    if (!session.idToken || !blogId) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/blog/${blogId}`, {
        headers: { Authorization: `Bearer ${session.idToken}` },
      });
      
      if (response.data.success) {
        const blogData = response.data.data;
        setBlog(blogData);
        setTitle(blogData.title);
        setDescription(blogData.description);
        setGenre(blogData.genre);
        setReadTime(blogData.readTime.toString());
        setStatus(blogData.status);
        setImage(blogData.image || null);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBlog = async () => {
    // Validate inputs
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    // Validate description length (200-1000 words)
    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount < 50 || wordCount > 1000) {
      setDescriptionError(`Description must be between 200 and 1000 words. Current: ${wordCount} words`);
      return;
    } else {
      setDescriptionError('');
    }

    setUpdating(true);
    try {
      const updateData = {
        title,
        description,
        genre,
        readTime: parseInt(readTime) || 5,
        status,
        image: image || undefined,
      };

      const response = await axiosInstance.put(`/update/blog/${blogId}`, updateData, {
        headers: { Authorization: `Bearer ${session.idToken}` },
      });

      if (response.data.success) {
        Alert.alert('Success', 'Blog updated successfully', [
          { text: 'OK', onPress: () => navigation.navigate('BlogDetails', { blogId }) }
        ]);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        setIsPermissionError(true);
        Alert.alert('Permission Denied', 'You don\'t have permission to update this blog');
      } else {
        handleError(error);
        Alert.alert('Error', 'Failed to update blog');
      }
    } finally {
      setUpdating(false);
    }
  };

//   const pickImage = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [16, 9],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         setImage(result.assets[0].uri);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image');
//     }
//   };

  const calculateReadTime = () => {
    // Average reading speed: 200-250 words per minute
    const wordCount = description.trim().split(/\s+/).length;
    const estimatedTime = Math.ceil(wordCount / 200);
    setReadTime(estimatedTime.toString());
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
        <StatusBar backgroundColor={currentColors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <BackTabTop screenName="Update Blog" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!blog || isPermissionError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
        <StatusBar backgroundColor={currentColors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <BackTabTop screenName="Update Blog" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color={currentColors.primary} />
          <Text style={[styles.errorText, { color: currentColors.text }]}>
            {isPermissionError 
              ? "You don't have permission to edit this blog" 
              : "Blog not found or unable to load blog details"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <StatusBar backgroundColor={currentColors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <BackTabTop screenName="Update Blog" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.formContainer, { backgroundColor: currentColors.card }]}>
            <Text style={[styles.formTitle, { color: currentColors.text }]}>Update Blog</Text>
            
            {/* Blog Image */}
            {/* <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.blogImage} />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: currentColors.inputBg }]}>
                  <Icon name="image-outline" size={40} color={currentColors.secondary} />
                  <Text style={[styles.imagePlaceholderText, { color: currentColors.secondary }]}>
                    Tap to select blog image
                  </Text>
                </View>
              )}
              <View style={[styles.imagePickerButton, { backgroundColor: currentColors.primary }]}>
                <Icon name="camera-outline" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
             */}
            {/* Blog Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentColors.text }]}>Title</Text>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    backgroundColor: currentColors.inputBg,
                    color: currentColors.text,
                    borderColor: currentColors.border
                  }
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Blog Title"
                placeholderTextColor={currentColors.secondary}
              />
            </View>
            
            {/* Blog Genre */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentColors.text }]}>Genre</Text>
              <View style={[
                styles.pickerContainer,
                { 
                  backgroundColor: currentColors.inputBg,
                  borderColor: currentColors.border
                }
              ]}>
                <Picker
                  selectedValue={genre}
                  onValueChange={(itemValue) => setGenre(itemValue)}
                  style={{ color: currentColors.text }}
                  dropdownIconColor={currentColors.text}
                >
                  {genres.map((genreOption) => (
                    <Picker.Item key={genreOption} label={genreOption} value={genreOption} />
                  ))}
                </Picker>
              </View>
            </View>
            
            {/* Blog Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentColors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.textArea, 
                  { 
                    backgroundColor: currentColors.inputBg,
                    color: currentColors.text,
                    borderColor: descriptionError ? currentColors.error : currentColors.border
                  }
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Write your blog content here (200-1000 words)"
                placeholderTextColor={currentColors.secondary}
                multiline
                textAlignVertical="top"
                onBlur={calculateReadTime}
              />
              {descriptionError ? (
                <Text style={[styles.errorText, { color: currentColors.error }]}>
                  {descriptionError}
                </Text>
              ) : null}
            </View>
            
            {/* Read Time */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentColors.text }]}>Read Time (minutes)</Text>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    backgroundColor: currentColors.inputBg,
                    color: currentColors.text,
                    borderColor: currentColors.border
                  }
                ]}
                value={readTime}
                onChangeText={setReadTime}
                placeholder="Estimated reading time"
                placeholderTextColor={currentColors.secondary}
                keyboardType="number-pad"
              />
              <Text style={[styles.helperText, { color: currentColors.secondary }]}>
                Auto-calculated based on word count, but you can adjust it
              </Text>
            </View>
            
            {/* Blog Status */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentColors.text }]}>Status</Text>
              <View style={[
                styles.pickerContainer,
                { 
                  backgroundColor: currentColors.inputBg,
                  borderColor: currentColors.border
                }
              ]}>
                <Picker
                  selectedValue={status}
                  onValueChange={(itemValue) => setStatus(itemValue)}
                  style={{ color: currentColors.text }}
                  dropdownIconColor={currentColors.text}
                >
                  <Picker.Item label="Draft" value="draft" />
                  <Picker.Item label="Published" value="published" />
                </Picker>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: currentColors.background }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.actionButtonText, { color: currentColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: currentColors.primary,
                    opacity: updating ? 0.7 : 1
                  }
                ]}
                onPress={handleUpdateBlog}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.updateButtonText}>Update Blog</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
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
  },
  formContainer: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePickerContainer: {
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  blogImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 14,
  },
  imagePickerButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 200,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    fontWeight: '600',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default UpdateBlogScreen;