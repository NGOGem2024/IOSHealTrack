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
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
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
import BackTabTop from './BackTopTab';
import {CustomPicker, CustomRadioGroup} from './customradio';
import LoadingScreen from '../components/loadingScreen';
import PhoneInput from 'react-native-phone-number-input';
import CountryPicker from './CountryPickerDoctors';

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
  const [countryCode, setCountryCode] = useState('+91'); // This will be updated on fetch
  const [phoneDigits, setPhoneDigits] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validatePhone = (fullPhone: string): boolean => {
    // This regex accepts a '+' followed by 1-4 digits (country code),
    // then a mobile number starting with 6-9 followed by 9 more digits.
    const phoneRegex = /^\+\d{1,4}[6-9]\d{9}$/;
    const isValid = phoneRegex.test(fullPhone);
    setPhoneError(
      isValid ? null : 'Please enter a valid phone number starting with 6-9',
    );
    return isValid;
  };

  useEffect(() => {
    if (session.idToken) {
      fetchDoctorInfo();
    } else {
      setIsLoading(false);
    }
  }, [session.idToken]);

  useEffect(() => {
    if (profileInfo.doctor_phone) {
      // Assume the stored number is either in the format "+44 1234567890" (with space)
      // or "+441234567890" (without a space).
      let code = '';
      let digits = '';

      if (profileInfo.doctor_phone.includes(' ')) {
        // Split on space
        const parts = profileInfo.doctor_phone.split(' ');
        code = parts[0];
        digits = parts.slice(1).join(''); // In case there are extra spaces
      } else {
        // Use a regex to capture country code and the rest.
        // This regex assumes the phone is in the format: +[1-4 digits][10 digits]
        const match = profileInfo.doctor_phone.match(/^(\+\d{1,4})(\d{10})$/);
        if (match) {
          code = match[1];
          digits = match[2];
        } else {
          // Fallback: use the first 3 or 4 characters as the code, adjust as needed.
          code = profileInfo.doctor_phone.slice(0, 3);
          digits = profileInfo.doctor_phone.slice(3);
        }
      }

      setCountryCode(code);
      setPhoneDigits(digits);
    }
  }, [profileInfo.doctor_phone]);

  const fetchDoctorInfo = async () => {
    if (!session.idToken) {
      return;
    }
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

  const handlePhoneChange = (value: string) => {
    // Allow only digits
    const cleaned = value.replace(/[^\d]/g, '');
    // Limit to 10 digits (or adjust as needed)
    const limited = cleaned.slice(0, 10);
    setPhoneDigits(limited);
    // Validate the full number (combine country code and digits)
    validatePhone(countryCode + limited);
  };

  const handleInputChange = (field: keyof ProfileInfo, value: any) => {
    if (field === 'doctor_phone') {
      handlePhoneChange(value);
    } else {
      setProfileInfo(prev => ({...prev, [field]: value}));
    }
  };

  const hasChanges = () => {
    const currentFullPhone = countryCode + phoneDigits;

    return (
      JSON.stringify(profileInfo) !== JSON.stringify(originalProfileInfo) ||
      currentFullPhone !== originalProfileInfo.doctor_phone
    );
  };
  

  const handleSave = async () => {
    Keyboard.dismiss();
    const fullPhone = countryCode + phoneDigits;

    if (!validatePhone(fullPhone)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid 10-digit mobile number starting with a valid country code',
      );
      return;
    }

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
          doctor_phone: fullPhone, // Save the combined phone number
          is_admin: profileInfo.is_admin,
          status: profileInfo.status,
        },
        {
          headers: {
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );

      setOriginalProfileInfo({...profileInfo, doctor_phone: fullPhone});
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
      <BackTabTop screenName="Edit Doctor" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.profileImageContainer}>
          <Image source={profilePhoto} style={styles.profilePhoto} />
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
            <View style={styles.phoneContainer}>
  <CountryPicker
    selectedCode={countryCode}
    onValueChange={(code) => {
      setCountryCode(code);
      
      validatePhone(code + phoneDigits);
    }}
  />

  <TextInput
    style={[
      styles.phoneinput,
      phoneError && styles.inputError,
      { flex: 1 },
    ]}
    value={phoneDigits}
    onChangeText={handlePhoneChange}
    keyboardType="phone-pad"
    placeholder="Enter mobile number"
    maxLength={10}
  />
</View>
            {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <CustomPicker
              selectedValue={profileInfo.is_admin}
              onValueChange={value => handleInputChange('is_admin', value)}
              label="Role"
              style={styles.input}
              textColor={theme.colors.text}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <CustomRadioGroup
              value={profileInfo.status}
              onValueChange={value => handleInputChange('status', value)}
              options={[
                {label: 'Active', value: 'active'},
                {label: 'Inactive', value: 'inactive'},
              ]}
              label="Status"
              textColor={theme.colors.text}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.savingButton,
              isKeyboardVisible && styles.saveButtonKeyboardOpen
            ]}
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
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#007B8E',
    },
    header: {
      padding: 16,
      paddingTop: 40,
      backgroundColor: '#119FB3',
    },
    phoneContainer: {
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: '#119FB3',
      borderRadius: 10,
      paddingHorizontal: 10,
      overflow: 'hidden',
    },
    phoneinput: {
      backgroundColor: theme.colors.card,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 0,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      padding: 10,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: '#119FB3',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
    },
    saveButtonKeyboardOpen: {
      marginBottom: 20, // Adjust spacing
      marginHorizontal: 20, // Add some horizontal margin
    },
    disabledInput: {
      backgroundColor: '#F0F0F0',
      color: '#888888',
      borderColor: '#CCCCCC',
      elevation: 0,
    },
    picker: {
      width: 110,
      borderWidth: 1,
      borderColor: '#119FB3',
      borderRadius: 10,
      color: theme.colors.text,
      backgroundColor: theme.colors.card,
      marginRight: -8,
    },
    inputError: {
      borderColor: 'red',
      borderWidth: 1,
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
      marginTop: 15,
      marginBottom: 30,
    },
    profilePhoto: {
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 1,
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
      marginBottom: 15,
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
    errorText: {
      color: 'red',
      fontSize: 12,
      marginTop: 5,
    },
  });

export default EditDoctor;
