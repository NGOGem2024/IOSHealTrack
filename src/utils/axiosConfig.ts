import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSession} from '../context/SessionContext';
import {Platform} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

let isConnected: boolean = true;

NetInfo.addEventListener(state => {
  // Handle the null case explicitly
  isConnected = state.isConnected === null ? false : state.isConnected;
});

const instance = axios.create({
  //baseURL: 'https://healtrack.azurewebsites.net/',
  baseURL: 'http://192.168.1.24:5000',
  //baseURL: 'https://healtrackapp-production-b2ab.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': `HealTrack/${Platform.OS}`,
  },
});

class NetworkError extends Error {
  isNetworkError: boolean;
  
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
    this.isNetworkError = true;
  }
}

instance.interceptors.request.use(
  async config => {
    if (!isConnected) {
      throw new NetworkError('No internet connection');
    }
    
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
     // console.log(idToken)
      config.headers['Authorization'] = `Bearer ${idToken}`;
    }

    if (accessToken) {
      config.headers['auth'] = `Bearer ${accessToken}`;
    }

    if (liveSwitchToken ) {
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
    const newAccessToken = response.headers['newAccessToken']; 
    if (newAccessToken) {
      console.log('here1 :', newAccessToken);
      const {updateAccessToken} = useSession();
      await updateAccessToken(newAccessToken);
    }
    return response;
  },
  async error => {
    if (error.message === 'Network Error' || !error.response || (error instanceof NetworkError && error.isNetworkError)) {
      console.error('Network error occurred:', error);
      return Promise.reject(new NetworkError('No internet connection'));
    }
    
    if (
      error.config &&
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      const originalRequest = error.config;
      try {
        const newToken = await AsyncStorage.getItem('userToken');
        if (newToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default instance;