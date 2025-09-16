import React, {useEffect} from 'react';
import {TouchableOpacity, Text, View, StyleSheet, Alert, Animated} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {
  GoogleSignin,
  statusCodes,
  SignInResponse,
} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';

const GOOGLE_WEB_CLIENT_ID =
  '1038698506388-eegihlhipbg4d1cubdjk4p44gv74sv5i.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  onSignInSuccess: () => void;
  animationScale?: Animated.Value;
  shouldAnimate?: boolean;
}

interface ServerResponse {
  accessToken: string;
}

// Extend SignInResponse to include serverAuthCode
type ExtendedSignInResponse = SignInResponse & {
  serverAuthCode?: string;
};

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInSuccess,
  shouldAnimate = false,
  animationScale,
}) => {
  const {updateAccessToken} = useSession();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();

      const userInfo = (await GoogleSignin.signIn()) as ExtendedSignInResponse;
      const serverAuthCode = userInfo.data?.serverAuthCode;

      if (!serverAuthCode) {
        console.warn('No serverAuthCode received from Google Sign-In.');
        Alert.alert(
          'Error',
          'No server auth code received. Please try again or check your configuration.',
        );
        return;
      }

      // Save tokens (optional)
      const tokens = await GoogleSignin.getTokens();
      await AsyncStorage.setItem('googleTokens', JSON.stringify(tokens));
      const expirationTime = Date.now() + 3300000;
      await AsyncStorage.setItem(
        'tokenExpirationTime',
        expirationTime.toString(),
      );

      // Exchange auth code for backend access token
      const response = await axiosInstance.post<ServerResponse>('/exchange', {
        serverAuthCode,
      });

      const {accessToken} = response.data;
      await updateAccessToken(accessToken);
      onSignInSuccess();
    } catch (error: any) {
      let errorMessage = 'Failed to sign in with Google.';

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Sign in was cancelled';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign in is already in progress';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Play services not available';
      }

      console.error('Google Sign-In error:', error);
      Alert.alert('Sign-In Error', errorMessage);
    }
  };

  return (
    <Animated.View 
      style={[
        animationScale && { transform: [{ scale: animationScale }] },
        shouldAnimate && styles.highlightedContainer,
      ]}
    >
      <TouchableOpacity 
        style={[
          styles.googleButton,
          shouldAnimate && styles.highlightedButton,
        ]} 
        onPress={signInWithGoogle}
      >
        <View style={styles.googleButtonContent}>
          <AntDesign
            name="google"
            size={24}
            color="white"
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: '#2a7fba',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    width: '95%',
    alignItems: 'center',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  highlightedContainer: {
    // Additional styling for the animated container if needed
  },
  highlightedButton: {
    borderWidth: 2,
    borderColor: '#4285f4',
    shadowColor: '#4285f4',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default GoogleSignInButton;