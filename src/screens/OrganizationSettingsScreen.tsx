import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  Keyboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import IndustryDropdown from './industrydropdown';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';
import BackTabTop from '../screens/BackTopTab';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon1 from 'react-native-vector-icons/Ionicons';
import LoadingScreen from '../components/loadingScreen';
import ImagePicker from 'react-native-image-crop-picker';
import {Platform} from 'react-native';
import {useSession} from '../context/SessionContext';
import OrganizationSkeletonLoader from '../components/OrganizationSkeletonLoader';
import OrganizationLocations from './OrganizationLocations';
const defaultOrgLogo = require('../assets/profile.png');
const defaultOrgBanner = require('../assets/banner.jpg');

interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  description: string;
}
interface Location {
  id: string;
  name: string;
  locationId: string;
  address: string;
}
interface OrganizationInfo {
  organization_name: string;
  organization_photo: string;
  organization_employees: string;
  organization_email: string;
  organization_phone: string;
  organization_banner: string;
  organization_address_street: string;
  organization_address_city: string;
  organization_address_state: string;
  organization_address_zip: string;
  organization_address_country: string;
  organization_website: string;
  organization_description: string;
  organization_tax_id: string;
  organization_founded_year: string;
  organization_industry: string;
  organization_timezone: string;
  organization_operating_hours: string;
  organization_social_media: {
    [key: string]: string;
  };
  youtube_videos: YouTubeVideo[];
  organization_locations: Location[];
}
const {width} = Dimensions.get('window');
const socialMediaPlatforms = [
  {id: 'instagram', name: 'Instagram', icon: 'instagram'},
  {id: 'facebook', name: 'Facebook', icon: 'facebook'},
  {id: 'twitter', name: 'Twitter', icon: 'twitter'},
  {id: 'linkedin', name: 'LinkedIn', icon: 'linkedin'},
  {id: 'youtube', name: 'YouTube', icon: 'youtube'},
];

const OrganizationSettingsScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const navigation = useNavigation();
  const {session} = useSession();
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showBannerOptions, setShowBannerOptions] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [organizationLocations, setOrganizationLocations] = useState<
    Location[]
  >([]);

  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo>({
    organization_name: '',
    organization_photo: '',
    organization_banner: '',
    organization_employees: '',
    organization_email: '',
    organization_phone: '',
    organization_address_street: '',
    organization_address_city: '',
    organization_address_state: '',
    organization_address_zip: '',
    organization_address_country: '',
    organization_website: '',
    organization_description: '',
    organization_tax_id: '',
    organization_founded_year: '',
    organization_industry: '',
    organization_timezone: '',
    organization_operating_hours: '',
    organization_social_media: {},
    youtube_videos: [],
    organization_locations: [],
  });

  const [showSocialMediaDropdown, setShowSocialMediaDropdown] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    fetchOrganizationInfo();
  }, []);

  const fetchOrganizationInfo = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('getOrg');
      const orgData = response.data.organization;
      const socialMediaKeys = Object.keys(
        orgData.organization_social_media || {},
      ).filter(key => orgData.organization_social_media[key] !== '');

      setOrganizationInfo({
        organization_name: orgData.organization_name || '',
        organization_photo: orgData.organization_logo || '',
        organization_employees: orgData.organization_employees || '',
        organization_email: orgData.organization_email || '',
        organization_phone: orgData.organization_phone || '',
        organization_banner: orgData?.organization_banner || '',
        organization_address_street: orgData.organization_address?.street || '',
        organization_address_city: orgData.organization_address?.city || '',
        organization_address_state: orgData.organization_address?.state || '',
        organization_address_zip: orgData.organization_address?.zip || '',
        organization_address_country:
          orgData.organization_address?.country || '',
        organization_website: orgData.organization_website || '',
        organization_description: orgData.organization_description || '',
        organization_tax_id: orgData.organization_tax_id || '',
        organization_founded_year: orgData.organization_founded_year || '',
        organization_industry: orgData.organization_industry || '',
        organization_timezone: orgData.organization_timezone || '',
        organization_operating_hours:
          orgData.organization_operating_hours || '',
        organization_social_media: orgData.organization_social_media || {},
        youtube_videos: orgData.youtube_videos || [],
        organization_locations: orgData.organization_locations || [],
      });

      // Ensure existing social media links are included in selectedPlatforms
      setSelectedPlatforms(socialMediaKeys);
    } catch (error) {
      handleError(error);
      Alert.alert('Error', 'Failed to load organization information');
    } finally {
      setIsLoading(false);
    }
  };
  const renderBannerOptionsModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showBannerOptions}
        onRequestClose={() => setShowBannerOptions(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBannerOptions(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowBannerOptions(false);
                handleBannerPick();
              }}>
              <Icon name="camera" size={24} color="#007B8E" />
              <Text style={styles.modalOptionText}>Change Banner</Text>
            </TouchableOpacity>
            {organizationInfo.organization_banner && (
              <TouchableOpacity
                style={[styles.modalOption, styles.deleteOption]}
                onPress={() => {
                  setShowBannerOptions(false);
                  handleDeleteBanner();
                }}>
                <Icon name="trash-can-outline" size={24} color="#DC2626" />
                <Text style={[styles.modalOptionText, styles.deleteText]}>
                  Delete Banner
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };
  const handleLocationsChange = (newLocations: Location[]) => {
    setOrganizationInfo(prev => ({
      ...prev,
      organization_locations: newLocations,
    }));
  };
  const handleImagePick = async () => {
    Alert.alert('Organization Logo', 'Choose a photo from:', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const image = await ImagePicker.openCamera({
              width: 800,
              height: 800,
              cropping: true,
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
      const response = await axiosInstance.put(`/org/updatePhoto`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${session.idToken}`,
        },
      });

      if (response.data.imageUrl) {
        setOrganizationInfo(prev => ({
          ...prev,
          organization_photo: response.data.imageUrl,
        }));
        Alert.alert('Success', 'Organization logo updated successfully');
      }
    } catch (error) {
      handleError(error);
      Alert.alert('Error', 'Failed to upload logo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    Alert.alert(
      'Delete Logo',
      'Are you sure you want to delete the organization logo?',
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
              await axiosInstance.delete('/org/photo');
              setOrganizationInfo(prev => ({...prev, organization_photo: ''}));
              Alert.alert('Success', 'Logo deleted successfully');
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

  const handleBannerPick = async () => {
    Alert.alert('Organization Banner', 'Choose a photo from:', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const image = await ImagePicker.openCamera({
              width: 1200,
              height: 400,
              cropping: true,
              mediaType: 'photo',
              compressImageQuality: 0.7,
            });
            handleBannerUpload(image);
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
              width: 1200,
              height: 400,
              cropping: true,
              mediaType: 'photo',
              compressImageQuality: 0.7,
            });
            handleBannerUpload(image);
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

  const handleBannerUpload = async (image: any) => {
    if (!image) return;

    const fileName = image.path.split('/').pop() || 'banner.jpg';

    const formData = new FormData();
    formData.append('profile_photo', {
      uri:
        Platform.OS === 'ios' ? image.path.replace('file://', '') : image.path,
      type: image.mime || 'image/jpeg',
      name: fileName,
    } as any);

    setIsLoading(true);

    try {
      const response = await axiosInstance.put(`/org/updateBanner`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${session.idToken}`,
        },
      });
      if (response.data.imageUrl) {
        setOrganizationInfo(prev => ({
          ...prev,
          organization_banner: response.data.imageUrl,
        }));
        Alert.alert('Success', 'Organization banner updated successfully');
      }
    } catch (error) {
      handleError(error);
      Alert.alert('Error', 'Failed to upload banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBanner = async () => {
    Alert.alert(
      'Delete Banner',
      'Are you sure you want to delete the organization banner?',
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
              await axiosInstance.delete('/org/banner');
              setOrganizationInfo(prev => ({...prev, organization_banner: ''}));
              Alert.alert('Success', 'Banner deleted successfully');
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
              <Icon name="camera" size={24} color="#007B8E" />
              <Text style={styles.modalOptionText}>Change Logo</Text>
            </TouchableOpacity>
            {organizationInfo.organization_photo && (
              <TouchableOpacity
                style={[styles.modalOption, styles.deleteOption]}
                onPress={() => {
                  setShowPhotoOptions(false);
                  handleDeletePhoto();
                }}>
                <Icon name="trash-can-outline" size={24} color="#DC2626" />
                <Text style={[styles.modalOptionText, styles.deleteText]}>
                  Delete Logo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const SocialMediaInputs = () => {
    return (
      <>
        {selectedPlatforms.map(platform => (
          <View key={platform} style={styles.socialInputContainer}>
            <Icon
              name={
                socialMediaPlatforms.find(p => p.id === platform)?.icon ||
                'link'
              }
              size={20}
              color="#007B8E"
              style={styles.socialIcon}
            />
            <TextInput
              style={styles.socialInput}
              placeholder={`${
                platform.charAt(0).toUpperCase() + platform.slice(1)
              } URL`}
              value={organizationInfo.organization_social_media[platform] || ''}
              onChangeText={text =>
                setOrganizationInfo(prev => ({
                  ...prev,
                  organization_social_media: {
                    ...prev.organization_social_media,
                    [platform]: text,
                  },
                }))
              }
              placeholderTextColor="#999"
              keyboardType="url"
            />
          </View>
        ))}
      </>
    );
  };

  const SocialMediaDropdown = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSocialMediaDropdown}
        onRequestClose={() => setShowSocialMediaDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSocialMediaDropdown(false)}>
          <View
            style={styles.dropdownContainer}
            onStartShouldSetResponder={() => true}>
            {socialMediaPlatforms.map(platform => (
              <TouchableOpacity
                key={platform.id}
                style={styles.dropdownItem}
                onPress={() => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  const newPlatforms = isSelected
                    ? selectedPlatforms.filter(p => p !== platform.id)
                    : [...selectedPlatforms, platform.id];
                  setSelectedPlatforms(newPlatforms);
                  // Don't close the modal when selecting items
                }}>
                <Icon
                  name={
                    selectedPlatforms.includes(platform.id)
                      ? 'checkbox-marked'
                      : 'checkbox-blank-outline'
                  }
                  size={24}
                  color="#007B8E"
                />
                <Icon
                  name={platform.icon}
                  size={24}
                  color="#007B8E"
                  style={styles.platformIcon}
                />
                <Text style={styles.dropdownItemText}>{platform.name}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.dropdownButtonContainer}>
              <TouchableOpacity
                style={styles.dropdownDoneButton}
                onPress={() => setShowSocialMediaDropdown(false)}>
                <Text style={styles.dropdownDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
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
          const updatedVideos = organizationInfo.youtube_videos.filter(
            video => video.id !== videoId,
          );

          setOrganizationInfo(prev => ({
            ...prev,
            youtube_videos: updatedVideos,
          }));
        },
      },
    ]);
  };
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
      const updatedVideos = organizationInfo.youtube_videos.map(video =>
        video.id === editingVideoId
          ? {
              ...video,
              title: newVideoTitle,
              url: newVideoUrl,
              description: newVideoDescription,
            }
          : video,
      );

      setOrganizationInfo(prev => ({
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

      setOrganizationInfo(prev => ({
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
  const handleSave = async () => {
    Keyboard.dismiss();
    if (
      !organizationInfo.organization_name ||
      !organizationInfo.organization_email
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // ADD: Optional validation for locations
    const locationIds = organizationInfo.organization_locations.map(
      loc => loc.locationId,
    );
    const uniqueLocationIds = new Set(locationIds);
    if (locationIds.length !== uniqueLocationIds.size) {
      Alert.alert('Error', 'Location IDs must be unique');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post('/update/org', organizationInfo);
      Alert.alert('Success', 'Organization information updated successfully');
      navigation.goBack();
    } catch (error) {
      handleError(error);
      Alert.alert('Error', 'Failed to update organization information');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <OrganizationSkeletonLoader />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <BackTabTop screenName="Update Organization" />
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps={'handled'}>
        <View style={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.bannerContainer}>
              <Image
                source={
                  organizationInfo.organization_banner
                    ? {uri: organizationInfo.organization_banner}
                    : defaultOrgBanner
                }
                style={styles.bannerImage}
                onError={() =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    organization_banner: '',
                  })
                }
              />
              <TouchableOpacity
                style={styles.editBannerButton}
                onPress={() => setShowBannerOptions(true)}>
                <Icon name="pencil" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileImageContainer}>
              <Image
                source={
                  organizationInfo.organization_photo
                    ? {uri: organizationInfo.organization_photo}
                    : defaultOrgLogo
                }
                style={styles.orgImage}
                onError={() =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    organization_photo: '',
                  })
                }
              />
              <TouchableOpacity
                style={styles.editImageButton}
                onPress={() => setShowPhotoOptions(true)}>
                <Icon name="pencil" size={16} color="#007b8e" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileImageLine} />
          <View style={styles.content1}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Organization Name *</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.organization_name}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    organization_name: text,
                  })
                }
                placeholder="Enter organization name"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputSection}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.organization_email}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    organization_email: text,
                  })
                }
                placeholder="Enter organization email"
                placeholderTextColor="#999"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputSection}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.organization_phone}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    organization_phone: text,
                  })
                }
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Employees</Text>
                <TextInput
                  style={styles.input}
                  value={organizationInfo.organization_employees}
                  onChangeText={text =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_employees: text,
                    })
                  }
                  placeholder="Number of employees"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Founded Year</Text>
                <TextInput
                  style={styles.input}
                  value={organizationInfo.organization_founded_year}
                  onChangeText={text =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_founded_year: text,
                    })
                  }
                  placeholder="Founded year"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Address Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Address</Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.organization_address_street}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    organization_address_street: text,
                  })
                }
                placeholder="Enter street address"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={organizationInfo.organization_address_city}
                  onChangeText={text =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_address_city: text,
                    })
                  }
                  placeholder="Enter city"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={organizationInfo.organization_address_state}
                  onChangeText={text =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_address_state: text,
                    })
                  }
                  placeholder="Enter state"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            <OrganizationLocations
              locations={organizationInfo.organization_locations}
              onLocationsChange={handleLocationsChange}
            />
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>ZIP Code</Text>
                <TextInput
                  style={styles.input}
                  value={organizationInfo.organization_address_zip}
                  onChangeText={text =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_address_zip: text,
                    })
                  }
                  placeholder="Enter ZIP code"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.input}
                  value={organizationInfo.organization_address_country}
                  onChangeText={text =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_address_country: text,
                    })
                  }
                  placeholder="Enter country"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Additional Information Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  value={organizationInfo.organization_website}
                  onChangeText={text =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_website: text,
                    })
                  }
                  placeholder="Enter website URL"
                  placeholderTextColor="#999"
                  keyboardType="url"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Speciality</Text>
                <IndustryDropdown
                  selectedValue={organizationInfo.organization_industry}
                  onValueChange={value =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_industry: value,
                    })
                  }
                  placeholder="Select Speciality"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Tax ID</Text>
                <TextInput
                  style={styles.input}
                  value={organizationInfo.organization_tax_id}
                  onChangeText={text =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_tax_id: text,
                    })
                  }
                  placeholder="Enter tax ID"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Timezone</Text>
                <TextInput
                  style={styles.input}
                  value={organizationInfo.organization_timezone}
                  onChangeText={text =>
                    setOrganizationInfo({
                      ...organizationInfo,
                      organization_timezone: text,
                    })
                  }
                  placeholder="Enter timezone"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={organizationInfo.organization_description}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    organization_description: text,
                  })
                }
                placeholder="Organization description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Operating Hours</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.organization_operating_hours}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    organization_operating_hours: text,
                  })
                }
                placeholder="Enter operating hours"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Social Media</Text>
            </View>

            <TouchableOpacity
              style={styles.socialMediaButton}
              onPress={() => setShowSocialMediaDropdown(true)}>
              <Text style={styles.socialMediaButtonText}>
                Select Social Media Platforms
              </Text>
              <Icon name="chevron-down" size={20} color="#007B8E" />
            </TouchableOpacity>

            <SocialMediaInputs />
            <SocialMediaDropdown />
            <View style={styles.sectionHeader}>
              <Icon1 name="videocam" size={22} color="#007B8E" />
              <Text style={styles.sectionTitle}>YouTube Videos</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.videosDescription}>
                Add YouTube videos to display on your profile. Patients will be
                able to view these videos to learn more about your expertise.
              </Text>

              {organizationInfo.youtube_videos.length === 0 ? (
                <View style={styles.noVideosContainer}>
                  <Icon1 name="videocam-outline" size={40} color="#CBD5E0" />
                  <Text style={styles.noVideosText}>No videos added yet</Text>
                </View>
              ) : (
                <FlatList
                  data={organizationInfo.youtube_videos}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  renderItem={({item}) => (
                    <View style={styles.videoItem}>
                      <View style={styles.videoInfo}>
                        <Icon1
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
                          <Icon1
                            name="create-outline"
                            size={20}
                            color="#007B8E"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.videoDeleteButton}
                          onPress={() => handleDeleteVideo(item.id)}>
                          <Icon1
                            name="trash-outline"
                            size={20}
                            color="#DC2626"
                          />
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
                <Icon1 name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.addVideoButtonText}>Add YouTube Video</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSave}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Icon
                name="information-outline"
                size={20}
                color="#6B7280"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                This information will be used for all your organization's
                documents and communications.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      {renderBannerOptionsModal()}
      {renderPhotoOptionsModal()}
      {renderVideoModal()}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
    },
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    content: {
      paddingHorizontal: 5,
      paddingVertical: 15,
    },
    content1: {
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    videoModalContent: {
      backgroundColor: '#FFFFFF',
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
      color: '#2C3E50',
      marginBottom: 8,
    },
    videoInput: {
      backgroundColor: '#F8FAFC',
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
    dropdownButtonContainer: {
      marginTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
      paddingTop: 15,
    },
    dropdownDoneButton: {
      backgroundColor: '#007B8E',
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    dropdownDoneButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
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

    imageContainer: {
      alignItems: 'center',
      marginVertical: 20,
      position: 'relative',
    },
    profileSection: {
      marginBottom: 100,
      position: 'relative',
    },
    bannerContainer: {
      width: '100%',
      height: 160,
      position: 'relative',
      overflow: 'hidden',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    editBannerButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      width: 30,
      height: 30,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#FFFFFF',
    },

    profileImageContainer: {
      position: 'absolute',
      top: 110, // Position the profile image to overlap the banner
      left: 15,
      zIndex: 1,
    },
    orgImage: {
      width: 120,
      height: 120,
      borderRadius: 70,
      borderWidth: 2,
      borderColor: '#007b8e',
      backgroundColor: theme.colors.card,
    },
    editImageButton: {
      position: 'absolute',
      bottom: 0,
      right: 10,
      backgroundColor: theme.colors.card,
      width: 30,
      height: 30,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#007b8e',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 3,
    },
    organizationNameContainer: {
      marginTop: 75, // Add space for the profile image that overlaps
      paddingHorizontal: 20,
    },
    organizationNameText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    grayText: {
      color: 'gray',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 15,
      marginBottom: 20,
    },
    halfInput: {
      flex: 1,
    },
    socialMediaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      padding: 15,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#007b8e',
      marginBottom: 15,
    },
    socialMediaButtonText: {
      color: '#007B8E',
      fontSize: 16,
      fontWeight: '500',
    },
    socialInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#007b8e',
      paddingHorizontal: 12,
    },
    videosDescription: {
      fontSize: 14,
      color: theme.colors.text,
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
      backgroundColor: theme.colors.secondary,
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
      color: theme.colors.text,
    },
    videoUrl: {
      fontSize: 13,
      color: '#64748B',
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
    profileImageLine: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 5,
      width: '100%',
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    socialIcon: {
      marginRight: 10,
    },
    socialInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    dropdownContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 15,
      width: '80%',
      maxWidth: 300,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    dropdownItemText: {
      fontSize: 16,
      marginLeft: 10,
      color: '#2C3E50',
    },
    platformIcon: {
      marginLeft: 15,
    },
    // Add/update these existing styles for better visual hierarchy
    sectionHeader: {
      borderLeftWidth: 4,
      borderLeftColor: '#007b8e',
      paddingLeft: 12,
      marginBottom: 15,
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#007b8e',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: '#007b8e',
      color: theme.colors.text,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    // Update button styles
    saveButton: {
      backgroundColor: '#007b8e',
      padding: 16,
      borderRadius: 10,
      alignItems: 'center',
      shadowColor: '#007b8e',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    // Update image container

    // Add card styling for sections
    infoCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      marginTop: 20,
      borderLeftWidth: 4,
      borderLeftColor: '#007b8e',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    multilineInput: {
      height: 80,
      textAlignVertical: 'top',
    },
    inputSection: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
      color: theme.colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F0F8FF',
    },
    buttonContainer: {
      marginVertical: 15,
    },
    disabledButton: {
      opacity: 0.7,
    },
    infoIcon: {
      marginRight: 10,
    },
    infoText: {
      color: '#6B7280',
      fontSize: 12,
      flex: 1,
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
      width: '80%',
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
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderColor: '#007b8e',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
      padding: 16,
      marginBottom: 16,
    },
  });

export default OrganizationSettingsScreen;
