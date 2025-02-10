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
import LoadingScreen from '../components/loadingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');

interface ProfileInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  qualification: string;
  organization_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctors_photo: string;
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
};

const DoctorProfileEdit: React.FC = () => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const {session} = useSession();

  const [profileInfo, setProfileInfo] =
    useState<ProfileInfo>(initialProfileState);
  const [originalProfileInfo, setOriginalProfileInfo] =
    useState<ProfileInfo>(initialProfileState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session.idToken) {
      fetchDoctorInfo();
    } else {
      setIsLoading(false);
    }
  }, [session.idToken]);

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
      if (response.data.doctors_photo) {
        await AsyncStorage.removeItem('doctor_photo');
        const imageResponse = await fetch(response.data.doctors_photo);
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
      setProfileInfo(response.data);
      setOriginalProfileInfo(response.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileInfo, value: string) => {
    setProfileInfo(prev => ({...prev, [field]: value}));
  };

  const hasChanges = () => {
    return (
      profileInfo.doctor_first_name !== originalProfileInfo.doctor_first_name ||
      profileInfo.doctor_last_name !== originalProfileInfo.doctor_last_name ||
      profileInfo.qualification !== originalProfileInfo.qualification ||
      profileInfo.doctor_email !== originalProfileInfo.doctor_email ||
      profileInfo.doctor_phone !== originalProfileInfo.doctor_phone
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

  const handleImagePick = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 800,
        height: 800,
        cropping: true,
        cropperCircleOverlay: true,
        mediaType: 'photo',
        compressImageQuality: 0.7,
      });

      if (!image) {
        return;
      }

      const fileName = image.path.split('/').pop() || 'profile.jpg';

      const formData = new FormData();
      formData.append('profile_photo', {
        uri:
          Platform.OS === 'ios'
            ? image.path.replace('file://', '')
            : image.path,
        type: image.mime || 'image/jpeg',
        name: fileName,
      } as any);

      setIsSaving(true);

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
        // Update the state
        setProfileInfo(prev => ({
          ...prev,
          doctors_photo: response.data.imageUrl,
        }));
        showSuccessToast('Profile photo updated successfully');
        fetchDoctorInfo();
      }
    } catch (error: any) {
      if (error?.code !== 'E_PICKER_CANCELLED') {
        handleError(error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingScreen />
      </View>
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
        showsVerticalScrollIndicator={false}>
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
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleImagePick}
                disabled={isSaving}>
                <Icon name="camera" size={18} color="#FFFFFF" />
              </TouchableOpacity>
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
                label: 'Organization',
                icon: 'business-outline',
                value: profileInfo.organization_name,
                field: 'organization_name',
                disabled: true,
              },
              {
                label: 'Phone Number',
                icon: 'call-outline',
                value: profileInfo.doctor_phone,
                field: 'doctor_phone',
                keyboardType: 'phone-pad',
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
                    keyboardType={item.keyboardType as any}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            ))}
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
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },
    scrollView: {
      flex: 1,
    },
    headerContainer: {
      backgroundColor: '#FFFFFF',
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
    cameraButton: {
      position: 'absolute',
      bottom: 5,
      right: 5,
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
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#007B8E',
      marginLeft: 10,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 15,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputBorder: {
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
      paddingTop: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#2C3E50',
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      height: 50,
    },
    disabledWrapper: {
      backgroundColor: '#F1F5F9',
      borderColor: '#E2E8F0',
    },
    inputIcon: {
      marginLeft: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: '#2C3E50',
      height: '100%',
      marginLeft: 2,
    },
    disabledInput: {
      color: '#94A3B8',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#007B8E',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    savingButton: {
      backgroundColor: '#94A3B8',
    },
    saveIcon: {
      marginRight: 8,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F7FA',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#2C3E50',
    },
  });

export default DoctorProfileEdit;
