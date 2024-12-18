import React, {useEffect} from 'react';
import {View, Image, StyleSheet, Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

const SplashScreen = ({}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to your main screen after 3 seconds
      // navigation.replace("MainScreen"); // Uncomment and replace with your main screen name
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/HealTrackLoGO.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.8, // 80% of screen width
    height: height * 0.3, // 30% of screen height
    maxWidth: 400, // Maximum width
    maxHeight: 200, // Maximum height
  },
});

export default SplashScreen;
