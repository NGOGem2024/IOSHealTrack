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
  useColorScheme,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';

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
          : '0'
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
            style={styles.item1}
            enabled={false}
          />
          <Picker.Item label="Cash" value="CASH" style={styles.item} />
          <Picker.Item label="Online" value="ONLINE" style={styles.item} />
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}>
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

              {/* Rest of your JSX remains the same */}
              {/* Additional Services Section */}
              <View style={styles.servicesSection}>
                <TouchableOpacity
                  style={styles.servicesHeader}
                  onPress={() =>
                    setIsAdditionalServicesOpen(!isAdditionalServicesOpen)
                  }>
                  <Icon
                    name={isAdditionalServicesOpen ? 'minus' : 'plus'}
                    size={20}
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
                      }}>
                      <Icon name="times" size={20} color="#e74c3c" />
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
    </Modal>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    item1: {
      color: '#007b8e',
    },

    item: {
      color: theme.colors.text, // Set the color for selected items to black
    },
    placeholderItem: {
      color: 'gray', // Set the placeholder color to gray
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      width: '100%',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxWidth: 600,
      backgroundColor: theme.colors.secondary,
      borderRadius: 16,
      borderColor: '#007B8E',
      borderWidth: 1,
      padding: 30,
    },
    scrollContent: {
      backgroundColor: theme.colors.secondary,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007b8e',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 24,
      color: '#119FB3',
      fontWeight: '700',
    },
    inputSection: {
      marginBottom: 20,
    },
    pickerButton: {
      padding: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
    },
    pickerButtonText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    pickerModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerModalContainer: {
      backgroundColor: 'white',
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    pickerHeader: {
      borderBottomWidth: 1,
      borderColor: theme.colors.primary,
      padding: 15,
      backgroundColor: theme.colors.background,
      alignItems: 'flex-end',
    },
    pickerDoneButtonText: {
      color: theme.colors.secondary,
      fontSize: 16,
      fontWeight: '600',
    },
    iosPicker: {
      backgroundColor: 'white',
      height: 215,
    },
    inputLabel: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 8,
      fontWeight: '500',
    },
    currencyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ced4da',
      borderRadius: 10,
      backgroundColor: theme.colors.border,
      paddingHorizontal: 12,
    },
    currencySymbol: {
      fontSize: 18,
      color: theme.colors.text,
      marginRight: 8,
    },
    currencyInput: {
      flex: 1,
      fontSize: 18,
      color: theme.colors.text,
      padding: 12,
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: '#ced4da',
      borderRadius: 10,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
    },
    picker: {
      height: 50,
      color: theme.colors.text,
    },
    servicesSection: {
      marginBottom: 20,
    },
    servicesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    servicesHeaderText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginLeft: 8,
    },
    addonInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    addonNameInput: {
      flex: 3,
      borderWidth: 1,
      borderColor: '#ced4da',
      borderRadius: 10,
      padding: 12,
      backgroundColor: theme.colors.border,
      color: theme.colors.text,
      marginRight: 8,
      fontSize: 16,
    },
    addonAmountWrapper: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      backgroundColor: theme.colors.border,
      borderColor: '#ced4da',
      borderRadius: 10,
      paddingHorizontal: 12,
      marginRight: 8,
    },
    addonAmountInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
    },
    addButton: {
      backgroundColor: '#119FB3',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    addButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    addonItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
    },
    addonName: {
      flex: 2,
      fontSize: 16,
      color: '#2c3e50',
    },
    addonAmount: {
      flex: 1,
      fontSize: 16,
      color: '#119FB3',
      fontWeight: '500',
      textAlign: 'right',
      marginRight: 12,
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.border,
      padding: 16,
      borderRadius: 10,
      marginBottom: 20,
    },
    totalLabel: {
      fontSize: 18,
      color: theme.colors.text,
      fontWeight: '500',
    },
    totalAmount: {
      fontSize: 20,
      color: '#007B8E',
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#6c757d',
      padding: 15,
      borderRadius: 10,
      marginRight: 8,
      alignItems: 'center',
    },
    confirmButton: {
      width: '50%',
      backgroundColor: '#007B8E',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    paymentNumberBadge: {
      backgroundColor: '#007B8E',
      paddingVertical: 5,
      paddingHorizontal: 10,
      marginVertical: 5,
      alignSelf: 'flex-start',
      borderRadius: 5,
    },
    paymentNumberBadgeText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default PaymentModal;
