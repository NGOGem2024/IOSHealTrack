import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from "./ThemeContext";

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
  const [amount, setAmount] = useState<string>("");
  const [isAdditionalServicesOpen, setIsAdditionalServicesOpen] =
    useState(false);
  const [addonInput, setAddonInput] = useState<string>("");
  const [addonAmount, setAddonAmount] = useState<string>("");
  const [addons, setAddons] = useState<Addon[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  const { theme } = useTheme();
  const styles = getModalStyles();

  useEffect(() => {
    if (visible && paymentInfo?.session_info?.per_session_amount) {
      setPaymentMethod("CASH");
      setAmount(paymentInfo.session_info.per_session_amount.toString());
    } else {
      setAmount("");
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
          (addon) => addon.name === addonInput.trim()
        );

        if (existingAddonIndex >= 0) {
          const newAddons = [...addons];
          newAddons[existingAddonIndex].amount = numAmount;
          setAddons(newAddons);
        } else {
          setAddons([
            ...addons,
            { name: addonInput.trim(), amount: numAmount },
          ]);
        }
        // Clear inputs after successful submission
        setAddonInput("");
        setAddonAmount("");
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
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
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={paymentMethod}
                onValueChange={(itemValue) => setPaymentMethod(itemValue)}
                style={styles.picker}
              >
                <Picker.Item
                  label="Payment Method"
                  value=""
                  style={styles.item1}
                  enabled={false}
                />
                <Picker.Item label="Cash" value="CASH" style={styles.item} />
                <Picker.Item
                  label="Online"
                  value="ONLINE"
                  style={styles.item}
                />
              </Picker>
            </View>
          </View>
          {/* Additional Services Section */}
          <View style={styles.servicesSection}>
            <TouchableOpacity
              style={styles.servicesHeader}
              onPress={() =>
                setIsAdditionalServicesOpen(!isAdditionalServicesOpen)
              }
            >
              <Icon
                name={isAdditionalServicesOpen ? "minus" : "plus"}
                size={20}
                color="#119FB3"
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
                >
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
                // Send only the base amount, with addons as a separate array
                onSubmit(calculateBaseAmount(), paymentMethod, addons);
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Confirm Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
const COLORS = {
  primary: "#119FB3",
  secondary: "#6c757d",
  text: "#2c3e50",
  border: "#ced4da",
  background: "#f8f9fa",
  white: "white",
  error: "#e74c3c",
  overlay: "rgba(0, 0, 0, 0.5)",
};

const getModalStyles = () =>
  StyleSheet.create({
    item1: {
      color: "gray", // Set the color for selected items to black
    },

    item: {
      color: "black", // Set the color for selected items to black
    },
    placeholderItem: {
      color: "gray", // Set the placeholder color to gray
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "90%",
      maxWidth: 500,
      backgroundColor: "white",
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#2c3e50",
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 24,
      color: "#6c757d",
    },
    inputSection: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      color: "#2c3e50",
      marginBottom: 8,
      fontWeight: "500",
    },
    currencyInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#ced4da",
      borderRadius: 10,
      backgroundColor: "#f8f9fa",
      paddingHorizontal: 12,
    },
    currencySymbol: {
      fontSize: 18,
      color: "#6c757d",
      marginRight: 8,
    },
    currencyInput: {
      flex: 1,
      fontSize: 18,
      color: "#2c3e50",
      padding: 12,
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: "#ced4da",
      borderRadius: 10,
      backgroundColor: "#f8f9fa",
      overflow: "hidden",
    },
    picker: {
      height: 50,
      color: "black",
    },
    servicesSection: {
      marginBottom: 20,
    },
    servicesHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    servicesHeaderText: {
      fontSize: 16,
      fontWeight: "500",
      color: "#2c3e50",
      marginLeft: 8,
    },
    addonInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    addonNameInput: {
      flex: 3,
      borderWidth: 1,
      borderColor: "#ced4da",
      borderRadius: 10,
      padding: 12,
      marginRight: 8,
      fontSize: 16,
    },
    addonAmountWrapper: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#ced4da",
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
      backgroundColor: "#119FB3",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    addButtonText: {
      color: "white",
      fontWeight: "bold",
    },
    addonItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
    },
    addonName: {
      flex: 2,
      fontSize: 16,
      color: "#2c3e50",
    },
    addonAmount: {
      flex: 1,
      fontSize: 16,
      color: "#119FB3",
      fontWeight: "500",
      textAlign: "right",
      marginRight: 12,
    },
    totalContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      padding: 16,
      borderRadius: 10,
      marginBottom: 20,
    },
    totalLabel: {
      fontSize: 18,
      color: "#2c3e50",
      fontWeight: "500",
    },
    totalAmount: {
      fontSize: 20,
      color: "#119FB3",
      fontWeight: "bold",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
    },
    cancelButton: {
      flex: 1,
      backgroundColor: "#6c757d",
      padding: 15,
      borderRadius: 10,
      marginRight: 8,
      alignItems: "center",
    },
    confirmButton: {
      width: "50%",
      backgroundColor: "#119FB3",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    buttonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    paymentNumberBadge: {
      backgroundColor: "#119FB3",
      paddingVertical: 5,
      paddingHorizontal: 10,
      marginVertical: 5,
      alignSelf: "flex-start",
      borderRadius: 5,
    },
    paymentNumberBadgeText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
  });

export default PaymentModal;