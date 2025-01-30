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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.profileImageContainer}>
            <Image source={profilePhoto} style={styles.profilePhoto} />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleImagePick}
              disabled={isSaving}>
              <Icon name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>
            Dr. {profileInfo.doctor_first_name} {profileInfo.doctor_last_name}
          </Text>
          <Text style={styles.profileQualification}>{profileInfo.qualification}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}>
              <Icon name="person-outline" size={20} color="#007B8E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profileInfo.doctor_first_name}
                onChangeText={text => handleInputChange('doctor_first_name', text)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrapper}>
              <Icon name="person-outline" size={20} color="#007B8E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profileInfo.doctor_last_name}
                onChangeText={text => handleInputChange('doctor_last_name', text)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Qualification</Text>
            <View style={styles.inputWrapper}>
              <Icon name="school-outline" size={20} color="#007B8E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profileInfo.qualification}
                onChangeText={text => handleInputChange('qualification', text)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization</Text>
            <View style={styles.inputWrapper}>
              <Icon name="business-outline" size={20} color="#007B8E" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={profileInfo.organization_name}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Icon name="call-outline" size={20} color="#007B8E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profileInfo.doctor_phone}
                onChangeText={text => handleInputChange('doctor_phone', text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (isSaving || !hasChanges()) && styles.savingButton]}
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
      backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    headerSection: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 20,
      alignItems: 'center',
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    profileImageContainer: {
      position: 'relative',
      marginBottom: 15,
    },
    profilePhoto: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 1,
      borderColor: '#007B8E',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#007B8E',
      width: 28,
      height: 28,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#FFFFFF',
    },
    profileName: {
      fontSize: 24,
      fontWeight: '600',
      color: '#2C3E50',
      marginBottom: 4,
    },
    profileQualification: {
      fontSize: 16,
      color: '#666666',
    },
    formContainer: {
      padding: 20,
      backgroundColor: '#F5F7FA',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#007B8E',
      marginBottom: 20,
      marginTop: 10,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: '#2C3E50',
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#c6eff5',
      paddingHorizontal: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: '#2C3E50',
      paddingVertical: 8,
    },
    disabledInput: {
      backgroundColor: '#F8F9FA',
      color: '#666666',
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
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    savingButton: {
      backgroundColor: '#bec8d4',
    },
    saveIcon: {
      marginRight: 8,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default DoctorProfileEdit;