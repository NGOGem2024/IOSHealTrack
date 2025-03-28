import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import {Platform} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import {useSession} from '../context/SessionContext';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import instance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import DoctorProfileSkeleton from '../components/DoctorProfileSkeleton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomCountryPicker from './CustomCountryPicker';

const {width} = Dimensions.get('window');

interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  description: string;
}

interface Country {
  name: string;
  code: string;
  flag: string;
  callingCode: string;
}

interface ProfileInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  qualification: string;
  organization_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctors_photo: string;
  specialization: string; // New field for specialization
  youtube_videos: YouTubeVideo[]; // New field for YouTube videos
}

const initialProfileState: ProfileInfo = {
  _id: '',
  doctor_first_name: '',
  doctor_last_name: '',
  qualification: '',
  organization_name: '',
  doctor_email: '',
  doctor_phone: '',
  doctors_photo: '',
  specialization: '', // Default empty value
  youtube_videos: [], // Default empty array
};

const DoctorProfileEdit: React.FC = () => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const themeValues = getTheme(
    theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
  );
  const {session} = useSession();

  const [profileInfo, setProfileInfo] =
    useState<ProfileInfo>(initialProfileState);
  const [originalProfileInfo, setOriginalProfileInfo] =
    useState<ProfileInfo>(initialProfileState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  // Country picker states
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    callingCode: '91',
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneWithoutCode, setPhoneWithoutCode] = useState('');
  // New state for handling YouTube video input
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (session.idToken) {
      fetchDoctorInfo();
    } else {
      setIsLoading(false);
    }
  }, [session.idToken]);

  useEffect(() => {
    // Extract country code and phone number when profile info changes
    if (profileInfo.doctor_phone) {
      const phoneStr = profileInfo.doctor_phone;

      // Define a list of countries with their calling codes
      const countries = [
        {name: 'United States', code: 'US', flag: '🇺🇸', callingCode: '1'},
        {name: 'United Kingdom', code: 'GB', flag: '🇬🇧', callingCode: '44'},
        {name: 'India', code: 'IN', flag: '🇮🇳', callingCode: '91'},
        {name: 'Canada', code: 'CA', flag: '🇨🇦', callingCode: '1'},
        {name: 'Australia', code: 'AU', flag: '🇦🇺', callingCode: '61'},
        {name: 'Germany', code: 'DE', flag: '🇩🇪', callingCode: '49'},
        {name: 'France', code: 'FR', flag: '🇫🇷', callingCode: '33'},
        {name: 'Italy', code: 'IT', flag: '🇮🇹', callingCode: '39'},
        {name: 'Spain', code: 'ES', flag: '🇪🇸', callingCode: '34'},
        {name: 'Japan', code: 'JP', flag: '🇯🇵', callingCode: '81'},
        {name: 'China', code: 'CN', flag: '🇨🇳', callingCode: '86'},
        {name: 'Brazil', code: 'BR', flag: '🇧🇷', callingCode: '55'},
        {name: 'Russia', code: 'RU', flag: '🇷🇺', callingCode: '7'},
        {name: 'South Africa', code: 'ZA', flag: '🇿🇦', callingCode: '27'},
        {name: 'UAE', code: 'AE', flag: '🇦🇪', callingCode: '971'},
        {name: 'Singapore', code: 'SG', flag: '🇸🇬', callingCode: '65'},
        {name: 'New Zealand', code: 'NZ', flag: '🇳🇿', callingCode: '64'},
        {name: 'Ireland', code: 'IE', flag: '🇮🇪', callingCode: '353'},
        {name: 'Netherlands', code: 'NL', flag: '🇳🇱', callingCode: '31'},
        {name: 'Sweden', code: 'SE', flag: '🇸🇪', callingCode: '46'},
      ];

      // Try to match the country code
      const matchedCountry = countries.find(country =>
        phoneStr.startsWith(`+${country.callingCode}`),
      );

      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        // Remove the country code from the phone number
        setPhoneWithoutCode(
          phoneStr.substring(matchedCountry.callingCode.length + 1),
        );
      } else {
        // If no match, use default (India) and use the full number
        setSelectedCountry({
          name: 'India',
          code: 'IN',
          flag: '🇮🇳',
          callingCode: '91',
        });
        setPhoneWithoutCode(phoneStr);
      }
    }
  }, [profileInfo.doctor_phone]);

  const handlePhoneChange = (text: string) => {
    // Remove any non-digit characters
    const cleanedText = text.replace(/\D/g, '');

    setPhoneWithoutCode(cleanedText);

    // Update the profile phone with country code
    const fullPhoneNumber = `+${selectedCountry.callingCode}${cleanedText}`;
    handleInputChange('doctor_phone', fullPhoneNumber);
  };

  const fetchDoctorInfo = async () => {
    if (!session.idToken) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await instance.get<ProfileInfo>('/doctor', {
        headers: {
          Authorization: `Bearer ${session.idToken}`,
        },
      });

      // If the API doesn't already return these fields, initialize them
      const responseData = {
        ...response.data,
        specialization: response.data.specialization || '',
        youtube_videos: response.data.youtube_videos || [],
      };

      setProfileInfo(responseData);
      setOriginalProfileInfo(responseData);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle country selection
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    // Update the profile phone with new country code
    const fullPhoneNumber = `+${country.callingCode}${phoneWithoutCode}`;
    handleInputChange('doctor_phone', fullPhoneNumber);
  };

  const handleInputChange = (field: keyof ProfileInfo, value: string) => {
    setProfileInfo(prev => ({...prev, [field]: value}));
  };

  const hasChanges = () => {
    // Check if any field has changed, including the new fields
    return (
      profileInfo.doctor_first_name !== originalProfileInfo.doctor_first_name ||
      profileInfo.doctor_last_name !== originalProfileInfo.doctor_last_name ||
      profileInfo.qualification !== originalProfileInfo.qualification ||
      profileInfo.doctor_email !== originalProfileInfo.doctor_email ||
      profileInfo.doctor_phone !== originalProfileInfo.doctor_phone ||
      profileInfo.specialization !== originalProfileInfo.specialization ||
      JSON.stringify(profileInfo.youtube_videos) !==
        JSON.stringify(originalProfileInfo.youtube_videos)
    );
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      showSuccessToast('No changes were made to your profile.');
      return;
    }

    if (!session.idToken) {
      handleError(new Error('You must be logged in to update your profile'));
      return;
    }

    setIsSaving(true);

    try {
      await instance.put(
        `/doctor/update/${profileInfo._id}`,
        {
          doctor_first_name: profileInfo.doctor_first_name,
          doctor_last_name: profileInfo.doctor_last_name,
          qualification: profileInfo.qualification,
          doctor_email: profileInfo.doctor_email,
          doctor_phone: profileInfo.doctor_phone,
          specialization: profileInfo.specialization,
          youtube_videos: profileInfo.youtube_videos,
        },
        {
          headers: {
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );

      setOriginalProfileInfo(profileInfo);
      showSuccessToast('Profile updated successfully');
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  // YouTube Video Management Functions
  const handleAddVideo = () => {
    // Simple validation
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      Alert.alert(
        'Invalid Input',
        'Please enter both title and URL for the video',
      );
      return;
    }

    // Basic URL validation
    if (
      !newVideoUrl.includes('youtube.com/') &&
      !newVideoUrl.includes('youtu.be/')
    ) {
      Alert.alert('Invalid URL', 'Please enter a valid YouTube video URL');
      return;
    }

    if (editingVideoId) {
      // Update existing video
      const updatedVideos = profileInfo.youtube_videos.map(video =>
        video.id === editingVideoId
          ? {
              ...video,
              title: newVideoTitle,
              url: newVideoUrl,
              description: newVideoDescription,
            }
          : video,
      );

      setProfileInfo(prev => ({
        ...prev,
        youtube_videos: updatedVideos,
      }));
    } else {
      // Add new video
      const newVideo: YouTubeVideo = {
        id: Date.now().toString(),
        title: newVideoTitle,
        url: newVideoUrl,
        description: newVideoDescription,
      };

      setProfileInfo(prev => ({
        ...prev,
        youtube_videos: [...prev.youtube_videos, newVideo],
      }));
    }

    // Clear the inputs and close modal
    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoDescription('');
    setEditingVideoId(null);
    setShowVideoModal(false);
  };

  const handleEditVideo = (video: YouTubeVideo) => {
    setNewVideoTitle(video.title);
    setNewVideoUrl(video.url);
    setNewVideoDescription(video.description || '');
    setEditingVideoId(video.id);
    setShowVideoModal(true);
  };

  const handleDeleteVideo = (videoId: string) => {
    Alert.alert('Delete Video', 'Are you sure you want to remove this video?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedVideos = profileInfo.youtube_videos.filter(
            video => video.id !== videoId,
          );

          setProfileInfo(prev => ({
            ...prev,
            youtube_videos: updatedVideos,
          }));
        },
      },
    ]);
  };

  const handleImagePick = async () => {
    Alert.alert('Profile Photo', 'Choose a photo from:', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const image = await ImagePicker.openCamera({
              width: 800,
              height: 800,
              cropping: true,
              cropperCircleOverlay: true,
              mediaType: 'photo',
              compressImageQuality: 0.7,
            });

            handleImageUpload(image);
          } catch (error: any) {
            if (error?.code !== 'E_PICKER_CANCELLED') {
              handleError(error);
            }
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          try {
            const image = await ImagePicker.openPicker({
              width: 800,
              height: 800,
              cropping: true,
              cropperCircleOverlay: true,
              mediaType: 'photo',
              compressImageQuality: 0.7,
            });

            handleImageUpload(image);
          } catch (error: any) {
            if (error?.code !== 'E_PICKER_CANCELLED') {
              handleError(error);
            }
          }
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  // Separate the upload logic to avoid code duplication
  const handleImageUpload = async (image: any) => {
    if (!image) return;

    const fileName = image.path.split('/').pop() || 'profile.jpg';

    const formData = new FormData();
    formData.append('profile_photo', {
      uri:
        Platform.OS === 'ios' ? image.path.replace('file://', '') : image.path,
      type: image.mime || 'image/jpeg',
      name: fileName,
    } as any);

    setIsLoading(true);

    try {
      const response = await instance.put(
        `/doctor/update-photo/${profileInfo._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );
      if (response.data.imageUrl) {
        await AsyncStorage.removeItem('doctor_photo');
        const imageResponse = await fetch(response.data.imageUrl);
        const imageBlob = await imageResponse.blob();
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert image to base64'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageBlob);
        });

        // Store in AsyncStorage
        await AsyncStorage.setItem('doctor_photo', base64Image);
      }

      if (response.data.imageUrl) {
        setProfileInfo(prev => ({
          ...prev,
          doctors_photo: response.data.imageUrl,
        }));
        showSuccessToast('Profile photo updated successfully');
        fetchDoctorInfo();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    Alert.alert(
      'Delete Profile Photo',
      'Are you sure you want to delete your profile photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await instance.delete(`/doctor/photo`, {
                headers: {
                  Authorization: `Bearer ${session.idToken}`,
                },
              });

              // Update local state
              setProfileInfo(prev => ({...prev, doctors_photo: ''}));
              await AsyncStorage.removeItem('doctor_photo');

              showSuccessToast('Profile photo deleted successfully');
            } catch (error) {
              handleError(error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderPhotoOptionsModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPhotoOptions}
        onRequestClose={() => setShowPhotoOptions(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoOptions(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowPhotoOptions(false);
                handleImagePick();
              }}>
              <Icon 
                name={profileInfo.doctors_photo ? "create-outline" : "add-circle-outline"} 
                size={24} 
                color="#007B8E" 
              />
              <Text style={styles.modalOptionText}>
                {profileInfo.doctors_photo ? "Change Photo" : "Add Photo"}
              </Text>
            </TouchableOpacity>
            {profileInfo.doctors_photo && (
              <TouchableOpacity
                style={[styles.modalOption, styles.deleteOption]}
                onPress={() => {
                  setShowPhotoOptions(false);
                  handleDeletePhoto();
                }}>
                <Icon name="trash-outline" size={24} color="#DC2626" />
                <Text style={[styles.modalOptionText, styles.deleteText]}>
                  Delete Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderVideoModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showVideoModal}
        onRequestClose={() => {
          setShowVideoModal(false);
          setNewVideoTitle('');
          setNewVideoUrl('');
          setEditingVideoId(null);
        }}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowVideoModal(false);
            setNewVideoTitle('');
            setNewVideoUrl('');
            setEditingVideoId(null);
          }}>
          <View style={styles.videoModalContent}>
            <Text style={styles.videoModalTitle}>
              {editingVideoId ? 'Edit Video' : 'Add YouTube Video'}
            </Text>

            <View style={styles.videoInputGroup}>
              <Text style={styles.videoInputLabel}>Video Title</Text>
              <TextInput
                style={styles.videoInput}
                value={newVideoTitle}
                onChangeText={setNewVideoTitle}
                placeholder="Enter video title"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.videoInputGroup}>
              <Text style={styles.videoInputLabel}>YouTube URL</Text>
              <TextInput
                style={styles.videoInput}
                value={newVideoUrl}
                onChangeText={setNewVideoUrl}
                placeholder="Enter YouTube video URL"
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={styles.videoInputGroup}>
              <Text style={styles.videoInputLabel}>Description</Text>
              <TextInput
                style={[styles.videoInput, styles.videoDescriptionInput]}
                value={newVideoDescription}
                onChangeText={setNewVideoDescription}
                placeholder="Enter video description"
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={3}
              />
            </View>
            <View style={styles.videoModalButtonsRow}>
              <TouchableOpacity
                style={styles.videoModalCancelButton}
                onPress={() => {
                  setShowVideoModal(false);
                  setNewVideoTitle('');
                  setNewVideoUrl('');
                  setEditingVideoId(null);
                }}>
                <Text style={styles.videoModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.videoModalSaveButton}
                onPress={handleAddVideo}>
                <Text style={styles.videoModalSaveButtonText}>
                  {editingVideoId ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderProfilePhotoControls = () => {
    return (
      <TouchableOpacity
        style={styles.plusButton}
        onPress={() => setShowPhotoOptions(true)}
        disabled={isSaving}>
        <Icon name="add-circle" size={28} color="#007B8E" />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BackTabTop screenName="Doctor Profile" />
        <DoctorProfileSkeleton />
      </SafeAreaView>
    );
  }


  if (!session.idToken) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Please log in to edit your profile.
        </Text>
      </View>
    );
  }

  const profilePhoto = profileInfo.doctors_photo
    ? {uri: profileInfo.doctors_photo}
    : require('../assets/profile.png');

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTabTop screenName="Doctor Profile" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={'handled'}>
        <View style={styles.headerContainer}>
          <View style={styles.coverPhoto}>
            <View style={styles.headerInfo}>
              <Text style={styles.profileName}>
                Dr. {profileInfo.doctor_first_name}{' '}
                {profileInfo.doctor_last_name}
              </Text>
              <Text style={styles.profileQualification}>
                {profileInfo.qualification}
              </Text>
              <View style={styles.organizationContainer}>
                <Icon name="business" size={16} color="#666" />
                <Text style={styles.profileOrganization}>
                  {profileInfo.organization_name}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <Image source={profilePhoto} style={styles.profilePhoto} />
              {renderProfilePhotoControls()}
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.sectionHeader}>
            <Icon name="person" size={22} color="#007B8E" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.card}>
            {[
              {
                label: 'First Name',
                icon: 'person-outline',
                value: profileInfo.doctor_first_name,
                field: 'doctor_first_name',
              },
              {
                label: 'Last Name',
                icon: 'person-outline',
                value: profileInfo.doctor_last_name,
                field: 'doctor_last_name',
              },
              {
                label: 'Qualification',
                icon: 'school-outline',
                value: profileInfo.qualification,
                field: 'qualification',
              },
              {
                label: 'Specialization',
                icon: 'medical-outline',
                value: profileInfo.specialization,
                field: 'specialization',
              },
              {
                label: 'Organization',
                icon: 'business-outline',
                value: profileInfo.organization_name,
                field: 'organization_name',
                disabled: true,
              },
            ].map((item, index) => (
              <View
                key={item.field}
                style={[styles.inputGroup, index !== 0 && styles.inputBorder]}>
                <Text style={styles.label}>{item.label}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    item.disabled && styles.disabledWrapper,
                  ]}>
                  <Icon
                    name={item.icon}
                    size={20}
                    color="#007B8E"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      item.disabled && styles.disabledInput,
                    ]}
                    value={item.value}
                    onChangeText={text =>
                      handleInputChange(item.field as keyof ProfileInfo, text)
                    }
                    editable={!item.disabled}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            ))}
            <View style={[styles.inputGroup, styles.inputBorder]}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                {/* Country Selector */}
                <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={() => setShowCountryPicker(true)}>
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCode}>
                    +{selectedCountry.callingCode}
                  </Text>
                  <Icon name="chevron-down" size={16} color="#007B8E" />
                </TouchableOpacity>

                {/* Phone Input */}
                <View style={styles.phoneInputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={phoneWithoutCode}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                    placeholder="Enter phone number"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* YouTube Videos Section */}
          <View style={styles.sectionHeader}>
            <Icon name="videocam" size={22} color="#007B8E" />
            <Text style={styles.sectionTitle}>YouTube Videos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.videosDescription}>
              Add YouTube videos to display on your profile. Patients will be
              able to view these videos to learn more about your expertise.
            </Text>

            {profileInfo.youtube_videos.length === 0 ? (
              <View style={styles.noVideosContainer}>
                <Icon name="videocam-outline" size={40} color="#CBD5E0" />
                <Text style={styles.noVideosText}>No videos added yet</Text>
              </View>
            ) : (
              <FlatList
                data={profileInfo.youtube_videos}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                renderItem={({item}) => (
                  <View style={styles.videoItem}>
                    <View style={styles.videoInfo}>
                      <Icon
                        name="logo-youtube"
                        size={24}
                        color="#FF0000"
                        style={styles.youtubeIcon}
                      />
                      <View style={styles.videoTextContainer}>
                        <Text style={styles.videoTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.videoUrl} numberOfLines={1}>
                          {item.url}
                        </Text>
                        {item.description ? (
                          <Text
                            style={styles.videoDescription}
                            numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.videoActions}>
                      <TouchableOpacity
                        style={styles.videoEditButton}
                        onPress={() => handleEditVideo(item)}>
                        <Icon name="create-outline" size={20} color="#007B8E" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.videoDeleteButton}
                        onPress={() => handleDeleteVideo(item.id)}>
                        <Icon name="trash-outline" size={20} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.videoSeparator} />
                )}
              />
            )}

            <TouchableOpacity
              style={styles.addVideoButton}
              onPress={() => {
                setNewVideoTitle('');
                setNewVideoUrl('');
                setEditingVideoId(null);
                setShowVideoModal(true);
              }}
              disabled={isSaving}>
              <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.addVideoButtonText}>Add YouTube Video</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || !hasChanges()) && styles.savingButton,
            ]}
            onPress={handleSave}
            disabled={isSaving || !hasChanges()}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderPhotoOptionsModal()}
      {renderVideoModal()}

      <CustomCountryPicker
        selectedCountry={selectedCountry}
        onSelect={handleCountrySelect}
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        theme={{
          card: themeValues.colors.card,
          text: themeValues.colors.text,
          primary: themeValues.colors.primary,
          inputBg: themeValues.colors.background,
          inputBorder: themeValues.colors.border,
          placeholderText: '#999',
        }}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    plusButton: {
      position: 'absolute',
      bottom: 5,
      right: 5,
      backgroundColor: '#FFFFFF',
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },

    phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingRight: 5,
      backgroundColor: theme.colors.inputBox,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    countryCode: {
      backgroundColor: theme.colors.inputBox,
      color: theme.colors.text,
      marginRight: 5,
    },
    countrySelector: {
      backgroundColor: theme.colors.inputBox,
      flexDirection: 'row',
    },

    countryFlag: {
      backgroundColor: theme.colors.inputBox,
      marginRight: 10,
      marginLeft: 5,
    },
    phoneInputWrapper: {
      backgroundColor: theme.colors.inputBox,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 15,
      padding: 20,
      width: width * 0.8,
      maxWidth: 300,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    deleteOption: {
      borderBottomWidth: 0,
    },
    modalOptionText: {
      fontSize: 16,
      marginLeft: 15,
      color: '#2C3E50',
    },
    deleteText: {
      color: '#DC2626',
    },
    videoModalContent: {
      backgroundColor: theme.colors.inputBox,
      borderRadius: 15,
      padding: 20,
      width: width * 0.9,
      maxWidth: 400,
    },
    videoModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#007B8E',
      marginBottom: 20,
      textAlign: 'center',
    },
    videoInputGroup: {
      marginBottom: 16,
    },
    videoInputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    videoInput: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      height: 50,
      paddingHorizontal: 16,
      fontSize: 16,
      color: '#2C3E50',
    },
    videoModalButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    videoDescriptionInput: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    videoDescription: {
      fontSize: 12,
      color: '#718096',
      marginTop: 2,
    },
    videoModalCancelButton: {
      flex: 1,
      backgroundColor: '#F1F5F9',
      borderRadius: 12,
      paddingVertical: 14,
      marginRight: 8,
      alignItems: 'center',
    },
    videoModalCancelButtonText: {
      color: '#64748B',
      fontSize: 16,
      fontWeight: '600',
    },
    videoModalSaveButton: {
      flex: 1,
      backgroundColor: '#007B8E',
      borderRadius: 12,
      paddingVertical: 14,
      marginLeft: 8,
      alignItems: 'center',
    },
    videoModalSaveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    photoControlsContainer: {
      position: 'absolute',
      bottom: 5,
      right: 5,
      flexDirection: 'row',
      gap: 8,
    },
    cameraButton: {
      backgroundColor: '#007B8E',
      width: 30,
      height: 30,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    deletePhotoButton: {
      backgroundColor: '#DC2626',
      width: 30,
      height: 30,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.box,
    },
    scrollView: {
      flex: 1,
    },
    headerContainer: {
      backgroundColor: theme.colors.card,
      marginBottom: 20,
    },
    coverPhoto: {
      height: 90,
      backgroundColor: '#007B8E',
      opacity: 0.9,
    },
    profileHeader: {
      flexDirection: 'row',
      marginTop: -60,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    profileImageContainer: {
      position: 'relative',
    },
    profilePhoto: {
      width: 110,
      height: 110,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
    },
    headerInfo: {
      flex: 1,
      marginLeft: 135,
      marginTop: 65,
    },
    profileName: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
      marginTop: 1,
    },
    profileQualification: {
      fontSize: 14,
      color: '#007B8E',
      fontWeight: '600',
      marginTop: 5,
    },
    organizationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileOrganization: {
      fontSize: 13,
      color: '#666',
      marginLeft: 4,
    },
    formContainer: {
      padding: 15,
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
      color: '#007B8E',
      marginLeft: 10,
    },
    card: {
      backgroundColor: theme.colors.card,
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
      borderTopColor: '#E2E8F0',
      paddingTop: 16,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 8,
      fontWeight: '500',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.inputBox,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      height: 50,
      paddingHorizontal: 12,
    },
    disabledWrapper: {
      backgroundColor: theme.colors.inputBox,
      borderColor: '#E2E8F0',
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      height: '100%',
    },
    disabledInput: {
      color: '#94A3B8',
    },
    saveButton: {
      backgroundColor: '#007B8E',
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 10,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    savingButton: {
      backgroundColor: '#64748B',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F7FA',
    },
    loadingText: {
      fontSize: 16,
      color: '#64748B',
      marginTop: 10,
    },
    videosDescription: {
      fontSize: 14,
      color: '#64748B',
      marginBottom: 20,
      lineHeight: 20,
    },
    noVideosContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 30,
    },
    noVideosText: {
      color: '#94A3B8',
      fontSize: 16,
      marginTop: 10,
    },
    videoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.inputBox,
      borderRadius: 10,
    },
    videoInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    youtubeIcon: {
      marginRight: 10,
    },
    videoTextContainer: {
      flex: 1,
    },
    videoTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#007b8e',
    },
    videoUrl: {
      fontSize: 13,
      color: theme.colors.text,
      marginTop: 2,
    },
    videoActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    videoEditButton: {
      padding: 8,
      marginRight: 5,
    },
    videoDeleteButton: {
      padding: 8,
    },
    videoSeparator: {
      height: 1,
      backgroundColor: '#E2E8F0',
      marginVertical: 10,
    },
    addVideoButton: {
      backgroundColor: '#007B8E',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    addVideoButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 10,
    },
  });

export default DoctorProfileEdit;
