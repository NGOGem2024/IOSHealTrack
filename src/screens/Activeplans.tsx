import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "./ThemeContext";
import { getTheme } from "./Theme";
import axiosInstance from "../utils/axiosConfig";
import { useSession } from "../context/SessionContext";
import { handleError } from "../utils/errorHandler";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
type TherapyNavigationProp = StackNavigationProp<RootStackParamList>;

interface TherapyPlan {
  _id: string;
  therapy_start: string;
  therapy_end: string;
  therapy_name: string;
  patient_name: string;
  days_remaining: number;
}

const ActiveTherapyPlans: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles( getTheme(
        theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
      ),);
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [therapyPlans, setTherapyPlans] = useState<TherapyPlan[]>([]);
  const navigation = useNavigation<TherapyNavigationProp>();

  const fetchTherapyPlans = async () => {
    if (!session.idToken) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get("/get/active/plans", {
        headers: { Authorization: `Bearer ${session.idToken}` },
      });
      setTherapyPlans(response.data.active_plans);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session.idToken) {
      fetchTherapyPlans();
    }
  }, [session.idToken]);

  const calculateProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const current = new Date().getTime();
    const total = end - start;
    const elapsed = current - start;
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const renderTherapyPlan = (item: TherapyPlan) => {
    const progress = calculateProgress(item.therapy_start, item.therapy_end);

    return (
      <TouchableOpacity
        key={item._id}
        style={styles.planItem}
        onPress={() => navigation.navigate("planDetails", { planId: item._id })}
      >
        <Icon name="medical-outline" size={24} color="#119FB3" />
        <View style={styles.planInfo}>
          <View style={styles.planMainInfo}>
            <View>
              <Text style={styles.patientName}>{item.patient_name}</Text>
              <Text style={styles.therapyType}>{item.therapy_name}</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.daysRemaining}>
              {item.days_remaining} days remaining
            </Text>
          </View>
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>
              Start: {new Date(item.therapy_start).toLocaleDateString()}
            </Text>
            <Text style={styles.dateText}>
              End: {new Date(item.therapy_end).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Active Therapy Plans</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchTherapyPlans}
        >
          <Icon name="refresh-outline" size={20} color="#fffff" />
        </TouchableOpacity>
      </View>

      {/* Render plans directly instead of using FlatList */}
      {therapyPlans.length > 0 ? (
        <View>{therapyPlans.map((plan) => renderTherapyPlan(plan))}</View>
      ) : (
        <Text style={styles.emptyText}>No active therapy plans found</Text>
      )}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      backgroundColor: "#119FB3",
    },
    loadingContainer: {
      padding: 20,
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    refreshButton: {
      padding: 8,
    },
    planItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    planInfo: {
      flex: 1,
      marginLeft: 16,
    },
    planMainInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    patientName: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    therapyType: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    progressContainer: {
      marginVertical: 8,
    },
    progressBar: {
      height: 4,
      backgroundColor: "#E0E0E0",
      borderRadius: 2,
      marginBottom: 4,
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#119FB3",
      borderRadius: 2,
    },
    daysRemaining: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
    },
    dateInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
    },
    emptyText: {
      textAlign: "center",
      color: theme.colors.text,
      opacity: 0.7,
      padding: 20,
    },
  });

export default ActiveTherapyPlans;
