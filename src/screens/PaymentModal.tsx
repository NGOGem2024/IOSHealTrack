import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  PixelRatio,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
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

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, type: string, addons?: Addon[]) => void;
  currentSession: number;
  paymentInfo: any;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  currentSession,
  paymentInfo,
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
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  useEffect(() => {
    if (visible && paymentInfo?.session_info?.per_session_amount) {
      setPaymentMethod('CASH');
      // Only set amount if balance is greater than 0
      setAmount(
        paymentInfo.payment_summary.balance > 0
          ? paymentInfo.session_info.per_session_amount.toString()
          : '0',
      );
    } else {
      setAmount('');
    }
  }, [visible, paymentInfo]);

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

  const renderPaymentMethodSelector = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowPicker(true)}>
            <Text style={styles.pickerButtonText}>
              {paymentMethod === ''
                ? 'Select Payment Method'
                : paymentMethod === 'CASH'
                ? 'Cash'
                : paymentMethod === 'Counter'
                ? 'At Counter'
                : 'Online'}
            </Text>
          </TouchableOpacity>

          <Modal visible={showPicker} transparent={true} animationType="slide">
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModalContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.pickerDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={paymentMethod}
                  onValueChange={itemValue => {
                    setPaymentMethod(itemValue);
                  }}
                  style={styles.iosPicker}>
                  <Picker.Item label="Cash" value="CASH" />
                  <Picker.Item label="Online" value="ONLINE" />
                  <Picker.Item label="Counter" value="At Counter" />
                </Picker>
              </View>
            </View>
          </Modal>
        </>
      );
    }

    return (
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={paymentMethod}
          onValueChange={itemValue => setPaymentMethod(itemValue)}
          style={styles.picker}>
          <Picker.Item
            label="Payment Method"
            value=""
            style={styles.placeholderItem}
            enabled={false}
          />
          <Picker.Item label="Cash" value="CASH" style={styles.item} />
          <Picker.Item label="Online" value="ONLINE" style={styles.item} />
          <Picker.Item label="Counter" value="At Counter" style={styles.item} />
        </Picker>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Record Payment</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {paymentInfo.payment_structure.next_payment_number && (
                  <View style={styles.paymentNumberBadge}>
                    <Text style={styles.paymentNumberBadgeText}>
                      Payment #{paymentInfo.payment_structure.next_payment_number}
                    </Text>
                  </View>
                )}

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

                {/* Payment Method Section */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  {renderPaymentMethodSelector()}
                </View>

                {/* Additional Services Section */}
                <View style={styles.servicesSection}>
                  <TouchableOpacity
                    style={styles.servicesHeader}
                    onPress={() =>
                      setIsAdditionalServicesOpen(!isAdditionalServicesOpen)
                    }>
                    <Icon
                      name={isAdditionalServicesOpen ? 'minus' : 'plus'}
                      size={normalize(18)}
                      color="#007B8E"
                    />
                    <Text style={styles.servicesHeaderText}>
                      Additional Services
                    </Text>
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
                        <Icon name="times" size={normalize(16)} color="#e74c3c" />
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
                    <Text style={styles.buttonText}>Confirm Payment</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    item: {
      color: theme.colors.text,
      fontSize: normalize(16),
    },
    placeholderItem: {
      color: 'gray',
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
      maxWidth: 600,
      backgroundColor: theme.colors.secondary,
      borderRadius: getResponsiveSize(16),
      borderColor: '#007B8E',
      borderWidth: 1,
      padding: getResponsiveSize(25),
      maxHeight: SCREEN_HEIGHT * 0.85,
    },
    scrollContent: {
      backgroundColor: theme.colors.secondary,
      paddingBottom: getResponsiveSize(10),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getResponsiveSize(15),
    },
    modalTitle: {
      fontSize: normalize(24),
      fontWeight: 'bold',
      color: '#007b8e',
    },
    closeButton: {
      padding: getResponsiveSize(8),
    },
    closeButtonText: {
      fontSize: normalize(22),
      color: '#119FB3',
      fontWeight: '700',
    },
    inputSection: {
      marginBottom: getResponsiveSize(18),
    },
    pickerButton: {
      padding: getResponsiveSize(12),
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: getResponsiveSize(10),
    },
    pickerButtonText: {
      fontSize: normalize(17),
      color: theme.colors.text,
    },
    pickerModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerModalContainer: {
      backgroundColor: 'white',
      paddingBottom: Platform.OS === 'ios' ? getResponsiveSize(20) : 0,
    },
    pickerHeader: {
      borderBottomWidth: 1,
      borderColor: theme.colors.primary,
      padding: getResponsiveSize(15),
      backgroundColor: theme.colors.background,
      alignItems: 'flex-end',
    },
    pickerDoneButtonText: {
      color: theme.colors.secondary,
      fontSize: normalize(17),
      fontWeight: '600',
    },
    iosPicker: {
      backgroundColor: 'white',
      height: getResponsiveSize(215),
    },
    inputLabel: {
      fontSize: normalize(17),
      color: theme.colors.text,
      marginBottom: getResponsiveSize(8),
      fontWeight: '500',
    },
    currencyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: getResponsiveSize(10),
      backgroundColor: theme.colors.border,
      paddingHorizontal: getResponsiveSize(12),
    },
    currencySymbol: {
      fontSize: normalize(17),
      color: theme.colors.text,
      marginRight: getResponsiveSize(3),
    },
    currencyInput: {
      flex: 1,
      fontSize: normalize(16),
      color: theme.colors.text,
      padding: getResponsiveSize(12),
    },
    pickerWrapper: {
      borderRadius: getResponsiveSize(10),
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
      height: getResponsiveSize(50),
    },
    picker: {
      height: getResponsiveSize(50),
      color: theme.colors.text,
      fontSize: normalize(16),
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
      fontSize: normalize(17),
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
      borderColor: '#ced4da',
      borderRadius: getResponsiveSize(10),
      padding: getResponsiveSize(10),
      backgroundColor: theme.colors.border,
      color: theme.colors.text,
      marginRight: getResponsiveSize(8),
      fontSize: normalize(14),
    },
    addonAmountWrapper: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      backgroundColor: theme.colors.border,
      borderColor: '#ced4da',
      borderRadius: getResponsiveSize(10),
      paddingHorizontal: getResponsiveSize(10),
      marginRight: getResponsiveSize(8),
    },
    addonAmountInput: {
      flex: 1,
      padding: getResponsiveSize(8),
      fontSize: normalize(14),
      color: theme.colors.text,
    },
    addButton: {
      backgroundColor: '#119FB3',
      paddingVertical: getResponsiveSize(10),
      paddingHorizontal: getResponsiveSize(12),
      borderRadius: getResponsiveSize(10),
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10, // Ensure it's above other elements
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
      fontSize: normalize(14),
      color: theme.colors.text,
    },
    addonAmount: {
      flex: 1,
      fontSize: normalize(14),
      color: '#119FB3',
      fontWeight: '500',
      textAlign: 'right',
      marginRight: getResponsiveSize(10),
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
      fontSize: normalize(16),
      color: theme.colors.text,
      fontWeight: '500',
    },
    totalAmount: {
      fontSize: normalize(18),
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
      fontSize: normalize(15),
      fontWeight: 'bold',
    },
    paymentNumberBadge: {
      backgroundColor: '#007B8E',
      paddingVertical: getResponsiveSize(5),
      paddingHorizontal: getResponsiveSize(10),
      marginVertical: getResponsiveSize(5),
      alignSelf: 'flex-start',
      borderRadius: getResponsiveSize(5),
      marginBottom: getResponsiveSize(15),
    },
    paymentNumberBadgeText: {
      color: 'white',
      fontSize: normalize(14),
      fontWeight: '600',
    },
  });

export default PaymentModal;