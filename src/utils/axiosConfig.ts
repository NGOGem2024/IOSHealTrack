import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSession} from '../context/SessionContext';
import {Platform} from 'react-native';

const instance = axios.create({
  //baseURL: 'https://healtrack.azurewebsites.net/',
  baseURL: 'http://192.168.31.74:5000',
  //baseURL: 'https://healtrackapp-production-b2ab.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': `HealTrack/${Platform.OS}`,
  },
});

instance.interceptors.request.use(
  async config => {
    const idToken = await AsyncStorage.getItem('userToken');
    const accessToken = await AsyncStorage.getItem('googleAccessToken');
    const liveSwitchToken = await AsyncStorage.getItem('LiveTokens');
    const liveSwitchTokenExpiresAt = await AsyncStorage.getItem(
      'liveSwitchTokenExpiresAt',
    );

    if (liveSwitchToken && liveSwitchTokenExpiresAt) {
      const liveSwitchExpiration = parseInt(liveSwitchTokenExpiresAt);

      if (Date.now() >= liveSwitchExpiration) {
        console.log('Here');
        await AsyncStorage.removeItem('LiveTokens');
        await AsyncStorage.removeItem('liveSwitchTokenExpiresAt');
      }
    }

    if (idToken) {
      config.headers['Authorization'] = `Bearer ${idToken}`;
    }

    if (accessToken) {
      config.headers['auth'] = `Bearer ${accessToken}`;
    }

    if (liveSwitchToken /* && !isTokenExpired(expiresIn)*/) {
      config.headers['x-liveswitch-token'] = liveSwitchToken;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  async response => {
    // Check if the response contains a new access token in the headers
    const newAccessToken = response.headers['newAccessToken']; // or the key that holds your access token in the header
    if (newAccessToken) {
      // Use the updateAccessToken method to store the new access token
      console.log('here1 :', newAccessToken);
      const {updateAccessToken} = useSession();
      await updateAccessToken(newAccessToken);
    }
    return response;
  },
  async error => {
    if (
      error.config &&
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Handle token refresh here if needed
      const originalRequest = error.config;
      try {
        // Attempt to refresh token or handle auth error
        const newToken = await AsyncStorage.getItem('userToken');
        if (newToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
      }
    }

    if (error.message === 'Network Error' || !error.response) {
      console.error('Network error occurred:', error);
      // You might want to show a user-friendly error message here
    }

    return Promise.reject(error);
  },
);

export default instance;
