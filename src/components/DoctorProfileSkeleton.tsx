import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');

interface SkeletonLoaderProps {
  theme?: 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark';
}

const DoctorProfileSkeleton: React.FC<SkeletonLoaderProps> = () => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },
    headerSkeleton: {
      backgroundColor: '#FFFFFF',
      marginBottom: 20,
    },
    coverPhoteSkeleton: {
      height: 90,
      backgroundColor: '#E2E8F0',
    },
    profileImageSkeleton: {
      width: 110,
      height: 110,
      borderRadius: 60,
      backgroundColor: '#E2E8F0',
      position: 'absolute',
      left: 20,
      top: 20,
    },
    sectionSkeleton: {
      padding: 15,
    },
    sectionTitleSkeleton: {
      height: 30,
      width: 200,
      backgroundColor: '#E2E8F0',
      marginBottom: 10,
      marginTop: 20,
    },
    cardSkeleton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    skeletonItem: {
      height: 50,
      backgroundColor: '#F8FAFC',
      borderRadius: 8,
      marginBottom: 16,
      justifyContent: 'center',
    },
    skeletonLine: {
      height: 20,
      width: '80%',
      backgroundColor: '#E2E8F0',
      marginLeft: 16,
    },
    skeletonDescription: {
      height: 40,
      backgroundColor: '#F8FAFC',
      borderRadius: 8,
      marginBottom: 20,
    },
    skeletonVideoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: '#F8FAFC',
      borderRadius: 10,
      padding: 12,
    },
    skeletonVideoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#E2E8F0',
      marginRight: 10,
    },
    skeletonVideoContent: {
      flex: 1,
    },
    skeletonVideoTitle: {
      height: 16,
      width: '70%',
      backgroundColor: '#E2E8F0',
      marginBottom: 8,
    },
    skeletonVideoSubtitle: {
      height: 14,
      width: '50%',
      backgroundColor: '#E2E8F0',
    },
    skeletonAddButton: {
      height: 50,
      backgroundColor: '#E2E8F0',
      borderRadius: 10,
      marginTop: 20,
    },
  });

  const SkeletonItem = () => (
    <View style={styles.skeletonItem}>
      <View style={styles.skeletonLine} />
    </View>
  );

  const SkeletonVideoItem = () => (
    <View style={styles.skeletonVideoItem}>
      <View style={styles.skeletonVideoIcon} />
      <View style={styles.skeletonVideoContent}>
        <View style={styles.skeletonVideoTitle} />
        <View style={styles.skeletonVideoSubtitle} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={styles.coverPhoteSkeleton} />
        <View style={styles.profileImageSkeleton} />
      </View>

      {/* Personal Information Skeleton */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionTitleSkeleton} />
        <View style={styles.cardSkeleton}>
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <SkeletonItem key={index} />
          ))}
        </View>
      </View>

      {/* YouTube Videos Skeleton */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionTitleSkeleton} />
        <View style={styles.cardSkeleton}>
          <View style={styles.skeletonDescription} />
          {[1, 2].map((_, index) => (
            <SkeletonVideoItem key={index} />
          ))}
          <View style={styles.skeletonAddButton} />
        </View>
      </View>
    </View>
  );
};

export default DoctorProfileSkeleton;