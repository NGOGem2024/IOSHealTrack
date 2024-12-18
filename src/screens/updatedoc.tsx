import React, {useState, useMemo, useEffect} from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import axios from 'axios';
import {useSession} from '../context/SessionContext';
import {RootStackParamList} from '../types/types';
import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {Picker} from '@react-native-picker/picker';
import {RadioButton} from 'react-native-paper';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';

const {width} = Dimensions.get('window');

type DoctorScreenProps = StackScreenProps<RootStackParamList, 'UpdateDoctor'>;

interface ProfileInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  qualification: string;
  organization_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctors_photo: string;
  is_admin: boolean;
  status: string;
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
  is_admin: false,
  status: 'active',
};

const EditDoctor: React.FC<DoctorScreenProps> = ({navigation, route}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const {session} = useSession();
  const {doctorId} = route.params;
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
      const response = await axiosInstance.get<ProfileInfo>(
        `/doctor/${doctorId}`,
        {
          headers: {
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );
      setProfileInfo(response.data);
      setOriginalProfileInfo(response.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileInfo, value: any) => {
    setProfileInfo(prev => ({...prev, [field]: value}));
  };

  const hasChanges = () => {
    return JSON.stringify(profileInfo) !== JSON.stringify(originalProfileInfo);
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      showSuccessToast('No changes were made to the profile.');
      return;
    }

    if (!session.idToken) {
      handleError(new Error('You must be logged in to update the profile'));
      return;
    }

    setIsSaving(true);

    try {
      const response = await axiosInstance.put(
        `/doctor/update/${profileInfo._id}`,
        {
          doctor_first_name: profileInfo.doctor_first_name,
          doctor_last_name: profileInfo.doctor_last_name,
          qualification: profileInfo.qualification,
          doctor_email: profileInfo.doctor_email,
          doctor_phone: profileInfo.doctor_phone,
          is_admin: profileInfo.is_admin,
          status: profileInfo.status,
        },
        {
          headers: {
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );

      setOriginalProfileInfo(profileInfo);
      showSuccessToast('Profile updated successfully');

      // Redirect to the doctor's profile
      navigation.navigate('Doctor', {doctorId: profileInfo._id});
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
        <Text style={styles.loadingText}>Loading profile information...</Text>
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Edit Profile</Text>
        </View>

        <View style={styles.profileImageContainer}>
          <Image source={profilePhoto} style={styles.profilePhoto} />
          <TouchableOpacity style={styles.editImageButton}>
            {/*<Icon name="camera-outline" size={24} color="#FFFFFF" />*/}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.doctor_first_name}
              onChangeText={text =>
                handleInputChange('doctor_first_name', text)
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.doctor_last_name}
              onChangeText={text => handleInputChange('doctor_last_name', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Qualification</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.qualification}
              onChangeText={text => handleInputChange('qualification', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.doctor_email}
              onChangeText={text => handleInputChange('doctor_email', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.doctor_phone}
              onChangeText={text => handleInputChange('doctor_phone', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <Picker
              selectedValue={profileInfo.is_admin}
              style={styles.picker}
              onValueChange={itemValue =>
                handleInputChange('is_admin', itemValue)
              }>
              <Picker.Item label="Doctor" value={false} />
              <Picker.Item label="Admin" value={true} />
            </Picker>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.radioButtonContainer}>
              <RadioButton
                value="active"
                status={
                  profileInfo.status === 'active' ? 'checked' : 'unchecked'
                }
                onPress={() => handleInputChange('status', 'active')}
              />
              <Text style={styles.labelText}>Active</Text>

              <RadioButton
                value="inactive"
                status={
                  profileInfo.status === 'inactive' ? 'checked' : 'unchecked'
                }
                onPress={() => handleInputChange('status', 'inactive')}
              />
              <Text style={styles.labelText}>Inactive</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.savingButton]}
            onPress={handleSave}
            disabled={isSaving || !hasChanges()}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#119FB3',
    },
    header: {
      padding: 16,
      paddingTop: 40,
      backgroundColor: '#119FB3',
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.card,
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
    profileImageContainer: {
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 30,
    },
    profilePhoto: {
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 3,
      borderColor: theme.colors.card,
    },
    editImageButton: {
      position: 'absolute',
      bottom: 0,
      right: width / 2 - 75,
      backgroundColor: '#119FB3',
      borderRadius: 20,
      padding: 8,
    },
    formContainer: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      color: '#119FB3',
      marginBottom: 5,
      fontWeight: 'bold',
    },
    labelText: {
      fontSize: 16,
      marginBottom: 5,
      color: '#333333',
    },
    input: {
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      elevation: 8,
    },
    disabledInput: {
      backgroundColor: '#F0F0F0',
      color: '#888888',
    },
    picker: {
      borderWidth: 1,
      borderColor: '#D9D9D9',
      borderRadius: 5,
      backgroundColor: '#FFFFFF',
    },
    radioButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    saveButton: {
      backgroundColor: '#119FB3',
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 2,
      marginTop: 10,
      marginBottom: 10,
    },
    savingButton: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

export default EditDoctor;
