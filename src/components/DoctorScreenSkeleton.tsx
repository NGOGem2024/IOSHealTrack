import React from 'react';
import {View, StyleSheet, Animated, SafeAreaView} from 'react-native';

interface SkeletonProps {
  theme: {
    name: 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark';
  };
}

// Internal theme configuration
const themeColors = {
  purple: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#333333',
    secondary: '#E0E0E0',
  },
  blue: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#333333',
    secondary: '#E0E0E0',
  },
  green: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#333333',
    secondary: '#E0E0E0',
  },
  orange: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#333333',
    secondary: '#E0E0E0',
  },
  pink: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#333333',
    secondary: '#E0E0E0',
  },
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    secondary: '#2C2C2C',
  },
};

const DoctorScreenSkeleton: React.FC<SkeletonProps> = ({theme}) => {
  // Select theme, default to blue if not specified
  const colors = themeColors[theme.name] || themeColors.blue;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#007b8e',
    },
    profileCard: {
      backgroundColor: colors.card,
      margin: 16,
      borderRadius: 12,
      elevation: 4,
    },
    headerContainer: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'center',
    },
    profileImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.secondary,
      overflow: 'hidden',
    },
    headerTextContainer: {
      marginLeft: 16,
      flex: 1,
    },
    namePlaceholder: {
      height: 24,
      width: '70%',
      backgroundColor: colors.secondary,
      marginBottom: 10,
      borderRadius: 4,
      overflow: 'hidden',
    },
    emailPlaceholder: {
      height: 20,
      width: '50%',
      backgroundColor: colors.secondary,
      borderRadius: 4,
      overflow: 'hidden',
    },
    contactInfoContainer: {
      padding: 16,
    },
    contactInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconPlaceholder: {
      width: 24,
      height: 24,
      borderRadius: 4,
      backgroundColor: colors.secondary,
      marginRight: 16,
      overflow: 'hidden',
    },
    textPlaceholder: {
      height: 20,
      flex: 1,
      backgroundColor: colors.secondary,
      borderRadius: 4,
      overflow: 'hidden',
    },
    cardSkeleton: {
      backgroundColor: colors.card,
      margin: 16,
      marginTop: 0,
      padding: 16,
      borderRadius: 12,
      elevation: 4,
    },
    cardTitlePlaceholder: {
      height: 24,
      width: '50%',
      backgroundColor: colors.secondary,
      marginBottom: 16,
      borderRadius: 4,
      overflow: 'hidden',
    },
    actionButtonSkeleton: {
      height: 56,
      backgroundColor: colors.secondary,
      borderRadius: 8,
      overflow: 'hidden',
    },
    appointmentSkeleton: {
      backgroundColor: colors.secondary,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    appointmentItemSkeleton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    shimmerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
  });

  // Create animated value for shimmer effect
  const shimmerAnimation = new Animated.Value(0);

  // Start shimmer animation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Shimmer overlay component
  const ShimmerOverlay = () => {
    const opacity = shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            opacity,
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Profile Header Skeleton */}
      <View style={styles.profileCard}>
        <View style={styles.headerContainer}>
          <View style={styles.profileImagePlaceholder}>
            <ShimmerOverlay />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={styles.namePlaceholder}>
              <ShimmerOverlay />
            </View>
            <View style={styles.emailPlaceholder}>
              <ShimmerOverlay />
            </View>
          </View>
        </View>

        {/* Contact Info Skeleton */}
        <View style={styles.contactInfoContainer}>
          {[1, 2, 3, 4].map(item => (
            <View key={item} style={styles.contactInfoItem}>
              <View style={styles.iconPlaceholder}>
                <ShimmerOverlay />
              </View>
              <View style={styles.textPlaceholder}>
                <ShimmerOverlay />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions Skeleton */}
      <View style={styles.cardSkeleton}>
        <View style={styles.cardTitlePlaceholder}>
          <ShimmerOverlay />
        </View>
        <View style={styles.actionButtonSkeleton}>
          <ShimmerOverlay />
        </View>
      </View>

      {/* Appointments Skeleton */}
      <View style={styles.cardSkeleton}>
        <View style={styles.cardTitlePlaceholder}>
          <ShimmerOverlay />
        </View>
        {[1, 2].map(item => (
          <View key={item} style={styles.appointmentSkeleton}>
            {[1, 2, 3].map(subItem => (
              <View key={subItem} style={styles.appointmentItemSkeleton}>
                <View style={styles.iconPlaceholder}>
                  <ShimmerOverlay />
                </View>
                <View style={styles.textPlaceholder}>
                  <ShimmerOverlay />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default DoctorScreenSkeleton;
