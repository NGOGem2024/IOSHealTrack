import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import {useTheme} from '../screens/ThemeContext';
import {getTheme} from '../screens/Theme';
import BackTabTop from '../screens/BackTopTab';

const {width} = Dimensions.get('window');

const OrganizationSkeletonLoader: React.FC = () => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  
  // Create an animated value for shimmer effect
  const shimmerAnimation = React.useRef(new Animated.Value(0)).current;

  // Start shimmer animation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnimation]);

  // Interpolate shimmer animation
  const shimmerTranslate = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

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

  // Helper component for skeleton items with shimmer
  const SkeletonItem: React.FC<{ style: any }> = ({ style }) => (
    <View style={[style, { overflow: 'hidden' }]}>
      <ShimmerOverlay />
    </View>
  );

  return (
    <View style={styles.container}>
      <BackTabTop screenName="Update Organization" />
      {/* Banner skeleton */}
      <SkeletonItem style={styles.bannerSkeleton} />
      
      {/* Profile image skeleton */}
      <View style={styles.profileContainer}>
        <SkeletonItem style={styles.profileImageSkeleton} />
      </View>
      
      <View style={styles.content}>
        {/* Basic Information section */}
        <SkeletonItem style={styles.sectionHeader} />
        <SkeletonItem style={styles.inputSkeleton} />
        <SkeletonItem style={styles.inputSkeleton} />
        <SkeletonItem style={styles.inputSkeleton} />
        
        {/* Row with two inputs */}
        <View style={styles.row}>
          <SkeletonItem style={styles.halfInputSkeleton} />
          <SkeletonItem style={styles.halfInputSkeleton} />
        </View>
        
        {/* Address section */}
        <SkeletonItem style={styles.sectionHeader} />
        <SkeletonItem style={styles.inputSkeleton} />
        
        {/* Row with two inputs */}
        <View style={styles.row}>
          <SkeletonItem style={styles.halfInputSkeleton} />
          <SkeletonItem style={styles.halfInputSkeleton} />
        </View>
        
        {/* Row with two inputs */}
        <View style={styles.row}>
          <SkeletonItem style={styles.halfInputSkeleton} />
          <SkeletonItem style={styles.halfInputSkeleton} />
        </View>
        
        {/* Additional Info section */}
        <SkeletonItem style={styles.sectionHeader} />
        
        {/* Row with two inputs */}
        <View style={styles.row}>
          <SkeletonItem style={styles.halfInputSkeleton} />
          <SkeletonItem style={styles.halfInputSkeleton} />
        </View>
        
        {/* Multiline input */}
        <SkeletonItem style={styles.multilineInputSkeleton} />
        
        {/* Social Media section */}
        <SkeletonItem style={styles.sectionHeader} />
        <SkeletonItem style={styles.inputSkeleton} />
        
        {/* Videos section */}
        <SkeletonItem style={styles.sectionHeader} />
        <View style={styles.cardSkeleton}>
          <SkeletonItem style={styles.videoItemSkeleton} />
          <SkeletonItem style={styles.videoItemSkeleton} />
        </View>
        
        {/* Button */}
        <SkeletonItem style={styles.buttonSkeleton} />
      </View>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      backgroundColor: theme.colors.card,
    },
    bannerSkeleton: {
      width: '100%',
      height: 160,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      backgroundColor: theme.colors.border
    },
    profileContainer: {
      height: 50,
      marginLeft: 15,
      marginBottom: 40,
    },
    profileImageSkeleton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.border,
      marginTop: -60,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    sectionHeader: {
      height: 25,
      width: '60%',
      backgroundColor: theme.colors.border,
      borderRadius: 5,
      marginBottom: 15,
      marginTop: 20,
    },
    inputSkeleton: {
      height: 50,
      width: '100%',
      backgroundColor: theme.colors.border,
      borderRadius: 10,
      marginBottom: 20,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 15,
      marginBottom: 20,
    },
    halfInputSkeleton: {
      flex: 1,
      height: 50,
      backgroundColor: theme.colors.border,
      borderRadius: 10,
    },
    multilineInputSkeleton: {
      height: 100,
      width: '100%',
      backgroundColor: theme.colors.border,
      borderRadius: 10,
      marginBottom: 20,
    },
    cardSkeleton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    videoItemSkeleton: {
      height: 60,
      backgroundColor: theme.colors.border,
      borderRadius: 10,
      marginBottom: 10,
    },
    buttonSkeleton: {
      height: 50,
      width: '100%',
      backgroundColor: theme.colors.border,
      borderRadius: 10,
      marginTop: 20,
      marginBottom: 20,
    },
    shimmerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '100%',
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
    },
  });

export default OrganizationSkeletonLoader;