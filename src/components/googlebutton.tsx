import React, {useEffect} from 'react';
import {TouchableOpacity, Text, View, StyleSheet, Alert} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {
  GoogleSignin,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';

const GOOGLE_WEB_CLIENT_ID =
  '1038698506388-eegihlhipbg4d1cubdjk4p44gv74sv5i.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  onSignInSuccess: () => void;
}

interface ServerResponse {
  accessToken: string;
}

// Extended User interface to include serverAuthCode with 'string | null' type
interface GoogleSignInResponse extends User {
  serverAuthCode: string | null;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInSuccess,
}) => {
  const {updateAccessToken} = useSession();

  useEffect(() => {
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
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo =
        (await GoogleSignin.signIn()) as unknown as GoogleSignInResponse;
      const tokens = await GoogleSignin.getTokens();

      await AsyncStorage.setItem('googleTokens', JSON.stringify(tokens));
      const expirationTime = Date.now() + 3300000; // 1 hour from now
      await AsyncStorage.setItem(
        'tokenExpirationTime',
        expirationTime.toString(),
      );

      if (userInfo.serverAuthCode) {
        try {
          const response = await axiosInstance.post<ServerResponse>(
            '/exchange',
            {
              serverAuthCode: userInfo.serverAuthCode,
            },
          );

          const {accessToken} = response.data;
          await updateAccessToken(accessToken);
          onSignInSuccess();
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'An unknown error occurred';

          console.error('Error exchanging auth code:', errorMessage);
          Alert.alert(
            'Error',
            'Failed to exchange auth code. Please try again.',
          );
        }
      } else {
        console.warn('No serverAuthCode present in userInfo');
        Alert.alert(
          'Error',
          'Failed to obtain server auth code. Please try again.',
        );
      }
    } catch (error) {
      let errorMessage = 'Failed to sign in with Google. Please try again.';

      if (error instanceof Error) {
        switch (error.message) {
          case statusCodes.SIGN_IN_CANCELLED:
            errorMessage = 'Sign in was cancelled';
            break;
          case statusCodes.IN_PROGRESS:
            errorMessage = 'Sign in is already in progress';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage = 'Play services are not available';
            break;
        }
      }

      console.error('Error during Google Sign-In:', error);
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
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
  );
};

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: '#2a7fba',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
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
});

export default GoogleSignInButton;
