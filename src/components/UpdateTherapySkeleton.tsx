import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  cancelAnimation,
  Easing
} from 'react-native-reanimated';
import { useTheme } from '../screens/ThemeContext';
import { getTheme } from '../screens/Theme';

const UpdateTherapySkeleton = () => {
  const { theme } = useTheme();
  const styles = getStyles(getTheme(theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark'));
  
  // Animation for shimmer effect
  const shimmerValue = useSharedValue(0);
  
  React.useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { 
        duration: 1500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      }),
      -1, // Infinite repeat
      true // Reverse
    );
    
    return () => {
      cancelAnimation(shimmerValue);
    };
  }, []);
  
  const shimmerStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.5,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      transform: [{ translateX: shimmerValue.value * windowWidth }],
    };
  });
  
  // Generate a set of skeleton cards
  const renderSkeletonCards = () => {
    return Array(4).fill(0).map((_, index) => (
      <View key={index} style={styles.therapyCard}>
        {/* Action buttons container skeleton */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButton} />
          <View style={styles.actionButton} />
        </View>
        
        {/* Header skeleton */}
        <View style={styles.therapyHeader}>
          <View style={styles.iconSkeleton} />
          <View style={styles.typeSkeleton} />
        </View>
        
        {/* Details skeleton */}
        <View style={styles.therapyDetails}>
          <View style={styles.textSkeleton} />
          <View style={styles.textSkeleton} />
          <View style={styles.textSkeleton} />
          <View style={styles.textSkeleton} />
        </View>
        
        {/* Button container skeleton */}
        <View style={styles.buttonContainer}>
          <View style={[styles.buttonSkeleton, { width: windowWidth > 360 ? 150 : '45%' }]} />
        </View>
        
        {/* Add shimmer effect */}
        <Animated.View style={shimmerStyle} />
      </View>
    ));
  };
  
  return (
    <View style={styles.container}>
      {/* Dropdown button skeleton */}
      <View style={styles.dropdownButtonSkeleton} />
      
      {/* Skeleton cards */}
      {renderSkeletonCards()}
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;

const getStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
     backgroundColor: "#007b8e",
  },
  therapyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownButtonSkeleton: {
    height: 40,
    backgroundColor: theme.colors.border,
    borderRadius: 5,
    marginBottom: 16,
    opacity: 0.7,
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 1,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 5,
    backgroundColor: theme.colors.border,
    opacity: 0.7,
  },
  therapyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    opacity: 0.7,
  },
  typeSkeleton: {
    height: 18,
    width: 120,
    marginLeft: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    opacity: 0.7,
  },
  therapyDetails: {
    marginBottom: 12,
  },
  textSkeleton: {
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginBottom: 8,
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  buttonSkeleton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    opacity: 0.7,
  },
});

export default UpdateTherapySkeleton;