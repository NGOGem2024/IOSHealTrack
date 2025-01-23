import React, {useEffect, useRef} from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  LogBox,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ICON_SIZE = 120;
const TEXT_WIDTH = 250;
const SPACING = 20;

// Calculate total width of content
const TOTAL_WIDTH = ICON_SIZE + SPACING + TEXT_WIDTH;

// Calculate center positions
const CENTER_POSITION = SCREEN_WIDTH / 2 - ICON_SIZE / 2;
// Adjust icon end position slightly to prevent overlap
const ICON_END = CENTER_POSITION - 50; // Increased from 40 to 45 to prevent overlap

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
}) => {
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconPosition = useRef(new Animated.Value(CENTER_POSITION)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    LogBox.ignoreLogs(['Require cycle:']);

    Animated.sequence([
      // 1. Fade in the icon in the center
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),

      // 2. Very subtle icon movement and text appearance
      Animated.parallel([
        // Minimal icon movement
        Animated.timing(iconPosition, {
          toValue: ICON_END,
          duration: 800,
          useNativeDriver: true,
        }),
        // Fade in text
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Scale up text slightly
        Animated.timing(textScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTimeout(onAnimationComplete, 500);
    });
  }, [iconOpacity, iconPosition, textOpacity, textScale, onAnimationComplete]);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: iconOpacity,
              transform: [{translateX: iconPosition}],
            },
          ]}>
          <Image
            source={require('../assets/ht-icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{translateX: ICON_SIZE}, {scale: textScale}],
            },
          ]}>
          <Image
            source={require('../assets/healtrack.png')}
            style={styles.text}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: TOTAL_WIDTH,
    height: ICON_SIZE,
    position: 'relative',
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconContainer: {
    position: 'absolute',
    height: ICON_SIZE,
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    height: ICON_SIZE,
    justifyContent: 'center',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  text: {
    height: 70,
    width: TEXT_WIDTH,
  },
});

export default AnimatedSplashScreen;
