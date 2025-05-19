import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../screens/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Define props interface for SkeletonItem
interface SkeletonItemProps {
  height?: number | string;
  width?: number | string;
  borderRadius?: number;
}

// Component props interface
interface SettingsScreenSkeletonProps {
  // You can add any props needed here
}

const SettingsScreenSkeleton: React.FC<SettingsScreenSkeletonProps> = () => {
  // Use the theme context to get current theme
  const { theme } = useTheme();
  const isDarkMode = theme.name === 'dark';

  // Create an animated value for shimmer effect
  const shimmerAnimation = React.useRef(new Animated.Value(0)).current;

  // Start shimmer animation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnimation]);

  // Interpolate shimmer animation
  const shimmerTranslate = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  // Get theme-aware styles
  const styles = getStyles(isDarkMode);

  // Shimmer overlay component
  const ShimmerOverlay = () => (
    <Animated.View
      style={[
        styles.shimmerOverlay,
        {
          transform: [{ translateX: shimmerTranslate }],
        },
      ]}
    />
  );

  // Skeleton item for rows and cards with explicit typing
  const SkeletonItem: React.FC<SkeletonItemProps> = ({ 
    height = 50, 
    width = '100%', 
    borderRadius = 8 
  }) => {
    // Create dynamic style with proper typing
    const dynamicStyle: ViewStyle = {
      height: typeof height === 'number' ? height : undefined,
      width: typeof width === 'number' ? width : '100%',
      borderRadius: borderRadius
    };

    return (
      <View style={[styles.skeletonItem, dynamicStyle]}>
        <ShimmerOverlay />
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* Organization Settings Card Skeleton */}
      <View style={styles.section}>
        <View style={styles.organizationCardSkeleton}>
          <View style={styles.orgCardContentSkeleton}>
            <SkeletonItem height={40} width={40} borderRadius={20} />
            <View style={styles.orgCardTextSkeleton}>
              <SkeletonItem height={20} width={150} borderRadius={4} />
              <SkeletonItem height={15} width={200} borderRadius={4} />
            </View>
            <SkeletonItem height={20} width={20} borderRadius={10} />
          </View>
        </View>
      </View>

      {/* Google Calendar Integration Skeleton */}
      <View style={styles.section}>
        <SkeletonItem height={25} width={200} borderRadius={4} />
        
        <View style={styles.infoRowSkeleton}>
          <SkeletonItem height={20} width={100} borderRadius={4} />
          <SkeletonItem height={20} width={150} borderRadius={4} />
        </View>
        <View style={styles.infoRowSkeleton}>
          <SkeletonItem height={20} width={100} borderRadius={4} />
          <SkeletonItem height={20} width={150} borderRadius={4} />
        </View>
        <View style={styles.infoRowSkeleton}>
          <SkeletonItem height={20} width={100} borderRadius={4} />
          <SkeletonItem height={20} width={150} borderRadius={4} />
        </View>
        <View style={styles.infoRowSkeleton}>
          <SkeletonItem height={20} width={100} borderRadius={4} />
          <SkeletonItem height={20} width={150} borderRadius={4} />
        </View>

        {/* Button Skeletons */}
        <View style={styles.buttonContainerSkeleton}>
          <SkeletonItem height={50} borderRadius={8} />
          <SkeletonItem height={50} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

// Create styles based on theme
const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#121212' : '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backTabSkeleton: {
    marginBottom: 20,
  },
  section: {
    backgroundColor: isDarkMode ? '#233436' : '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.4 : 0.1,
    shadowRadius: 1.5,
    elevation: 3,
    borderColor: isDarkMode ? '#119FB3' : 'white',
    borderWidth: 1,
  },
  skeletonItem: {
    backgroundColor: isDarkMode ? '#2C2C2C' : '#E5E7EB',
    overflow: 'hidden',
    marginVertical: 5,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
  },
  organizationCardSkeleton: {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#333333' : '#E5E7EB',
  },
  orgCardContentSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  orgCardTextSkeleton: {
    flex: 1,
    marginLeft: 12,
    gap: 5,
  },
  infoRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#2C2C2C' : '#f0f0f0',
  },
  buttonContainerSkeleton: {
    marginTop: 20,
    gap: 10,
  },
});

export default SettingsScreenSkeleton;