import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSession} from '../context/SessionContext';

const instance = axios.create({
  baseURL: 'https://healtrackapp-worker.up.railway.app', // Adjust to your API URL
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
    if (error.response && error.response.status === 401) {
      // Handle token expiration and logout logic
      await AsyncStorage.removeItem('userToken');
      // Optionally redirect to login screen
    }
    return Promise.reject(error);
  },
);
export default instance;
