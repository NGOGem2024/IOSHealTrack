import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  isDarkMode?: boolean;
  colors?: {
    background?: string;
    skeleton?: string;
    shimmer?: string;
  };
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  isDarkMode = false, 
  colors = {} 
}) => {
  const defaultColors = {
    background: isDarkMode ? '#1A1A1A' : '#F0F8FF',
    skeleton: isDarkMode ? '#333333' : '#E0E0E0',
    shimmer: isDarkMode 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(0,0,0,0.05)'
  };

  const themeColors = { ...defaultColors, ...colors };
  const styles = createStyles(themeColors, isDarkMode);

  // Create animated shimmer effect
  const shimmerAnimation = new Animated.Value(0);

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
  }, []);

  const shimmerStyle = {
    transform: [
      {
        translateX: shimmerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-width, width],
        }),
      },
    ],
  };

  const SkeletonItem = () => (
    <View style={styles.skeletonItem}>
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
    </View>
  );

  const SkeletonTextField = () => (
    <View style={styles.skeletonTextField}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonInput}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>
    </View>
  );

  const SkeletonDateField = () => (
    <View style={styles.skeletonDateField}>
      <View style={styles.skeletonDateLabel} />
      <View style={styles.skeletonDatePicker}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Patient Name */}
      <SkeletonItem />

      {/* Therapy Category Dropdown */}
      <SkeletonTextField />

      {/* Therapy Name */}
      <SkeletonTextField />

      {/* Patient Symptoms */}
      <SkeletonTextField />

      {/* Patient Diagnosis */}
      <SkeletonTextField />

      {/* Date Fields */}
      <View style={styles.dateRow}>
        <SkeletonDateField />
        <SkeletonDateField />
      </View>

      {/* Duration */}
      <SkeletonTextField />

      {/* Payment Type */}
      <View style={styles.skeletonPaymentTypeRow}>
        <SkeletonItem />
        <SkeletonItem />
      </View>

      {/* Estimated Sessions */}
      <SkeletonTextField />

      {/* Per Session Amount (for recurring) */}
      <SkeletonTextField />

      {/* Total Amount */}
      <SkeletonTextField />

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <SkeletonItem />
        <SkeletonItem />
      </View>
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => 
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    skeletonItem: {
      height: 50,
      backgroundColor: colors.skeleton,
      borderRadius: 10,
      marginBottom: 20,
      overflow: 'hidden',
    },
    skeletonTextField: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    skeletonIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#444444' : '#D0D0D0',
      marginRight: 10,
    },
    skeletonInput: {
      flex: 1,
      height: 50,
      backgroundColor: colors.skeleton,
      borderRadius: 10,
      overflow: 'hidden',
    },
    skeletonDateField: {
      flex: 1,
      marginHorizontal: 2,
    },
    skeletonDateLabel: {
      height: 20,
      width: '60%',
      backgroundColor: isDarkMode ? '#444444' : '#D0D0D0',
      marginBottom: 10,
      borderRadius: 5,
    },
    skeletonDatePicker: {
      height: 50,
      backgroundColor: colors.skeleton,
      borderRadius: 10,
      overflow: 'hidden',
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    skeletonPaymentTypeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    shimmer: {
      backgroundColor: colors.shimmer,
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    },
  });

export default SkeletonLoader;