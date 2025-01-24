import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import axiosInstance from '../utils/axiosConfig';
import {useSession} from '../context/SessionContext';
import {handleError} from '../utils/errorHandler';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../types/types';
import BackTabTop from './BackTopTab';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface TherapySession {
  _id: string;
  patient_id: string;
  patient_name: string;
  therepy_type: string;
  therepy_link: string | null;
  therepy_start_time: string;
  therepy_end_time: string;
  therepy_date: string;
  doctor_id: string;
  doctor_name: string;
  plan_id: string;
  status: string;
  session_start_time?: string;
  session_end_time?: string;
  session_duration?: number;
  google_calendar_event_id?: string;
}

type TherapySessionsRouteProp = RouteProp<
  RootStackParamList,
  'therapySessions'
>;

const TherapySessionsList: React.FC = () => {
  const route = useRoute<TherapySessionsRouteProp>();
  const navigation = useNavigation();
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const {session} = useSession();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const {planId} = route.params;

  useEffect(() => {
    fetchSessions();
  }, [planId]);

  const fetchSessions = async () => {
    if (!session.idToken || !planId) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/plan/therapy/${planId}`, {
        headers: {Authorization: `Bearer ${session.idToken}`},
      });
      setSessions(response.data.sessions);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#4CAF50';
      case 'Scheduled':
        return '#2196F3';
      case 'Cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const openSessionLink = (link: string | null) => {
    if (link) {
      Linking.openURL(link).catch(err => handleError(err));
    }
  };

  const renderSessionCard = (session: TherapySession) => (
    <View key={session._id} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{session.therepy_date}</Text>
          <Text style={styles.timeText}>
            {session.therepy_start_time} - {session.therepy_end_time}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(session.status)},
          ]}>
          <Text style={styles.statusText}>{session.status}</Text>
        </View>
      </View>

      <View style={styles.sessionInfo}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="doctor" size={20} color="black" />
          <Text style={styles.infoText}>{session.doctor_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={20} color="black" />
          <Text style={styles.infoText}>{session.therepy_type}</Text>
        </View>
        {session.therepy_link && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openSessionLink(session.therepy_link)}>
            <MaterialCommunityIcons name="link" size={20} color="#FFFFFF" />
            <Text style={styles.linkButtonText}>Open Session Link</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading Sessions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <BackTabTop screenName="Therapy Sessions" />
      <View style={styles.container}>
        {sessions.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {sessions.map(renderSessionCard)}
          </ScrollView>
        ) : (
          <View style={styles.noSessionsContainer}>
            <MaterialCommunityIcons
              name="calendar-remove"
              size={64}
              color="Black"
            />
            <Text style={styles.noSessionsText}>No therapy sessions found</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#119FB3',
    },
    container: {
      flex: 1,
      backgroundColor: '#119FB3',
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#119FB3',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#FFFFFF',
    },
    sessionCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    dateTimeContainer: {
      flex: 1,
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    timeText: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    statusText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
    },
    sessionInfo: {
      gap: 8,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    linkButton: {
      backgroundColor: '#119FB3',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      gap: 8,
    },
    linkButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
    },
    noSessionsContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 32,
    },
    noSessionsText: {
      fontSize: 16,
      color: theme.colors.text,
      marginTop: 8,
    },
  });

export default TherapySessionsList;
