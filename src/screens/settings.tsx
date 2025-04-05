import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import GoogleSignInButton from '../components/googlebutton';
import axiosInstance from '../utils/axiosConfig';
import axios from 'axios';
import {handleError} from '../utils/errorHandler';
import BackTabTop from './BackTopTab';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import {useSession} from '../context/SessionContext';
import {
  GoogleSignin,
  statusCodes,
  SignInResponse,
  User,
} from '@react-native-google-signin/google-signin';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SettingSkeleton from '../components/SettingSkeleton';

interface ExtendedUser extends User {
  data: any;
  serverAuthCode: string | null;
}

interface SessionInfo {
  lastUpdated?: string;
  updatedBy?: string;
  organization_name?: string;
  doctor_name?: string;
}

interface ServerResponse {
  accessToken: string;
}

const GOOGLE_WEB_CLIENT_ID =
  '1038698506388-eegihlhipbg4d1cubdjk4p44gv74sv5i.apps.googleusercontent.com';

const SettingsScreen: React.FC = () => { 
  const [isLoading, setIsLoading] = useState(true);
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const {updateAccessToken} = useSession();
  const navigation = useNavigation();

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  const fetchSessionStatus = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/get/googlestatus`);
      if (response.data) {
        setSessionInfo(response.data);
      } else {
        setSessionInfo(null);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log('Error fetching status:', error.response?.status);
        setSessionInfo(null);
      } else {
        handleError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        forceCodeForRefreshToken: true,
      });

      // Check Play Services
      await GoogleSignin.hasPlayServices();

      // Perform sign-in
      const userInfo = (await GoogleSignin.signIn()) as unknown as ExtendedUser;
      console.log(userInfo);
      // Ensure serverAuthCode is available
      if (!userInfo.data.serverAuthCode) {
        throw new Error('Failed to retrieve serverAuthCode. Please try again.');
      }

      // Exchange the serverAuthCode for an access token
      const response = await axiosInstance.post<ServerResponse>('/exchange', {
        serverAuthCode: userInfo.data.serverAuthCode,
      });

      const {accessToken} = response.data;

      // Store the access token and update the session
      await updateAccessToken(accessToken);
      await fetchSessionStatus();

      console.log('Google Sign-In successful');
    } catch (error) {
      let errorMessage = 'Failed to sign in with Google. Please try again.';

      if (error instanceof Error) {
        switch (error.message) {
          case statusCodes.SIGN_IN_CANCELLED:
            errorMessage = 'Sign in was cancelled.';
            break;
          case statusCodes.IN_PROGRESS:
            errorMessage = 'Sign in is already in progress.';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage = 'Play services are not available.';
            break;
          default:
            errorMessage = `Error: ${error.message}`;
        }
      }

      console.error('Error during Google Sign-In:', error);
      Alert.alert('Error', errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const navigateToOrganizationSettings = () => {
    // @ts-ignore - Add proper type definitions in your navigation stack
    navigation.navigate('OrganizationSettings');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BackTabTop screenName="Settings" />
        <SettingSkeleton />
      </SafeAreaView>  
     );
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <BackTabTop screenName="Settings" />
        <View style={styles.content}>
          {/* Organization Settings Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.organizationCard}
              onPress={navigateToOrganizationSettings}>
              <View style={styles.orgCardContent}>
                <Icon name="office-building" size={24} color={theme.colors.primary} />
                <View style={styles.orgCardText}>
                  <Text style={styles.orgCardTitle}>Update Organization</Text>
                  <Text style={styles.orgCardDescription}>
                    Edit organization details, logo, and contact information
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Google Calendar Integration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Google Calendar Integration</Text>

            {sessionInfo ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Doctor:</Text>
                  <Text style={styles.value}>{sessionInfo.doctor_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Organization:</Text>
                  <Text style={styles.value}>
                    {sessionInfo.organization_name}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Last Synced:</Text>
                  <Text style={styles.value}>
                    {formatDate(sessionInfo.lastUpdated || '')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Synced By:</Text>
                  <Text style={styles.value}>{sessionInfo.updatedBy}</Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.syncButton}
                    onPress={handleGoogleSignIn}>
                    <Text style={styles.buttonText}>Update Integration</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchSessionStatus}>
                    <Text style={styles.buttonText}>Refresh Status</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.signInContainer}>
                <Text style={styles.noteText}>
                  Connect your Google Calendar to sync appointments
                </Text>
                <GoogleSignInButton onSignInSuccess={handleGoogleSignIn} />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
    },
    safeArea: {
      flex: 1,
      backgroundColor: 'black',
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
    },
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: theme.colors.text,
    },
    section: {
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 15,
      color: '#333',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    label: {
      fontSize: 14,
      color: '#666',
      flex: 1,
    },
    value: {
      fontSize: 14,
      color: '#333',
      flex: 2,
      textAlign: 'right',
    },
    buttonContainer: {
      marginTop: 20,
      gap: 10,
    },
    syncButton: {
      backgroundColor: '#4CAF50',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    refreshButton: {
      backgroundColor: '#119FB3',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    signInContainer: {
      alignItems: 'center',
      gap: 15,
    },
    noteText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginBottom: 10,
    },
    // New styles for organization card
    organizationCard: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    orgCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    orgCardText: {
      flex: 1,
      marginLeft: 12,
    },
    orgCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 4,
    },
    orgCardDescription: {
      fontSize: 14,
      color: '#6B7280',
    },
  });

export default SettingsScreen;