import React, {useEffect, useRef} from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

const LoadingScreen: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
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
            style={[
              styles.circleLoader,
              {
                transform: [{rotate: spin}],
              },
            ]}
          />
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
