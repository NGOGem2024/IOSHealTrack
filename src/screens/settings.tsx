import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
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
  is_admin?: boolean;
  has_access_token?: boolean;
  organization_location?: any[];
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
  const route = useRoute();
  const {updateAccessToken} = useSession();
  const navigation = useNavigation();

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showOrgPopup, setShowOrgPopup] = useState(false);
  const [forceShowGoogle, setForceShowGoogle] = useState(false);

  useEffect(() => {
    const params = (route.params as any) || {};
    if (params.showGooglePopup) setForceShowGoogle(true);
    if (params.showOrgPopup) setShowOrgPopup(true);
  }, [route.params]);

  // Animation refs - only for Google button
  const googleButtonScale = useRef(new Animated.Value(1)).current;

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
        setSessionInfo(null);
      } else {
        handleError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animation functions - only for Google button
  const startPulseAnimation = (animatedValue: Animated.Value) => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimation.start();
    return pulseAnimation;
  };

  const stopPulseAnimation = (animatedValue: Animated.Value) => {
    animatedValue.stopAnimation();
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    fetchSessionStatus();
  }, []);

  useEffect(() => {
    // Only animate Google integration if needed
    const needsGoogleIntegration =
      sessionInfo?.is_admin && !sessionInfo?.has_access_token;

    let googleAnimation: Animated.CompositeAnimation | null = null;

    // Start animation only for Google button
    if (needsGoogleIntegration) {
      googleAnimation = startPulseAnimation(googleButtonScale);
    } else {
      stopPulseAnimation(googleButtonScale);
    }

    // Cleanup function
    return () => {
      if (googleAnimation) {
        googleAnimation.stop();
      }
    };
  }, [sessionInfo]);

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
      await fetchSessionStatus(); // Refresh to update has_access_token
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

  // Highlight conditions
  const needsGoogleIntegration =
    sessionInfo?.is_admin && !sessionInfo?.has_access_token;
  const needsLocationSetup =
    !sessionInfo?.organization_location ||
    sessionInfo.organization_location.length === 0;
  const isSessionConnected = !!sessionInfo;

  const shouldShowGoogleBtn =
    forceShowGoogle || needsGoogleIntegration || !isSessionConnected;

  if (isLoading) {
    return (
      <View style={styles.safeArea}>
        <BackTabTop screenName="Settings" />
        <SettingSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <BackTabTop screenName="Settings" />
        <View style={styles.content}>
          {/* Organization Settings Section - No Animation */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.organizationCard,
                needsLocationSetup && styles.highlightedCard,
              ]}
              onPress={navigateToOrganizationSettings}>
              <View style={styles.orgCardContent}>
                <Icon
                  name="office-building"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={styles.orgCardText}>
                  <View style={styles.orgCardTitleContainer}>
                    <Text style={styles.orgCardTitle}>Update Organization</Text>
                    {needsLocationSetup && (
                      <View style={styles.badgeContainer}>
                      </View>
                    )}
                  </View>
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
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                Google Calendar Integration
              </Text>
              {needsGoogleIntegration && (
                <View style={styles.badgeContainer}>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>Required</Text>
                  </View>
                </View>
              )}
            </View>

            {shouldShowGoogleBtn ? (
              <View style={styles.signInContainer}>
                <Text style={styles.noteText}>
                  Connect your Google Calendar to sync appointments
                </Text>
                <GoogleSignInButton
                  onSignInSuccess={handleGoogleSignIn}
                  shouldAnimate={needsGoogleIntegration}
                  animationScale={googleButtonScale}
                />
              </View>
            ) : (
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
                  <Animated.View
                    style={[{transform: [{scale: googleButtonScale}]}]}>
                    <TouchableOpacity
                      style={[
                        styles.syncButton,
                        needsGoogleIntegration && styles.highlightedButton,
                      ]}
                      onPress={handleGoogleSignIn}>
                      <Text style={styles.buttonText}>Update Integration</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchSessionStatus}>
                    <Text style={styles.buttonText}>Refresh Status</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Organization Popup Modal */}
      <Modal
        visible={showOrgPopup}
        onRequestClose={() => setShowOrgPopup(false)}
        animationType="fade"
        transparent={true}>
        <View style={styles.popupContainer}>
          <View style={styles.popupContent}>
            <Text style={styles.popupTitle}>Organization Setup Required</Text>
            <Text style={styles.popupText}>
              Please set up your organization location and sign in with Google.
            </Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => setShowOrgPopup(false)}>
              <Text style={styles.popupButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
      backgroundColor: theme.colors.inputBox,
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 3,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
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
      color: theme.colors.text,
      flex: 1,
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
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
    // Organization card styles
    organizationCard: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    highlightedCard: {
      backgroundColor: theme.colors.secondary,
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
    orgCardTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    orgCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.mainColor,
      marginBottom: 4,
    },
    requiredBadge: {
      backgroundColor: '#FF4444',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    requiredBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    orgCardDescription: {
      fontSize: 14,
      color: theme.colors.text,
    },
    highlightedButton: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoIcon: {
      marginLeft: 8,
    },
    popupContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    popupContent: {
      backgroundColor: theme.colors.card,
      padding: 20,
      borderRadius: 12,
      width: '80%',
      alignItems: 'center',
    },
    popupTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme.colors.text,
    },
    popupText: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.text,
    },
    popupButton: {
      backgroundColor: theme.colors.primary,
      padding: 10,
      borderRadius: 8,
    },
    popupButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });

export default SettingsScreen;
