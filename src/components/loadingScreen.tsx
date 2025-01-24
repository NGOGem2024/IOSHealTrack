import React, {useEffect, useRef} from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

const LoadingScreen: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
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
            style={{
              transform: [{rotate: spin}],
              position: 'absolute',
            }}>
            <Svg height="100" width="100" viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="45"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="283"
                strokeDashoffset="70"
                fill="transparent"
              />
            </Svg>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    ...Platform.select({
      android: {
        renderToHardwareTextureAndroid: true,
      },
      ios: {
        shouldRasterizeIOS: true,
      },
    }),
  },
  logo: {
    width: 80,
    height: 80,
    position: 'absolute',
    zIndex: 1,
  },
});

export default LoadingScreen;
