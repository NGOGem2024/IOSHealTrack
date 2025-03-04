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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';
import BackTabTop from '../screens/BackTopTab';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LoadingScreen from '../components/loadingScreen';
import ImagePicker from 'react-native-image-crop-picker';
import {Platform} from 'react-native';
import {useSession} from '../context/SessionContext';
const defaultOrgLogo = require('../assets/profile.png');

interface OrganizationInfo {
  name: string;
  photo: string;
  employees: number;
  email: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  website: string;
  description: string;
  tax_id: string;
  founded_year: number;
  industry: string;
  timezone: string;
  operating_hours: string;
  social_media: {
    [key: string]: string;
  };
}

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

  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo>({
    name: '',
    photo: '',
    employees: 0,
    email: '',
    phone: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: '',
    website: '',
    description: '',
    tax_id: '',
    founded_year: 0,
    industry: '',
    timezone: '',
    operating_hours: '',
    social_media: {},
  });

  const [showSocialMediaDropdown, setShowSocialMediaDropdown] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    fetchOrganizationInfo();
  }, []);

  const fetchOrganizationInfo = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/organization/info');
      setOrganizationInfo(response.data);
    } catch (error) {
      handleError(error);
      Alert.alert('Error', 'Failed to load organization information');
    } finally {
      setIsLoading(false);
    }
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

    const fileName = image.path.split('/').pop() || 'organization.jpg';
    const formData = new FormData();
    formData.append('logo', {
      uri:
        Platform.OS === 'ios' ? image.path.replace('file://', '') : image.path,
      type: image.mime || 'image/jpeg',
      name: fileName,
    } as any);

    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        '/organization/upload-logo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );

      if (response.data.imageUrl) {
        setOrganizationInfo(prev => ({
          ...prev,
          photo: response.data.imageUrl,
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
              await axiosInstance.delete('/organization/logo');
              setOrganizationInfo(prev => ({...prev, photo: ''}));
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
            {organizationInfo.photo && (
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
              value={organizationInfo.social_media[platform] || ''}
              onChangeText={text =>
                setOrganizationInfo(prev => ({
                  ...prev,
                  social_media: {
                    ...prev.social_media,
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
          <View style={styles.dropdownContainer}>
            {socialMediaPlatforms.map(platform => (
              <TouchableOpacity
                key={platform.id}
                style={styles.dropdownItem}
                onPress={() => {
                  const newPlatforms = selectedPlatforms.includes(platform.id)
                    ? selectedPlatforms.filter(p => p !== platform.id)
                    : [...selectedPlatforms, platform.id];
                  setSelectedPlatforms(newPlatforms);
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
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const handleSave = async () => {
    if (!organizationInfo.name || !organizationInfo.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post('/organization/update', organizationInfo);
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
        <LoadingScreen />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTabTop screenName="Update Organization" />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image
              source={
                organizationInfo.photo
                  ? {uri: organizationInfo.photo}
                  : defaultOrgLogo
              }
              style={styles.orgImage}
              onError={() =>
                setOrganizationInfo({
                  ...organizationInfo,
                  photo: '',
                })
              }
            />
            <TouchableOpacity
              style={styles.editImageButton}
              onPress={() => setShowPhotoOptions(true)}>
              <Icon name="pencil" size={20} color="#007b8e" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileImageLine} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Organization Name *</Text>
            <TextInput
              style={styles.input}
              value={organizationInfo.name}
              onChangeText={text =>
                setOrganizationInfo({...organizationInfo, name: text})
              }
              placeholder="Enter organization name"
              placeholderTextColor="#999"
            />

          </View>
          <View style={styles.inputSection}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={organizationInfo.email}
              onChangeText={text =>
                setOrganizationInfo({...organizationInfo, email: text})
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
              value={organizationInfo.phone}
              onChangeText={text =>
                setOrganizationInfo({...organizationInfo, phone: text})
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
                value={organizationInfo.employees.toString()}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    employees: parseInt(text) || 0,
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
                value={organizationInfo.founded_year.toString()}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    founded_year: parseInt(text) || 0,
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
              value={organizationInfo.address_street}
              onChangeText={text =>
                setOrganizationInfo({...organizationInfo, address_street: text})
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
                value={organizationInfo.address_city}
                onChangeText={text =>
                  setOrganizationInfo({...organizationInfo, address_city: text})
                }
                placeholder="Enter city"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.address_state}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    address_state: text,
                  })
                }
                placeholder="Enter state"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.address_zip}
                onChangeText={text =>
                  setOrganizationInfo({...organizationInfo, address_zip: text})
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
                value={organizationInfo.address_country}
                onChangeText={text =>
                  setOrganizationInfo({
                    ...organizationInfo,
                    address_country: text,
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
                value={organizationInfo.website}
                onChangeText={text =>
                  setOrganizationInfo({...organizationInfo, website: text})
                }
                placeholder="Enter website URL"
                placeholderTextColor="#999"
                keyboardType="url"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Industry</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.industry}
                onChangeText={text =>
                  setOrganizationInfo({...organizationInfo, industry: text})
                }
                placeholder="Enter industry"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Tax ID</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.tax_id}
                onChangeText={text =>
                  setOrganizationInfo({...organizationInfo, tax_id: text})
                }
                placeholder="Enter tax ID"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Timezone</Text>
              <TextInput
                style={styles.input}
                value={organizationInfo.timezone}
                onChangeText={text =>
                  setOrganizationInfo({...organizationInfo, timezone: text})
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
              value={organizationInfo.description}
              onChangeText={text =>
                setOrganizationInfo({...organizationInfo, description: text})
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
              value={organizationInfo.operating_hours}
              onChangeText={text =>
                setOrganizationInfo({
                  ...organizationInfo,
                  operating_hours: text,
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
      </ScrollView>
      {renderPhotoOptionsModal()}
    </SafeAreaView>
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
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    imageContainer: {
      alignItems: 'center',
      marginVertical: 20,
      position: 'relative',
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
    profileImageLine: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
      width: '100%',
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
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
      marginBottom: 20,
      marginTop: 25,
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
    orgImage: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 3,
      borderColor: '#007b8e',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
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
    editImageButton: {
      position: 'absolute',
      bottom: 0,
      right: '35%',
      backgroundColor: 'white',
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
  });

export default OrganizationSettingsScreen;
