import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  useColorScheme,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import BackTabTop from './BackTopTab';
import TherapyCategoryDropdown from './TherapyCategoryDropdown';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSession} from '../context/SessionContext';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';

type CreateTherapyPlanProps = NativeStackScreenProps<
  RootStackParamList,
  'CreateTherapyPlan'
>;
type InputFieldProps = {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
};
type DatePickerFieldProps = {
  label: string;
  date: Date;
  showDatePicker: boolean;
  onPress: () => void;
  onChange: (event: any, selectedDate?: Date) => void;
  disabled?: boolean;
  isDarkMode?: boolean;
};

type DropdownProps = {
  value: string;
  onValueChange: (itemValue: string) => void;
  items: string[];
};

const CreateTherapyPlan: React.FC<CreateTherapyPlanProps> = ({
  navigation,
  route,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [therapyPlan, setTherapyPlan] = useState({
    patient_diagnosis: '',
    patient_symptoms: '',
    therapy_duration: '',
    therapy_category: '',
    total_amount: '',
    received_amount: '0',
    therapy_name: '',
    balance: '',
    payment_type: 'recurring',
    per_session_amount: '', // Added per session amount
    estimated_sessions: '', // Added estimated number of sessions
    discount_percentage: '0', // Add this line
  });
  const {session} = useSession();
  const {patientId} = route.params;
  const colorScheme = useColorScheme(); // Get current color scheme
  const isDarkMode = colorScheme === 'dark';
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Add this useEffect
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide', // Corrected event name
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  useEffect(() => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Estimate 2 sessions per week
      const estimatedSessions = Math.ceil((diffDays / 7) * 2);
      setTherapyPlan(prev => ({
        ...prev,
        therapy_duration: `${diffDays} days`,
        estimated_sessions: estimatedSessions.toString(),
      }));
    }
  }, [startDate, endDate]);

  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      // Get today's date at midnight to compare only the date, not time
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if selected date is today or in the future
      if (selectedDate >= today) {
        setStartDate(selectedDate);

        // Automatically adjust end date if it's before the new start date
        if (endDate < selectedDate) {
          // Set end date to 7 days after start date by default
          const defaultEndDate = new Date(selectedDate);
          defaultEndDate.setDate(selectedDate.getDate() + 7);
          setEndDate(defaultEndDate);
        }
      } else {
        // Show an alert if a past date is selected
        Alert.alert(
          'Invalid Date',
          'Please select today or a future date for the start of therapy.',
        );
      }
    }
  };
  useEffect(() => {
    if (
      therapyPlan.payment_type === 'recurring' &&
      therapyPlan.estimated_sessions &&
      therapyPlan.total_amount
    ) {
      const perSession = (
        parseFloat(therapyPlan.total_amount) /
        parseFloat(therapyPlan.estimated_sessions)
      ).toFixed(2);
      setTherapyPlan(prev => ({
        ...prev,
        per_session_amount: perSession,
      }));
    }
  }, [
    therapyPlan.total_amount,
    therapyPlan.estimated_sessions,
    therapyPlan.payment_type,
  ]);

  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // Ensure end date is not before start date
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
      } else {
        // Show an alert if a past date is selected
        Alert.alert(
          'Invalid Date',
          'End date cannot be before the start date. Please select a date on or after the start date.',
        );
      }
    }
  };

  const showStartDatepicker = () => {
    setShowStartDatePicker(true);
  };

  const showEndDatepicker = () => {
    setShowEndDatePicker(true);
  };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    if (!therapyPlan.therapy_name.trim()) {
      newErrors.therapy_name = 'Therapy name is required';
    }
    if (!session.is_admin) {
      // Only validate these fields if the user is not an admin
      if (!therapyPlan.patient_symptoms.trim()) {
        newErrors.patient_symptoms = 'Patient symptoms are required';
      }
      if (!therapyPlan.patient_diagnosis.trim()) {
        newErrors.patient_diagnosis = 'Patient diagnosis is required';
      }
    }
    if (!therapyPlan.therapy_category) {
      newErrors.therapy_category = 'Therapy category is required';
    }
    if (!therapyPlan.total_amount.trim()) {
      newErrors.total_amount = 'Total amount is required';
    } else if (isNaN(parseFloat(therapyPlan.total_amount))) {
      newErrors.total_amount = 'Total amount must be a valid number';
    }
    if (!therapyPlan.received_amount.trim()) {
      newErrors.received_amount = 'Received amount is required';
    } else if (isNaN(parseFloat(therapyPlan.received_amount))) {
      newErrors.received_amount = 'Received amount must be a valid number';
    }
    if (therapyPlan.payment_type === 'recurring') {
      if (
        !therapyPlan.per_session_amount ||
        parseFloat(therapyPlan.per_session_amount) <= 0
      ) {
        newErrors.per_session_amount = 'Per session amount is required';
      }
      if (
        !therapyPlan.estimated_sessions ||
        parseInt(therapyPlan.estimated_sessions) <= 0
      ) {
        newErrors.estimated_sessions = 'Estimated sessions is required';
      }
    }

    if (
      therapyPlan.payment_type === 'one-time' &&
      parseFloat(therapyPlan.received_amount) !==
        parseFloat(therapyPlan.total_amount)
    ) {
      newErrors.received_amount = 'One-time payment requires full amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const paymentTypes = [
    {label: 'Recurring Payment', value: 'recurring'},
    {label: 'One-time Payment', value: 'one-time'},
  ];

  const handleCreateTherapyPlan = async () => {
    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields correctly.',
      );
      return;
    }

    setIsLoading(true);

    try {
      const formData = {
        therapy_name: therapyPlan.therapy_name,
        patient_diagnosis: therapyPlan.patient_diagnosis,
        patient_symptoms: therapyPlan.patient_symptoms,
        therapy_duration: therapyPlan.therapy_duration,
        therapy_start: startDate.toISOString().split('T')[0],
        therapy_end: endDate.toISOString().split('T')[0],
        patient_therapy_category: therapyPlan.therapy_category,
        total_amount: therapyPlan.total_amount,
        received_amount: therapyPlan.received_amount,
        balance: therapyPlan.balance,
        payment_type: therapyPlan.payment_type,
        estimated_sessions: parseInt(therapyPlan.estimated_sessions),
        per_session_amount: parseFloat(therapyPlan.per_session_amount),
        discount_percentage: parseFloat(therapyPlan.discount_percentage), // Add this line
      };

      const response = await axiosInstance.post(
        `/therapy/plan/${patientId}`,
        formData,
      );

      if (response.status === 200 || response.status === 201) {
        showSuccessToast('Plan created successfully');
        navigation.goBack();
      } else {
        setErrors({
          ...errors,
          submit: 'Failed to create plan. Please try again.',
        });
      }
    } catch (error) {
      handleError(error);
      setErrors({
        ...errors,
        submit: 'An error occurred while creating plan.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const InputField: React.FC<InputFieldProps> = ({
    icon,
    placeholder,
    value,
    onChangeText,
  }) => (
    <View style={styles.inputContainer}>
      {icon}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#A0A0A0"
      />
    </View>
  );

  const DatePickerField: React.FC<DatePickerFieldProps> = ({
    label,
    date,
    showDatePicker,
    onPress,
    onChange,
    isDarkMode,
  }) => (
    <View style={styles.dateTimeBlock}>
      <Text style={styles.dateTimeLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.dateTimeContainer, isDarkMode && styles.saveButtonDark1]}
        onPress={onPress}>
        <Text style={[styles.dateTimeText, isDarkMode && styles.textDark]}>
          {date.toLocaleDateString()}
        </Text>
        <FontAwesome name="calendar" size={24} color="#119FB3" />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
  useEffect(() => {
    const industryCategories = getCategoriesByIndustry();
    setCategories(industryCategories);
  }, [session.organization_industry]);
  const [categories, setCategories] = useState<string[]>([]);
  const getCategoriesByIndustry = () => {
    const industry = session.organization_industry?.toLowerCase();
    switch (industry) {
      case 'physiotherapy':
        return [
          'Musculoskeletal',
          'Neurological',
          'Cardiorespiratory',
          'Paediatrics',
          "Women's Health",
          'Geriatrics',
          'Post surgical rehabilitation',
        ];

      case 'dentistry':
      case 'dental':
        return [
          'Orthodontics',
          'Periodontics',
          'Endodontics',
          'Prosthodontics',
          'Oral Surgery',
          'Pediatric Dentistry',
          'Cosmetic Dentistry',
          'Preventive Dentistry',
        ];

      case 'gynacologist':
      case 'gynacologist':
        return [
          'Pregnancy & Antenatal Care',
          'Menstrual Disorders',
          'Infertility Treatment',
          'PCOS/PCOD Management',
          'Menopause Management',
          'Gynecologic Oncology',
          'Urogynecology',
          'Contraception & Family Planning',
        ];

      case 'ayurveda':
        return [
          'Panchakarma Therapy',
          'Digestive Disorders',
          'Joint & Bone Disorders',
          'Skin Diseases',
          'Respiratory Disorders',
          'Stress & Mental Wellness',
          'Detoxification Programs',
          'Chronic Pain Management',
        ];

      case 'homeopathy':
        return [
          'Allergy & Immunity',
          'Skin & Hair Disorders',
          'Chronic Illness Management',
          'Stress & Anxiety',
          'Hormonal Imbalance',
          "Women's Health",
          'Child Health',
          'Respiratory Conditions',
        ];

      case 'pediatrics':
      case 'paediatrics':
        return [
          'Newborn Care',
          'Vaccination & Immunization',
          'Nutrition & Growth Monitoring',
          'Common Infections',
          'Developmental Delays',
          'Pediatric Allergy & Asthma',
          'Adolescent Health',
          'Behavioral Issues',
        ];

      default:
        // Default to general medical categories if industry not recognized
        return [
         'Musculoskeletal',
          'Neurological',
          'Cardiorespiratory',
          'Paediatrics',
          "Women's Health",
          'Geriatrics',
          'Post surgical rehabilitation',
        ];
    }
  };

  useEffect(() => {
    const total = parseFloat(therapyPlan.total_amount) || 0;
    const received = parseFloat(therapyPlan.received_amount) || 0;
    const balance = total - received;
    setTherapyPlan({...therapyPlan, balance: balance.toString()});
  }, [therapyPlan.total_amount, therapyPlan.received_amount]);
  useEffect(() => {
    const total = parseFloat(therapyPlan.total_amount) || 0;
    const discount = parseFloat(therapyPlan.discount_percentage) || 0;
    const received = parseFloat(therapyPlan.received_amount) || 0;

    // Calculate discounted amount
    const discountAmount = (total * discount) / 100;
    const finalAmount = total - discountAmount;
    const balance = finalAmount - received;

    setTherapyPlan(prev => ({
      ...prev,
      balance: balance.toString(),
    }));
  }, [
    therapyPlan.total_amount,
    therapyPlan.received_amount,
    therapyPlan.discount_percentage,
  ]);

  return (
    <View style={styles.safeArea}>
      <BackTabTop screenName="Plan" />
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={50} // Adjust this value as needed
        extraHeight={100} // Add this prop
        enableResetScrollToCoords={false}
        scrollEnabled={true}
        bounces={false} // Changed from true to false
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        style={[styles.scrollView, isDarkMode && styles.scrollViewDark]}
        contentContainerStyle={[
          styles.scrollContainer,
          keyboardVisible && {paddingBottom: -30}, // Reduced padding when keyboard is visible
        ]}>
        <Animated.View
          style={[
            styles.container,
            isDarkMode && styles.containerDark,
            keyboardVisible && {paddingBottom: -350}, // Reduce padding when keyboard is visible
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            Create Treatment Plan
          </Text>
          <TherapyCategoryDropdown
            value={therapyPlan.therapy_category}
            onValueChange={itemValue =>
              setTherapyPlan({...therapyPlan, therapy_category: itemValue})
            }
            items={categories}
          />
          {errors.therapy_category && (
            <Text style={styles.errorText}>{errors.therapy_category}</Text>
          )}
          <View
            style={[
              styles.inputContainer,
              isDarkMode && styles.balanceContainerDark,
            ]}>
            <MaterialIcons
              name="edit"
              size={24}
              color={isDarkMode ? '#66D9E8' : '#119FB3'}
            />
            <TextInput
              style={styles.input}
              placeholder="Plan Name"
              value={therapyPlan.therapy_name}
              onChangeText={text =>
                setTherapyPlan({...therapyPlan, therapy_name: text})
              }
              keyboardType="default"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          {errors.therapy_name && (
            <Text style={styles.errorText}>{errors.therapy_name}</Text>
          )}
          <View
            style={[
              styles.inputContainer,
              isDarkMode && styles.balanceContainerDark,
            ]}>
            <MaterialIcons
              name="healing"
              size={24}
              color={isDarkMode ? '#66D9E8' : '#119FB3'}
            />
            <TextInput
              style={styles.input}
              placeholder="Patient Symptoms"
              value={therapyPlan.patient_symptoms} // Corrected here
              onChangeText={text =>
                setTherapyPlan({...therapyPlan, patient_symptoms: text})
              }
              keyboardType="default"
              placeholderTextColor="#A0A0A0"
            />
          </View>
          {errors.patient_symptoms && (
            <Text style={styles.errorText}>{errors.patient_symptoms}</Text>
          )}
          <View
            style={[
              styles.inputContainer,
              isDarkMode && styles.balanceContainerDark,
            ]}>
            <MaterialIcons
              name="local-hospital"
              size={24}
              color={isDarkMode ? '#66D9E8' : '#119FB3'}
            />
            <TextInput
              style={styles.input}
              placeholder="Patient Diagnosis"
              value={therapyPlan.patient_diagnosis} // Corrected here
              onChangeText={
                text =>
                  setTherapyPlan({...therapyPlan, patient_diagnosis: text}) // Updates patient_diagnosis
              }
              keyboardType="default"
              placeholderTextColor="#A0A0A0"
            />
          </View>
          {errors.patient_diagnosis && (
            <Text style={styles.errorText}>{errors.patient_diagnosis}</Text>
          )}

          <View style={styles.dateTimeRow}>
            <DatePickerField
              label="Start Date"
              date={startDate}
              showDatePicker={showStartDatePicker}
              onPress={showStartDatepicker}
              onChange={onChangeStartDate}
              isDarkMode={isDarkMode}
            />

            <DatePickerField
              label="End Date"
              date={endDate}
              showDatePicker={showEndDatePicker}
              onPress={showEndDatepicker}
              onChange={onChangeEndDate}
              isDarkMode={isDarkMode}
            />
          </View>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

          <View
            style={[
              styles.durationContainer,
              isDarkMode && styles.durationContainerDark,
            ]}>
            <MaterialIcons
              name="timer"
              size={24}
              color={isDarkMode ? '#66D9E8' : '#119FB3'}
            />
            <Text style={[styles.durationValue, isDarkMode && styles.textDark]}>
              Duration: {therapyPlan.therapy_duration}
            </Text>
          </View>
          <View style={styles.paymentTypeContainer}>
            <Text style={[styles.inputLabel, isDarkMode && styles.labelDark]}>
              Payment Type
            </Text>
            <View style={styles.radioGroup}>
              {paymentTypes.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.radioButton,
                    isDarkMode && styles.radioButtonDark,
                    therapyPlan.payment_type === type.value &&
                      styles.radioButtonSelected,
                    therapyPlan.payment_type === type.value &&
                      isDarkMode &&
                      styles.radioButtonSelectedDark,
                  ]}
                  onPress={() =>
                    setTherapyPlan({...therapyPlan, payment_type: type.value})
                  }>
                  <View
                    style={[
                      styles.radio,
                      isDarkMode && {borderColor: '#66D9E8'},
                    ]}>
                    {therapyPlan.payment_type === type.value && (
                      <View
                        style={[
                          styles.radioSelected,
                          isDarkMode && {backgroundColor: '#66D9E8'},
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.radioLabel, isDarkMode && styles.textDark]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.labeledInputContainer}>
            <Text style={styles.inputLabel}>Estimated Sessions</Text>
            <View
              style={[
                styles.inputContainer,
                isDarkMode && styles.balanceContainerDark,
              ]}>
              <MaterialIcons
                name="event-repeat"
                size={24}
                color={isDarkMode ? '#66D9E8' : '#119FB3'}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter estimated sessions"
                value={therapyPlan.estimated_sessions}
                onChangeText={text => {
                  setTherapyPlan(prev => ({
                    ...prev,
                    estimated_sessions: text,
                    total_amount:
                      text && prev.per_session_amount
                        ? (
                            parseFloat(text) *
                            parseFloat(prev.per_session_amount)
                          ).toFixed(2)
                        : prev.total_amount,
                  }));
                }}
                keyboardType="numeric"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>

          {therapyPlan.payment_type === 'recurring' && (
            <>
              <View style={styles.labeledInputContainer}>
                <Text style={styles.inputLabel}>Amount Per Session</Text>
                <View
                  style={[
                    styles.inputContainer,
                    isDarkMode && styles.balanceContainerDark,
                  ]}>
                  <FontAwesome
                    name="rupee"
                    size={24}
                    color={isDarkMode ? '#66D9E8' : '#119FB3'}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount per session"
                    value={therapyPlan.per_session_amount}
                    onChangeText={text => {
                      setTherapyPlan(prev => ({
                        ...prev,
                        per_session_amount: text,
                        total_amount:
                          text && prev.estimated_sessions
                            ? (
                                parseFloat(text) *
                                parseFloat(prev.estimated_sessions)
                              ).toFixed(2)
                            : prev.total_amount,
                      }));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
                {errors.per_session_amount && (
                  <Text style={styles.errorText}>
                    {errors.per_session_amount}
                  </Text>
                )}
              </View>
            </>
          )}

          <View style={styles.labeledInputContainer}>
            <Text style={styles.inputLabel}>Total Amount</Text>
            <View
              style={[
                styles.inputContainer,
                isDarkMode && styles.balanceContainerDark,
              ]}>
              <FontAwesome
                name="rupee"
                size={24}
                color={isDarkMode ? '#66D9E8' : '#119FB3'}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter total amount"
                value={therapyPlan.total_amount}
                onChangeText={text =>
                  setTherapyPlan({...therapyPlan, total_amount: text})
                }
                keyboardType="numeric"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>
          {errors.total_amount && (
            <Text style={styles.errorText}>{errors.total_amount}</Text>
          )}
          <View style={styles.labeledInputContainer}>
            <Text style={styles.inputLabel}>Discount Percentage</Text>
            <View
              style={[
                styles.inputContainer,
                isDarkMode && styles.balanceContainerDark,
              ]}>
              <MaterialIcons
                name="local-offer"
                size={24}
                color={isDarkMode ? '#66D9E8' : '#119FB3'}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter discount percentage"
                value={therapyPlan.discount_percentage}
                onChangeText={text => {
                  // Ensure discount doesn't exceed 100%
                  const value = parseFloat(text) || 0;
                  if (value <= 100) {
                    setTherapyPlan({...therapyPlan, discount_percentage: text});
                  }
                }}
                keyboardType="numeric"
                placeholderTextColor="#A0A0A0"
              />
              <Text
                style={[
                  styles.percentageSymbol,
                  isDarkMode && styles.textDark,
                ]}>
                %
              </Text>
            </View>
          </View>

          <View style={styles.labeledInputContainer}>
            <Text style={styles.inputLabel}>Received Amount</Text>
            <View
              style={[
                styles.inputContainer,
                isDarkMode && styles.balanceContainerDark,
              ]}>
              <FontAwesome
                name="rupee"
                size={24}
                color={isDarkMode ? '#66D9E8' : '#119FB3'}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter received amount"
                value={therapyPlan.received_amount}
                onChangeText={text => {
                  const newValue = text === '' ? '0' : text.replace(/^0+/, '');
                  setTherapyPlan({...therapyPlan, received_amount: newValue});
                }}
                onFocus={() => {
                  if (therapyPlan.received_amount === '0') {
                    setTherapyPlan({...therapyPlan, received_amount: ''});
                  }
                }}
                keyboardType="numeric"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>
          {errors.received_amount && (
            <Text style={styles.errorText}>{errors.received_amount}</Text>
          )}

          <View
            style={[
              styles.balanceContainer,
              isDarkMode && styles.balanceContainerDark,
            ]}>
            <MaterialIcons
              name="account-balance"
              size={24}
              color={isDarkMode ? '#66D9E8' : '#119FB3'}
            />
            <View style={styles.balanceDetails}>
              {parseFloat(therapyPlan.discount_percentage) > 0 && (
                <>
                  <Text
                    style={[
                      styles.balanceValue,
                      isDarkMode && styles.textDark,
                    ]}>
                    Original: ₹{therapyPlan.total_amount}
                  </Text>
                  <Text
                    style={[
                      styles.discountText,
                      isDarkMode && styles.textDark,
                    ]}>
                    Discount ({therapyPlan.discount_percentage}%): -₹
                    {(
                      ((parseFloat(therapyPlan.total_amount) || 0) *
                        (parseFloat(therapyPlan.discount_percentage) || 0)) /
                      100
                    ).toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.finalAmountText,
                      isDarkMode && styles.textDark,
                    ]}>
                    Final Amount: ₹
                    {(
                      (parseFloat(therapyPlan.total_amount) || 0) -
                      ((parseFloat(therapyPlan.total_amount) || 0) *
                        (parseFloat(therapyPlan.discount_percentage) || 0)) /
                        100
                    ).toFixed(2)}
                  </Text>
                </>
              )}
              <Text
                style={[styles.balanceValue, isDarkMode && styles.textDark]}>
                Balance: ₹{therapyPlan.balance}
              </Text>
            </View>
          </View>

          {errors.submit && (
            <Text style={styles.errorText}>{errors.submit}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              isDarkMode && styles.saveButtonDark,
              keyboardVisible && {marginTop: 5, marginBottom: -250}, // Dynamic adjustment
            ]}
            onPress={handleCreateTherapyPlan}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Create Plan</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    saveButtonDark1: {
      backgroundColor: '#333333',
    },
    percentageSymbol: {
      fontSize: 16,
      color: '#119FB3',
      fontWeight: 'bold',
      marginRight: 5,
    },
    balanceDetails: {
      marginLeft: 10,
      flex: 1,
    },
    discountText: {
      fontSize: 14,
      color: '#FF6B6B',
      fontStyle: 'italic',
    },
    finalAmountText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#4CAF50',
    },
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#F0F8FF',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    scrollViewDark: {
      backgroundColor: '#1A1A1A',
    },
    containerDark: {
      backgroundColor: '#1A1A1A',
    },
    titleDark: {
      color: '#66D9E8',
    },
    inputContainerDark: {
      backgroundColor: '#333333',
      borderColor: '#404040',
    },
    inputDark: {
      color: '#FFFFFF',
    },
    textDark: {
      color: '#FFFFFF',
    },
    labelDark: {
      color: '#66D9E8',
    },
    dateTimeContainerDark: {
      backgroundColor: '#333333',
    },
    durationContainerDark: {
      backgroundColor: '#333333',
    },
    radioButtonDark: {
      backgroundColor: '#333333',
    },
    radioButtonSelectedDark: {
      backgroundColor: '#404040',
      borderColor: '#66D9E8',
    },
    balanceContainerDark: {
      backgroundColor: '#333333',
    },
    saveButtonDark: {
      backgroundColor: '#007B8E',
    },
    balanceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 12,
      elevation: 2,
    },
    balanceValue: {
      fontSize: 16,
      marginLeft: 10,
      color: '#333333',
      fontWeight: 'bold',
    },
    dateTimeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    dateTimeBlock: {
      flex: 1,
      marginHorizontal: 2,
    },
    dateTimeLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#119FB3',
      marginBottom: 5,
    },
    dateTimeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 12,
      elevation: 2,
    },
    dateTimeText: {
      fontSize: 16,
      color: '#333333',
    },
    durationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 12,
      elevation: 2,
    },
    durationValue: {
      fontSize: 16,
      marginLeft: 10,
      color: '#333333',
    },
    labeledInputContainer: {
      marginBottom: 0,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#119FB3',
      marginBottom: 5,
    },
    saveButton: {
      backgroundColor: '#007B8E',
      paddingVertical: 12,
      borderRadius: 10,
      width: '100%',
      maxWidth: 300,
      alignItems: 'center',
      alignSelf: 'center',
      marginTop: 20,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    errorText: {
      color: '#FF6B6B',
      textAlign: 'center',
      marginBottom: 10,
    },
    paymentTypeContainer: {
      marginBottom: 20,
      width: '100%',
    },
    radioGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    radioButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      padding: 10,
      flex: 0.49,
      elevation: 2,
    },
    radioButtonSelected: {
      backgroundColor: '#E6F7F9',
      borderColor: '#119FB3',
      borderWidth: 1,
    },
    radio: {
      height: 20,
      width: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#119FB3',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    radioSelected: {
      height: 10,
      width: 10,
      borderRadius: 5,
      backgroundColor: '#119FB3',
    },
    radioLabel: {
      fontSize: 13,
      color: '#333333',
    },

    container: {
      flex: 1,
      paddingHorizontal: '5%',
      paddingVertical: 30,
      backgroundColor: '#F0F8FF',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#119FB3',
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingHorizontal: 15,
      marginBottom: 20,
      elevation: 2,
    },
    input: {
      flex: 1,
      marginLeft: 10,
      color: theme.colors.text,
      fontSize: 16,
      paddingVertical: 12,
    },
    picker: {
      flex: 1,
      marginLeft: 10,
      color: '#333333',
    },
    sessionInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E6F7F9',
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
    },
    sessionInfoText: {
      marginLeft: 10,
      fontSize: 16,
      color: '#333333',
      lineHeight: 24,
    },
  });

export default CreateTherapyPlan;
