import React from 'react';
import {TouchableOpacity, Text, StyleSheet, Alert} from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALLBACK_URL = 'physio.gem.auth://callback';
const LIVESWITCH_CLIENT_ID = 'ADRTBpRcrev3ebDN2Jdpd2ednNlFbw7B';

interface LiveSwitchLoginButtonProps {
  onLoginSuccess: () => void;
}

const LiveSwitchLoginButton: React.FC<LiveSwitchLoginButtonProps> = ({
  onLoginSuccess,
}) => {
  const handleRedirect = async (url: string) => {
    if (url.includes('access_token=')) {
      const token = url.split('access_token=')[1].split('&')[0];
      const expire = url.split('expires_in=')[1].split('&')[0];
      const expiresAt = Date.now() + parseInt(expire) * 1000;
      await AsyncStorage.setItem(
        'liveSwitchTokenExpiresAt',
        expiresAt.toString(),
      );
      await AsyncStorage.setItem('LiveTokens', token);
      onLoginSuccess(); // Call the success callback
    }
  };

  const signInWithLiveSwitch = async () => {
    try {
      const authUrl = `https://public-api.production.liveswitch.com/v1/tokens?responseType=Token&clientId=${LIVESWITCH_CLIENT_ID}&callbackUrl=${encodeURIComponent(
        CALLBACK_URL,
      )}`;

      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(authUrl, CALLBACK_URL, {
          // Customization options for the in-app browser
          showTitle: true,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        });

        if (result.type === 'success' && result.url) {
          await handleRedirect(result.url);
        }
      } else {
        Alert.alert('Error', 'InAppBrowser is not available');
      }
    } catch (error) {
      console.error('Error during LiveSwitch authentication:', error);
      Alert.alert('Error', 'Authentication failed, please try again.');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={signInWithLiveSwitch}>
      <Text style={styles.buttonText}>LiveSwitch Login</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2a7fba',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LiveSwitchLoginButton;
