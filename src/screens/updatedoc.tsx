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
import UpdateDocSkeletonLoader from '../components/UpdateDocSkeletonLoader';
import EditLocationModal from '../components/EditLocationModal';

const {width} = Dimensions.get('window');

type DoctorScreenProps = StackScreenProps<RootStackParamList, 'UpdateDoctor'>;

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface AssignedLocation {
  location_id: string;
  location_name: string;
  working_hours: WorkingHours;
  has_fixed_schedule: boolean;
  schedule_notes: string;
  assigned_at: string;
  is_active: boolean;
  _id?: string;
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
  is_admin: boolean;
  status: string;
  online_available: boolean;
  assigned_locations: AssignedLocation[];
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
  online_available: false,
  assigned_locations: [],
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
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>(initialProfileState);
  const [originalProfileInfo, setOriginalProfileInfo] = useState<ProfileInfo>(initialProfileState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<AssignedLocation | null>(null);
  const [formErrors, setFormErrors] = useState({
    doctor_first_name: false,
    doctor_last_name: false,
    qualification: false,
    doctor_email: false,
    doctor_phone: false,
    is_admin: false,
    status: false,
    online_available: false,
  });

  const validatePhone = (fullPhone: string): boolean => {
    let isValid = false;

    if (fullPhone.startsWith('+1')) {
      const usRegex = /^\+1[2-9]\d{9}$/;
      isValid = usRegex.test(fullPhone);
      setPhoneError(
        isValid
          ? null
          : 'US numbers must start with 2-9 and be 10 digits total',
      );
    } else if (fullPhone.startsWith('+44')) {
      const ukRegex = /^\+44[1-5]\d{9}$/;
      isValid = ukRegex.test(fullPhone);
      setPhoneError(
        isValid
          ? null
          : 'UK numbers must start with 1-5 and be 12 digits total',
      );
    } else {
      const defaultRegex = /^\+\d{1,4}\d{6,}$/;
      isValid = defaultRegex.test(fullPhone);
      setPhoneError(isValid ? null : 'Please enter a valid phone number');
    }

    return isValid;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailError(isValid ? null : 'Please enter a valid email address');
    return isValid;
  };

  const validateField = (field: string, value: any): boolean => {
    if (field === 'doctor_email') {
      return validateEmail(value);
    } else if (field === 'doctor_phone') {
      return validatePhone(countryCode + phoneDigits);
    } else if (field === 'is_admin') {
      return true;
    } else if (field === 'online_available') {
      return value !== undefined && value !== null;
    } else {
      return typeof value === 'string' ? value.trim() !== '' : true;
    }
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
      let code = '';
      let digits = '';

      if (profileInfo.doctor_phone.includes(' ')) {
        const parts = profileInfo.doctor_phone.split(' ');
        code = parts[0];
        digits = parts.slice(1).join('');
      } else {
        const match = profileInfo.doctor_phone.match(/^(\+\d{1,4})(\d{10})$/);
        if (match) {
          code = match[1];
          digits = match[2];
        } else {
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
      setProfileInfo({
        ...response.data,
        status: response.data.status?.toLowerCase?.() || 'active',
        online_available: response.data.online_available || false,
        assigned_locations: response.data.assigned_locations || [],
      });
      setOriginalProfileInfo(response.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    const limited = cleaned.slice(0, 10);
    setPhoneDigits(limited);
    validatePhone(countryCode + limited);

    setFormErrors(prev => ({
      ...prev,
      doctor_phone: limited.length === 0,
    }));
  };

  const handleInputChange = (field: keyof ProfileInfo, value: any) => {
    if (field === 'doctor_phone') {
      handlePhoneChange(value);
    } else {
      if (field === 'is_admin' || field === 'online_available') {
        if (typeof value === 'string') {
          value = value === 'true';
        }
      }

      setProfileInfo(prev => ({...prev, [field]: value}));

      if (field !== 'is_admin') {
        setFormErrors(prev => ({
          ...prev,
          [field]: !validateField(field, value),
        }));
      }

      if (field === 'doctor_email') {
        validateEmail(value);
      }
    }
  };

  const handleAddLocation = () => {
    setSelectedLocation(null);
    setEditingLocationIndex(null);
    setShowLocationModal(true);
  };

  const handleEditLocation = (index: number) => {
    setSelectedLocation(profileInfo.assigned_locations[index]);
    setEditingLocationIndex(index);
    setShowLocationModal(true);
  };

  const handleSaveLocation = (location: AssignedLocation) => {
    const updatedLocations = [...profileInfo.assigned_locations];
    
    if (editingLocationIndex !== null) {
      updatedLocations[editingLocationIndex] = location;
    } else {
      updatedLocations.push(location);
    }

    setProfileInfo(prev => ({
      ...prev,
      assigned_locations: updatedLocations,
    }));

    setShowLocationModal(false);
    setSelectedLocation(null);
    setEditingLocationIndex(null);
  };

  const handleDeleteLocation = (index: number) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to remove this location?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedLocations = profileInfo.assigned_locations.filter(
              (_, i) => i !== index,
            );
            setProfileInfo(prev => ({
              ...prev,
              assigned_locations: updatedLocations,
            }));
          },
        },
      ],
    );
  };

  const hasChanges = () => {
    const currentFullPhone = countryCode + phoneDigits;
    return (
      JSON.stringify(profileInfo) !== JSON.stringify(originalProfileInfo) ||
      currentFullPhone !== originalProfileInfo.doctor_phone
    );
  };

  const validateAllFields = (): boolean => {
    const fullPhone = countryCode + phoneDigits;

    const errors = {
      doctor_first_name: profileInfo.doctor_first_name.trim() === '',
      doctor_last_name: profileInfo.doctor_last_name.trim() === '',
      qualification: profileInfo.qualification.trim() === '',
      doctor_email: !validateEmail(profileInfo.doctor_email),
      doctor_phone: !validatePhone(fullPhone),
      is_admin: false,
      status: false,
      online_available: profileInfo.online_available === undefined || profileInfo.online_available === null,
    };

    setFormErrors(errors);
    return !Object.values(errors).some(error => error === true);
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!validateAllFields()) {
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields correctly.',
        [{text: 'OK'}],
      );
      return;
    }

    const fullPhone = countryCode + phoneDigits;

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
          doctor_phone: fullPhone,
          is_admin: profileInfo.is_admin,
          status: profileInfo.status,
          online_available: profileInfo.online_available,
          assigned_locations: profileInfo.assigned_locations,
        },
        {
          headers: {
            Authorization: `Bearer ${session.idToken}`,
          },
        },
      );

      setOriginalProfileInfo({...profileInfo, doctor_phone: fullPhone});
      showSuccessToast('Profile updated successfully');
      navigation.navigate('Doctor', {doctorId: profileInfo._id});
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{flex: 1}}>
        <BackTabTop screenName="Edit Doctor" />
        <UpdateDocSkeletonLoader />
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
    <View style={styles.safeArea}>
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
                <Text style={styles.label}>
                  First Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    formErrors.doctor_first_name && styles.inputError,
                  ]}
                  value={profileInfo.doctor_first_name}
                  onChangeText={text =>
                    handleInputChange('doctor_first_name', text)
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Last Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    formErrors.doctor_last_name && styles.inputError,
                  ]}
                  value={profileInfo.doctor_last_name}
                  onChangeText={text =>
                    handleInputChange('doctor_last_name', text)
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Qualification <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    formErrors.qualification && styles.inputError,
                  ]}
                  value={profileInfo.qualification}
                  onChangeText={text =>
                    handleInputChange('qualification', text)
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    (emailError || formErrors.doctor_email) &&
                      styles.inputError,
                  ]}
                  value={profileInfo.doctor_email}
                  onChangeText={text => handleInputChange('doctor_email', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Phone <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.phoneContainer}>
                  <CountryPicker
                    selectedCode={countryCode}
                    onValueChange={code => {
                      setCountryCode(code);
                      validatePhone(code + phoneDigits);
                    }}
                  />

                  <TextInput
                    style={[
                      styles.phoneinput,
                      (phoneError || formErrors.doctor_phone) &&
                        styles.inputError,
                      {flex: 1},
                    ]}
                    value={phoneDigits}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    placeholder="Enter mobile number"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Role <Text style={styles.requiredStar}>*</Text>
                </Text>
                <CustomPicker
                  selectedValue={profileInfo.is_admin}
                  onValueChange={value => handleInputChange('is_admin', value)}
                  label="Role"
                  style={styles.input}
                  textColor={theme.colors.text}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Status <Text style={styles.requiredStar}>*</Text>
                </Text>
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Online Treatment <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.checkboxContainer,
                    formErrors.online_available && styles.checkboxContainerError,
                  ]}
                  onPress={() =>
                    handleInputChange('online_available', !profileInfo.online_available)
                  }>
                  <View
                    style={[
                      styles.checkbox,
                      profileInfo.online_available && styles.checkboxChecked,
                      formErrors.online_available && styles.checkboxError,
                    ]}>
                    {profileInfo.online_available && (
                      <Icon
                        name="checkmark"
                        size={16}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Available for online treatment
                  </Text>
                </TouchableOpacity>
                {formErrors.online_available && (
                  <Text style={styles.errorText}>
                    Please specify if doctor is available for online treatment
                  </Text>
                )}
              </View>

              {/* Assigned Locations Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Assigned Locations</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddLocation}>
                    <Icon name="add-circle" size={24} color="#119FB3" />
                    <Text style={styles.addButtonText}>Add Location</Text>
                  </TouchableOpacity>
                </View>

                {profileInfo.assigned_locations.length === 0 ? (
                  <View style={styles.emptyLocationContainer}>
                    <Icon name="location-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyLocationText}>
                      No locations assigned yet
                    </Text>
                  </View>
                ) : (
                  profileInfo.assigned_locations.map((location, index) => (
                    <View key={index} style={styles.locationCard}>
                      <View style={styles.locationHeader}>
                        <View style={styles.locationNameContainer}>
                          <Icon name="location" size={20} color="#119FB3" />
                          <Text style={styles.locationName}>
                            {location.location_name}
                          </Text>
                        </View>
                        <View style={styles.locationActions}>
                          <TouchableOpacity
                            onPress={() => handleEditLocation(index)}
                            style={styles.iconButton}>
                            <Icon name="pencil" size={20} color="#119FB3" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteLocation(index)}
                            style={styles.iconButton}>
                            <Icon name="trash" size={20} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.locationDetails}>
                        <View style={styles.locationDetailRow}>
                          <Icon
                            name={location.is_active ? 'checkmark-circle' : 'close-circle'}
                            size={16}
                            color={location.is_active ? '#4CAF50' : '#FF6B6B'}
                          />
                          <Text style={styles.locationDetailText}>
                            {location.is_active ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                        {location.schedule_notes && (
                          <Text style={styles.scheduleNotes} numberOfLines={2}>
                            {location.schedule_notes}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.savingButton,
                  isKeyboardVisible && styles.saveButtonKeyboardOpen,
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

      {/* Location Edit Modal */}
      <EditLocationModal
        visible={showLocationModal}
        location={selectedLocation}
        onClose={() => {
          setShowLocationModal(false);
          setSelectedLocation(null);
          setEditingLocationIndex(null);
        }}
        onSave={handleSaveLocation}
        isEdit={editingLocationIndex !== null}
        themeColors={{
          card: theme.colors.card,
          text: theme.colors.text,
          background: theme.colors.background,
        }}
        assignedLocations={profileInfo.assigned_locations}
      />
    </View>
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
      marginLeft: -5,
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
      marginBottom: 20,
      marginHorizontal: 20,
    },
    inputError: {
      borderColor: 'red',
      borderWidth: 1,
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
    requiredStar: {
      color: 'red',
      fontWeight: 'bold',
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    checkboxContainerError: {
      borderWidth: 1,
      borderColor: 'red',
      borderRadius: 8,
      paddingHorizontal: 10,
      backgroundColor: 'rgba(255, 0, 0, 0.05)',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#119FB3',
      backgroundColor: theme.colors.card,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: '#119FB3',
    },
    checkboxError: {
      borderColor: 'red',
    },
    checkboxLabel: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
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
    // Location Management Styles
    sectionContainer: {
      marginTop: 20,
      marginBottom: 15,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#119FB3',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(17, 159, 179, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    addButtonText: {
      color: '#119FB3',
      marginLeft: 5,
      fontWeight: '600',
    },
    emptyLocationContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderStyle: 'dashed',
    },
    emptyLocationText: {
      marginTop: 10,
      fontSize: 14,
      color: '#999',
    },
    locationCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#119FB3',
    },
    locationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    locationNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    locationName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    locationActions: {
      flexDirection: 'row',
      gap: 10,
    },
    iconButton: {
      padding: 5,
    },
    locationDetails: {
      marginTop: 5,
    },
    locationDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 5,
    },
    locationDetailText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    scheduleNotes: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
      fontStyle: 'italic',
      marginTop: 5,
    },
  });

export default EditDoctor;