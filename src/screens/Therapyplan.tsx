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
  ScrollView,
} from 'react-native';
import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import {useSession} from '../context/SessionContext';
import {handleError, showSuccessToast} from '../utils/errorHandler';
import axiosInstance from '../utils/axiosConfig';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateTherapyPlan'>;

const TagInput = ({
  tags,
  setTags,
  placeholder,
  icon,
  error,
}: {
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      setTags([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <View style={styles.tagInputContainer}>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {icon}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleAddTag}
          returnKeyType="done"
          placeholderTextColor="#A0A0A0"
        />
      </View>
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tag}
            onPress={() => handleRemoveTag(tag)}>
            <Text style={styles.tagText}>{tag}</Text>
            <Text style={styles.tagRemove}>×</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const CreateTherapyPlan: React.FC<Props> = ({navigation, route}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [therapyPlan, setTherapyPlan] = useState({
    patient_diagnosis: '',
    patient_symptoms: '',
    therapy_duration: '',
    therapy_category: '',
    total_amount: '',
    received_amount: '',
    therapy_name: '',
    balance: '',
  });
  const {patientId} = route.params;

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [extraAddons, setExtraAddons] = useState<string[]>([]);
  const [addonsAmount, setAddonsAmount] = useState('0');

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  const categories = [
    'Musculoskeletal',
    'Neurological',
    'Cardiorespiratory',
    'Paediatrics',
    "Women's Health",
    'Geriatrics',
    'Post surgical rehabilitation',
  ];

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
      setTherapyPlan({...therapyPlan, therapy_duration: `${diffDays} days`});
    }
  }, [startDate, endDate]);

  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
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
    if (symptoms.length === 0) {
      newErrors.symptoms = 'At least one patient symptom is required';
    }
    if (!therapyPlan.patient_diagnosis.trim()) {
      newErrors.patient_diagnosis = 'Patient diagnosis is required';
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
    if (startDate >= endDate) {
      newErrors.date = 'End date must be after start date';
    }
    if (addonsAmount && isNaN(parseFloat(addonsAmount))) {
      newErrors.addonsAmount = 'Addons amount must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        patient_symptoms: symptoms,
        therapy_duration: therapyPlan.therapy_duration,
        therapy_start: startDate.toISOString().split('T')[0],
        therapy_end: endDate.toISOString().split('T')[0],
        patient_therapy_category: therapyPlan.therapy_category,
        total_amount: therapyPlan.total_amount,
        received_amount: therapyPlan.received_amount,
        balance: therapyPlan.balance,
        extra_addons: extraAddons,
        addons_amount: addonsAmount || '0',
      };

      const response = await axiosInstance.post(
        `/therapy/plan/${patientId}`,
        formData,
      );

      if (response.status === 200 || response.status === 201) {
        showSuccessToast('Therapy plan created successfully');
        navigation.goBack();
      } else {
        setErrors({
          ...errors,
          submit: 'Failed to create therapy plan. Please try again.',
        });
      }
    } catch (error) {
      handleError(error);
      setErrors({
        ...errors,
        submit: 'An error occurred while creating therapy plan.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const total = parseFloat(therapyPlan.total_amount) || 0;
    const received = parseFloat(therapyPlan.received_amount) || 0;
    const balance = total - received;
    setTherapyPlan({...therapyPlan, balance: balance.toString()});
  }, [therapyPlan.total_amount, therapyPlan.received_amount]);

  return (
    <ScrollView style={styles.scrollView}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        <Text style={styles.title}>Create Therapy Plan</Text>
        <Dropdown
          value={therapyPlan.therapy_category}
          onValueChange={(itemValue: string) =>
            setTherapyPlan({...therapyPlan, therapy_category: itemValue})
          }
          items={categories}
        />
        {errors.therapy_category && (
          <Text style={styles.errorText}>{errors.therapy_category}</Text>
        )}
        <InputField
          icon={<Icon name="edit" size={24} color="#119FB3" />}
          placeholder="Therapy Name"
          value={therapyPlan.therapy_name}
          onChangeText={(text: string) =>
            setTherapyPlan({...therapyPlan, therapy_name: text})
          }
        />
        {errors.therapy_name && (
          <Text style={styles.errorText}>{errors.therapy_name}</Text>
        )}
        <TagInput
          tags={symptoms}
          setTags={setSymptoms}
          placeholder="Add Patient Symptoms"
          icon={<Icon name="healing" size={24} color="#119FB3" />}
        />
        {errors.patient_symptoms && (
          <Text style={styles.errorText}>{errors.patient_symptoms}</Text>
        )}
        <InputField
          icon={<Icon name="local-hospital" size={24} color="#119FB3" />}
          placeholder="Patient Diagnosis"
          value={therapyPlan.patient_diagnosis}
          onChangeText={(text: string) =>
            setTherapyPlan({...therapyPlan, patient_diagnosis: text})
          }
        />
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
          />

          <DatePickerField
            label="End Date"
            date={endDate}
            showDatePicker={showEndDatePicker}
            onPress={showEndDatepicker}
            onChange={onChangeEndDate}
          />
        </View>
        {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

        <View style={styles.durationContainer}>
          <Icon name="timer" size={24} color="#119FB3" />
          <Text style={styles.durationValue}>
            Duration: {therapyPlan.therapy_duration}
          </Text>
        </View>
        <TagInput
          tags={extraAddons}
          setTags={setExtraAddons}
          placeholder="Add Extra Addons"
          icon={<Icon name="add-circle" size={24} color="#119FB3" />}
        />
        <View style={styles.labeledInputContainer}>
          <Text style={styles.inputLabel}>Addons Amount</Text>
          <View style={styles.inputContainer}>
            <FAIcon name="rupee" size={24} color="#119FB3" />
            <TextInput
              style={styles.input}
              placeholder="Enter addons amount"
              value={addonsAmount}
              onChangeText={setAddonsAmount}
              keyboardType="numeric"
              placeholderTextColor="#A0A0A0"
            />
          </View>
        </View>
        <View style={styles.labeledInputContainer}>
          <Text style={styles.inputLabel}>Total Amount</Text>
          <View style={styles.inputContainer}>
            <FAIcon name="rupee" size={24} color="#119FB3" />
            <TextInput
              style={styles.input}
              placeholder="Enter total amount"
              value={therapyPlan.total_amount}
              onChangeText={(text: string) =>
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
          <Text style={styles.inputLabel}>Received Amount</Text>
          <View style={styles.inputContainer}>
            <FAIcon name="rupee" size={24} color="#119FB3" />
            <TextInput
              style={styles.input}
              placeholder="Enter received amount"
              value={therapyPlan.received_amount}
              onChangeText={(text: string) =>
                setTherapyPlan({...therapyPlan, received_amount: text})
              }
              keyboardType="numeric"
              placeholderTextColor="#A0A0A0"
            />
          </View>
        </View>
        {errors.received_amount && (
          <Text style={styles.errorText}>{errors.received_amount}</Text>
        )}
        <View style={styles.balanceContainer}>
          <Icon name="account-balance" size={24} color="#119FB3" />
          <Text style={styles.balanceValue}>
            Balance: {therapyPlan.balance} Rs
          </Text>
        </View>

        {errors.submit && <Text style={styles.errorText}>{errors.submit}</Text>}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleCreateTherapyPlan}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Create Plan</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const InputField = ({
  icon,
  placeholder,
  value,
  onChangeText,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
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

const DatePickerField = ({
  label,
  date,
  showDatePicker,
  onPress,
  onChange,
}: {
  label: string;
  date: Date;
  showDatePicker: boolean;
  onPress: () => void;
  onChange: (event: any, selectedDate?: Date) => void;
}) => (
  <View style={styles.dateTimeBlock}>
    <Text style={styles.dateTimeLabel}>{label}</Text>
    <TouchableOpacity style={styles.dateTimeContainer} onPress={onPress}>
      <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
      <FAIcon name="calendar" size={24} color="#119FB3" />
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

const Dropdown = ({
  value,
  onValueChange,
  items,
}: {
  value: string;
  onValueChange: (itemValue: string) => void;
  items: string[];
}) => (
  <View style={styles.inputContainer}>
    <Icon name="category" size={24} color="#119FB3" />
    <Picker
      selectedValue={value}
      onValueChange={onValueChange}
      style={styles.picker}>
      <Picker.Item label="Therapy Category" value="" />
      {items.map((item, index) => (
        <Picker.Item key={index} label={item} value={item} />
      ))}
    </Picker>
  </View>
);

const styles = StyleSheet.create({
  inputError: {
    borderWidth: 1,
    borderColor: 'red',
  },
  tagInputContainer: {
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    paddingHorizontal: 5,
  },
  tag: {
    backgroundColor: '#119FB3',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 5,
  },
  tagRemove: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  scrollView: {
    backgroundColor: '#F0F8FF',
  },
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: '#F0F8FF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#119FB3',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 25,
  },
  labeledInputContainer: {
    marginBottom: 0,
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
    color: '#333333',
    fontSize: 16,
    paddingVertical: 12,
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
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#119FB3',
    marginBottom: 5,
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
  saveButton: {
    backgroundColor: '#119FB3',
    paddingVertical: 12,
    borderRadius: 10,
    width: '50%',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  picker: {
    flex: 1,
    marginLeft: 10,
    color: '#333333',
  },
});

export default CreateTherapyPlan;
