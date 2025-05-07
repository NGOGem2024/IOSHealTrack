import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';
import {Picker} from '@react-native-picker/picker';
import BackTopTab from '../screens/BackTopTab';
import {getTheme} from '../screens/Theme';
import {useTheme} from '../screens/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type CreateConsultationScreenProps = StackScreenProps<
  RootStackParamList,
  'CreateConsultation'
>;

type FormDataType = {
  patientSymptoms: string;
  causes: string;
  notes: string;
  results: string;
  consultationDate: Date;
  consultationTime: Date;
};

type ConsultationResponseType = {
  message: string;
  consultation: {
    organizationName: string;
    doctorName: string;
    consultationDate: string;
    consultationTime: string;
    organizationId: string;
    patientSymptoms: string;
    causes: string;
    notes: string;
    results: string;
    createdAt: string;
  };
};

const CreateConsultationScreen: React.FC<CreateConsultationScreenProps> = ({
  navigation,
  route,
}) => {
  const {patientId, appointmentId} = route.params;
  const {session} = useSession();
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  // Initialize with current date and time
  const now = new Date();

  const [formData, setFormData] = useState<FormDataType>({
    patientSymptoms: '',
    causes: '',
    notes: '',
    results: '',
    consultationDate: now,
    consultationTime: now,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [patientInfo, setPatientInfo] = useState<string>('');

  const handleInputChange = (
    name: keyof FormDataType,
    value: string | Date | boolean,
  ) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const formatDateForDisplay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeForDisplay = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${hours}:${minutes} ${ampm}`;
  };

  // Check if the selected datetime is in the past with a buffer
  // Add a 2-minute buffer to allow for current time bookings
  const isDateTimeInPast = (date: Date, time: Date): boolean => {
    const now = new Date();
    
    const selectedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    );
    
    // Add a 2-minute buffer to now
    const bufferTime = new Date(now.getTime() - (2 * 60 * 1000));
    
    return selectedDateTime < bufferTime;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = selectedDate;
      
      // If the new date is today, check if the currently selected time is now in the past
      const isToday = 
        newDate.getDate() === now.getDate() &&
        newDate.getMonth() === now.getMonth() &&
        newDate.getFullYear() === now.getFullYear();
      
      if (isToday && isDateTimeInPast(newDate, formData.consultationTime)) {
        // If the time is now in the past with the new date, update the time to current time
        handleInputChange('consultationTime', new Date());
      }
      
      handleInputChange('consultationDate', newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Check if selected time is in the past (if date is today)
      const isToday = 
        formData.consultationDate.getDate() === now.getDate() &&
        formData.consultationDate.getMonth() === now.getMonth() &&
        formData.consultationDate.getFullYear() === now.getFullYear();
      
      if (isToday && isDateTimeInPast(formData.consultationDate, selectedTime)) {
        Alert.alert('Invalid Time', 'Please choose a current or future time for the consultation.');
        // Set time to current time as a reasonable default
        const currentTime = new Date();
        handleInputChange('consultationTime', currentTime);
      } else {
        handleInputChange('consultationTime', selectedTime);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      Keyboard.dismiss();
      if (!formData.patientSymptoms.trim()) {
        Alert.alert('Error', 'Patient Symptoms is required');
        return;
      }

      if (!formData.causes.trim()) {
        Alert.alert('Error', 'Causes is required');
        return;
      }

      if (!formData.notes.trim()) {
        Alert.alert('Error', 'Notes is required');
        return;
      }

      if (!formData.results) {
        Alert.alert('Error', 'Results selection is required');
        return;
      }

      // Update the check for past date/time with buffer for current time
      if (isDateTimeInPast(formData.consultationDate, formData.consultationTime)) {
        // Update consultation time to current time if it's in the past
        const updatedTime = new Date();
        handleInputChange('consultationTime', updatedTime);
        
        // Ask user if they want to proceed with current time instead
        Alert.alert(
          'Time Adjustment',
          'The selected time is in the past. Would you like to proceed with the current time instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Proceed with Current Time',
              onPress: () => submitConsultation(),
            },
          ],
        );
        return;
      }

      // If all validations pass, submit the consultation
      submitConsultation();
    } catch (error) {
      Alert.alert('Error', 'Failed to process your request');
      console.error(error);
    }
  };

  const submitConsultation = async () => {
    try {
      setIsSubmitting(true);

      if (!session.idToken) {
        throw new Error('No authentication token found');
      }
      // Format date and time for the API using the selected values
      const consultationDate = formData.consultationDate.toISOString();

      const hours = formData.consultationTime
        .getHours()
        .toString()
        .padStart(2, '0');
      const minutes = formData.consultationTime
        .getMinutes()
        .toString()
        .padStart(2, '0');
      const seconds = formData.consultationTime
        .getSeconds()
        .toString()
        .padStart(2, '0');
      const consultationTime = `${hours}:${minutes}:${seconds}`;

      // Extract just "needed" or "not needed" from the results field
      let resultsValue = '';
      if (formData.results === 'therapy_needed') {
        resultsValue = 'Therapy needed';
      } else if (formData.results === 'therapy_not_needed') {
        resultsValue = 'Therapy not needed';
      }

      const consultationData = {
        patientSymptoms: formData.patientSymptoms,
        causes: formData.causes,
        notes: formData.notes,
        results: resultsValue,
        consultationDate: consultationDate,
        consultationTime: consultationTime,
        appointmentId: appointmentId || null,
      };

      const response = await axiosInstance.post<ConsultationResponseType>(
        `/patient/${patientId}/consultations`,
        consultationData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );

      const consultationResponse = response.data;

      Alert.alert(
        'Success',
        consultationResponse.message || 'Consultation created successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create consultation');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // For time picker, set minimum time to current time if date is today
  const getMinimumTime = (): Date | undefined => {
    const isToday = 
      formData.consultationDate.getDate() === now.getDate() &&
      formData.consultationDate.getMonth() === now.getMonth() &&
      formData.consultationDate.getFullYear() === now.getFullYear();
    
    // No need to return a minimum time - let users select any time
    // The validation happens in handleTimeChange and handleSubmit
    return undefined;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      style={{flex: 1}}>
      <View style={styles.container}>
        <BackTopTab screenName="Create Consultation" />
        <ScrollView
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateContainer}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}>
                <View style={styles.inputWithIcon}>
                  <MaterialIcons
                    name="calendar-today"
                    size={20}
                    color={theme.colors.mainColor}
                  />
                  <Text style={styles.dateTimeText}>
                    {formatDateForDisplay(formData.consultationDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}>
                <View style={styles.inputWithIcon}>
                  <MaterialIcons
                    name="access-time"
                    size={20}
                    color={theme.colors.mainColor}
                  />
                  <Text style={styles.dateTimeText}>
                    {formatTimeForDisplay(formData.consultationTime)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.consultationDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={formData.consultationTime}
              mode="time"
              display="spinner"
              is24Hour={false}
              onChange={handleTimeChange}
              minimumDate={getMinimumTime()}
            />
          )}

          <Text style={styles.label}>
            Patient Symptoms <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={formData.patientSymptoms}
            onChangeText={text => handleInputChange('patientSymptoms', text)}
            placeholder="Describe patient symptoms"
            placeholderTextColor="#838584"
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>
            Causes <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={formData.causes}
            onChangeText={text => handleInputChange('causes', text)}
            placeholder="Describe possible causes"
            placeholderTextColor="#838584"
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>
            Notes <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={formData.notes}
            onChangeText={text => handleInputChange('notes', text)}
            placeholder="Add notes about the consultation"
            placeholderTextColor="#838584"
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>
            Results <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.results}
              style={styles.picker}
              onValueChange={itemValue => {
                if (itemValue !== '') {
                  handleInputChange('results', itemValue);
                }
              }}>
              <Picker.Item
                label="Select Result"
                value=""
                style={styles.picker1}
              />
              <Picker.Item
                label="Therapy Needed"
                value="therapy_needed"
                style={styles.picker2}
              />
              <Picker.Item
                label="Therapy Not Needed"
                value="therapy_not_needed"
                style={styles.picker2}
              />
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Booking...' : 'Book Consultation'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
    },
    scrollContainer: {
      padding: 25,
      paddingBottom: 90,
    },
    required: {
      color: theme.colors.notification,
    },
    dateTimeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    dateContainer: {
      flex: 1,
      marginRight: 8,
    },
    timeContainer: {
      flex: 1,
      marginLeft: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: theme.colors.mainColor,
    },
    dateButton: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(245, 250, 255, 0.5)'
          : 'rgba(17, 159, 179, 0.05)',
      borderWidth: 1,
      borderColor: theme.colors.mainColor,
      borderRadius: 8,
      padding: 12,
      justifyContent: 'center',
    },
    timeButton: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(245, 250, 255, 0.5)'
          : 'rgba(17, 159, 179, 0.05)',
      borderWidth: 1,
      borderColor: theme.colors.mainColor,
      borderRadius: 8,
      padding: 12,
      justifyContent: 'center',
    },
    inputWithIcon: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateTimeText: {
      color: theme.colors.text,
      fontSize: 16,
      paddingRight: 35,
    },
    input: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(245, 250, 255, 0.5)'
          : 'rgba(17, 159, 179, 0.05)',
      borderWidth: 1,
      borderColor: theme.colors.mainColor,
      borderRadius: 8,
      padding: 8,
      marginBottom: 16,
      color: theme.colors.text,
    },
    multilineInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.colors.mainColor,
      borderRadius: 8,
      marginBottom: 16,
      overflow: 'hidden',
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(245, 250, 255, 0.5)'
          : 'rgba(17, 159, 179, 0.05)',
    },
    picker: {
      height: 50,
      width: '100%',
    },
    picker1: {
      color: theme.colors.mainColor,
    },
    picker2: {
      color: theme.colors.text,
    },
    submitButton: {
      backgroundColor: '#119FB3',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 40,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    disabledButton: {
      backgroundColor: '#7BCAD5',
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default CreateConsultationScreen;