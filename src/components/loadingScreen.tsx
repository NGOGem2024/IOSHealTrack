import React, {useEffect} from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width, height} = Dimensions.get('window');

const LoadingScreen: React.FC = () => {
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.whiteContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/ht-iconWhite.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Animated.View
            style={[styles.circleLoader, {transform: [{rotate: spin}]}]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#007B8E',
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
  },
  logoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    position: 'absolute',
    zIndex: 1,
  },
  circleLoader: {
    width: 100,
    height: 100,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'white',
    borderTopColor: 'transparent',
    position: 'absolute',
  },
});

export default LoadingScreen;
