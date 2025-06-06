import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  SafeAreaView,
  Dimensions,
  PixelRatio,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';

// Get screen dimensions
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
// Base scale factor - assume design is for 375px width
const scale = SCREEN_WIDTH / 375;

// Normalize function for font sizes
const normalize = (size: number) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Function for responsive spacing
const getResponsiveSize = (size: number) => {
  return size * scale;
};

interface Addon {
  name: string;
  amount: number;
}

interface EditPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, type: string, addons?: Addon[]) => void;
  paymentData: {
    amount: number;
    type: string;
    addon_services?: Addon[];
  };
}

// Custom Picker Modal Component
interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  selectedValue: string;
}

const PickerModal: React.FC<PickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedValue,
}) => {
  const {theme} = useTheme();
  const themeStyles = getTheme(
    theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
  );
  const styles = getStyles(themeStyles);
  
  const options = [
    {label: 'Cash', value: 'CASH'},
    {label: 'Online', value: 'ONLINE'},
    {label: 'Counter', value: 'At Counter'},
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContent}>
          <SafeAreaView>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.pickerCancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Payment Method</Text>
              <View style={{width: 60}} />
            </View>
            <View style={styles.optionsContainer}>
              {options.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    selectedValue === option.value && styles.selectedOption,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}>
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === option.value &&
                        styles.selectedOptionText,
                    ]}>
                    {option.label}
                  </Text>
                  {selectedValue === option.value && (
                    <FontAwesome
                      name="check"
                      size={normalize(20)}
                      color={themeStyles.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  paymentData,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isAdditionalServicesOpen, setIsAdditionalServicesOpen] =
    useState(false);
  const [addonInput, setAddonInput] = useState<string>('');
  const [addonAmount, setAddonAmount] = useState<string>('');
  const [addons, setAddons] = useState<Addon[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [showPicker, setShowPicker] = useState(false);

  const {theme} = useTheme();
  const themeStyles = getTheme(
    theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
  );
  const styles = getStyles(themeStyles);

  useEffect(() => {
    if (visible && paymentData) {
      setAmount(paymentData.amount.toString());
      setPaymentMethod(paymentData.type);
      setAddons(paymentData.addon_services ?? []);
      setIsAdditionalServicesOpen(Boolean(paymentData.addon_services?.length));
    }
  }, [visible, paymentData]);

  const handleAddonAmountChange = (value: string) => {
    setAddonAmount(value);
  };

  const handleAddonSubmit = () => {
    if (addonInput.trim() && addonAmount.trim()) {
      const numAmount = parseFloat(addonAmount);
      if (!isNaN(numAmount) && numAmount > 0) {
        const existingAddonIndex = addons.findIndex(
          addon => addon.name === addonInput.trim(),
        );

        if (existingAddonIndex >= 0) {
          const newAddons = [...addons];
          newAddons[existingAddonIndex].amount = numAmount;
          setAddons(newAddons);
        } else {
          setAddons([...addons, {name: addonInput.trim(), amount: numAmount}]);
        }
        setAddonInput('');
        setAddonAmount('');
        // Dismiss keyboard after adding
        Keyboard.dismiss();
      }
    }
  };

  const calculateBaseAmount = () => {
    return parseFloat(amount) || 0;
  };

  const calculateAddonTotal = () => {
    return addons.reduce((sum, addon) => sum + addon.amount, 0);
  };

  const calculateTotalAmount = () => {
    return calculateBaseAmount() + calculateAddonTotal();
  };

  const getPaymentMethodLabel = (value: string) => {
    switch (value) {
      case 'CASH':
        return 'Cash';
      case 'ONLINE':
        return 'Online';
      case 'At Counter':
        return 'Counter';
      default:
        return value;
    }
  };

  // Handle close modal immediately
  const handleCloseModal = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseModal}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Payment</Text>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Payment Amount Section */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Base Session Payment</Text>
                  <View style={styles.currencyInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.currencyInput}
                      placeholder="Enter amount"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                </View>

                {/* Custom Payment Method Button */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <TouchableOpacity
                    style={styles.paymentMethodButton}
                    onPress={() => setShowPicker(true)}>
                    <Text style={styles.paymentMethodButtonText}>
                      {getPaymentMethodLabel(paymentMethod)}
                    </Text>
                    <FontAwesome name="chevron-down" size={normalize(16)} color={themeStyles.colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Additional Services Section */}
                <View style={styles.servicesSection}>
                  <TouchableOpacity
                    style={styles.servicesHeader}
                    onPress={() =>
                      setIsAdditionalServicesOpen(!isAdditionalServicesOpen)
                    }>
                    <FontAwesome
                      name={isAdditionalServicesOpen ? 'minus' : 'plus'}
                      size={normalize(20)}
                      color={'#007b8e'}
                    />
                    <Text style={styles.servicesHeaderText}>Additional Services</Text>
                  </TouchableOpacity>

                  {isAdditionalServicesOpen && (
                    <View style={styles.addonInputContainer}>
                      <TextInput
                        style={styles.addonNameInput}
                        placeholder="Service Name"
                        value={addonInput}
                        onChangeText={setAddonInput}
                      />
                      <View style={styles.addonAmountWrapper}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <TextInput
                          style={styles.addonAmountInput}
                          placeholder="Amount"
                          keyboardType="numeric"
                          value={addonAmount}
                          onChangeText={handleAddonAmountChange}
                          onSubmitEditing={handleAddonSubmit}
                          returnKeyType="done"
                        />
                      </View>
                      <TouchableOpacity 
                        style={styles.addButton}
                        activeOpacity={0.7}
                        onPress={handleAddonSubmit}>
                        <Text style={styles.addButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Added Services List */}
                  {addons.map((addon, index) => (
                    <View key={index} style={styles.addonItem}>
                      <Text style={styles.addonName}>{addon.name}</Text>
                      <Text style={styles.addonAmount}>₹{addon.amount}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          const newAddons = addons.filter((_, i) => i !== index);
                          setAddons(newAddons);
                        }}
                        style={styles.removeButton}>
                        <FontAwesome name="times" size={normalize(20)} color={themeStyles.colors.notification} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Total Amount */}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total Payment</Text>
                  <Text style={styles.totalAmount}>
                    ₹{calculateTotalAmount().toLocaleString()}
                  </Text>
                </View>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => {
                      onSubmit(calculateBaseAmount(), paymentMethod, addons);
                      onClose();
                    }}>
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Custom Picker Modal */}
      <PickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={setPaymentMethod}
        selectedValue={paymentMethod}
      />
    </Modal>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    item: {
      color: theme.colors.text,
      fontSize: normalize(16),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      width: '100%',
      alignItems: 'center',
    },
    modalContainer: {
      width: SCREEN_WIDTH * 0.9,
      maxWidth: 650,
      backgroundColor: theme.colors.secondary,
      borderRadius: getResponsiveSize(16),
      borderColor: '#007B8E',
      borderWidth: 1,
      padding: getResponsiveSize(20),
      maxHeight: SCREEN_HEIGHT * 0.85,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    scrollContent: {
      backgroundColor: theme.colors.secondary,
      paddingBottom: getResponsiveSize(10),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getResponsiveSize(20),
    },
    modalTitle: {
      fontSize: normalize(24),
      fontWeight: 'bold',
      color: theme.colors.mainColor,
    },
    closeButton: {
      padding: getResponsiveSize(8),
    },
    closeButtonText: {
      fontSize: normalize(24),
      color: theme.colors.text,
    },
    inputSection: {
      marginBottom: getResponsiveSize(20),
    },
    inputLabel: {
      fontSize: normalize(16),
      color: theme.colors.text,
      marginBottom: getResponsiveSize(8),
      fontWeight: '500',
    },
    currencyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: getResponsiveSize(10),
      backgroundColor: theme.colors.border,
      paddingHorizontal: getResponsiveSize(12),
    },
    pickerModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    pickerModalContent: {
      backgroundColor: theme.colors.secondary,
      borderTopLeftRadius: getResponsiveSize(20),
      borderTopRightRadius: getResponsiveSize(20),
      paddingBottom: Platform.OS === 'ios' ? getResponsiveSize(20) : 0,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: getResponsiveSize(16),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    pickerTitle: {
      fontSize: normalize(17),
      fontWeight: '600',
      color: theme.colors.text,
    },
    pickerCancelButton: {
      fontSize: normalize(17),
      color: '#007B8E',
      width: 60,
    },
    optionsContainer: {
      paddingHorizontal: getResponsiveSize(16),
    },
    optionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: getResponsiveSize(16),
      paddingHorizontal: getResponsiveSize(8),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    selectedOption: {
      backgroundColor: `${'#007B8E'}10`,
    },
    currencySymbol: {
      fontSize: normalize(18),
      color: theme.colors.text,
      marginRight: getResponsiveSize(8),
    },
    currencyInput: {
      flex: 1,
      fontSize: normalize(18),
      color: theme.colors.text,
      padding: getResponsiveSize(12),
    },
    paymentMethodButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: getResponsiveSize(10),
      backgroundColor: theme.colors.border,
      padding: getResponsiveSize(16),
    },
    optionText: {
      fontSize: normalize(16),
      color: theme.colors.text,
    },
    selectedOptionText: {
      color: '#007B8E',
      fontWeight: '500',
    },
    paymentMethodButtonText: {
      fontSize: normalize(16),
      color: theme.colors.text,
    },
    servicesSection: {
      marginBottom: getResponsiveSize(20),
    },
    servicesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: getResponsiveSize(12),
    },
    servicesHeaderText: {
      fontSize: normalize(16),
      fontWeight: '500',
      color: theme.colors.text,
      marginLeft: getResponsiveSize(8),
    },
    addonInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: getResponsiveSize(12),
    },
    addonNameInput: {
      flex: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: getResponsiveSize(10),
      padding: getResponsiveSize(12),
      backgroundColor: theme.colors.border,
      marginRight: getResponsiveSize(8),
      fontSize: normalize(13),
      color: theme.colors.text,
    },
    addonAmountWrapper: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: getResponsiveSize(10),
      backgroundColor: theme.colors.border,
      paddingHorizontal: getResponsiveSize(12),
      marginRight: getResponsiveSize(8),
    },
    addonAmountInput: {
      flex: 1,
      padding: getResponsiveSize(12),
      fontSize: normalize(13),
      color: theme.colors.text,
    },
    addButton: {
      backgroundColor: '#007B8E',
      paddingVertical: getResponsiveSize(10),
      paddingHorizontal: getResponsiveSize(12),
      borderRadius: getResponsiveSize(10),
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    addButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: normalize(14),
    },
    addonItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.border,
      padding: getResponsiveSize(12),
      borderRadius: getResponsiveSize(10),
      marginBottom: getResponsiveSize(8),
    },
    addonName: {
      flex: 2,
      fontSize: normalize(16),
      color: theme.colors.text,
    },
    addonAmount: {
      flex: 1,
      fontSize: normalize(16),
      color: "#007B8E",
      fontWeight: '500',
      textAlign: 'right',
      marginRight: getResponsiveSize(12),
    },
    removeButton: {
      padding: getResponsiveSize(5),
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.border,
      padding: getResponsiveSize(16),
      borderRadius: getResponsiveSize(10),
      marginBottom: getResponsiveSize(20),
    },
    totalLabel: {
      fontSize: normalize(18),
      color: theme.colors.text,
      fontWeight: '500',
    },
    totalAmount: {
      fontSize: normalize(20),
      color: '#007B8E',
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    confirmButton: {
      width: '50%',
      backgroundColor: '#007B8E',
      paddingVertical: getResponsiveSize(12),
      borderRadius: getResponsiveSize(10),
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: 'white',
      fontSize: normalize(16),
      fontWeight: 'bold',
    },
  });

export default EditPaymentModal;