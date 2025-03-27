import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ViewStyle,
} from 'react-native';

// Modify the SkeletonItem props interface
interface SkeletonItemProps {
  height?: number;
  width?: number | string;
  marginTop?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ theme, isDarkMode }) => {
  const styles = createStyles(theme.colors, isDarkMode);

  // Create an animated value for shimmer effect
  const shimmerAnimation = new Animated.Value(0);

  // Start shimmer animation
  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  // Get screen width
  const { width } = Dimensions.get('window');

  // Interpolate shimmer animation
  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  // Shimmer overlay component
  const ShimmerOverlay = () => (
    <Animated.View
      style={[
        styles.shimmerOverlay,
        {
          transform: [{ translateX }],
        },
      ]}
    />
  );

  // Skeleton item component with improved type checking
  const SkeletonItem: React.FC<SkeletonItemProps> = ({
    height = 50,
    width = '100%',
    marginTop = 10
  }) => {
    // Create dynamic style object with proper type handling
    const dynamicStyle: ViewStyle = {
      height,
      width: typeof width === 'number' ? width : (width as ViewStyle["width"]), 
      marginTop,
    };

    return (
      <View style={[styles.skeletonItem, dynamicStyle]}>
        <ShimmerOverlay />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <SkeletonItem height={40} width="70%" />
      </View>

      <View style={styles.sectionContainer}>
        <SkeletonItem height={20} width="50%" marginTop={20} />
        <SkeletonItem height={50} marginTop={10} />

        <SkeletonItem height={20} width="50%" marginTop={20} />
        <SkeletonItem height={50} marginTop={10} />

        <SkeletonItem height={20} width="50%" marginTop={20} />
        <SkeletonItem height={50} marginTop={10} />

        <SkeletonItem height={20} width="50%" marginTop={20} />
        <SkeletonItem height={100} marginTop={10} />

        <View style={styles.buttonContainer}>
          <SkeletonItem height={50} width="100%" marginTop={20} />
        </View>
      </View>
    </View>
  );
};

// Update the props interface
interface SkeletonLoaderProps {
  theme: {
    colors: any;
  };
  isDarkMode: boolean;
}

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  skeletonItem: {
    backgroundColor: isDarkMode ? `${colors.border}50` : '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDarkMode
      ? 'rgba(255,255,255,0.1)'
      : 'rgba(255,255,255,0.7)',
    transform: [{ skewX: '20deg' }],
  },
  buttonContainer: {
    marginBottom: 20,
  },
});

export default SkeletonLoader;