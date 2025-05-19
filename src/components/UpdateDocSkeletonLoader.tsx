import React from 'react';
import {View, StyleSheet, Animated, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

// Define props interface
interface DoctorSkeletonLoaderProps {
  // Add any props you need
}

// Define state interface
interface DoctorSkeletonLoaderState {
  animatedValue: Animated.Value;
}

class DoctorSkeletonLoader extends React.Component<DoctorSkeletonLoaderProps, DoctorSkeletonLoaderState> {
  constructor(props: DoctorSkeletonLoaderProps) {
    super(props);
    this.state = {
      animatedValue: new Animated.Value(0)
    };
  }

  componentDidMount() {
    this.startAnimation();
  }

  startAnimation = (): void => {
    Animated.loop(
      Animated.timing(this.state.animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ).start();
  };

  render() {
    const shimmerAnimation = this.state.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(211, 211, 211, 0.2)', 'rgba(211, 211, 211, 0.6)'],
    });

    return (
      <View style={styles.container}>
        {/* Profile Image Skeleton */}
        <View style={styles.profileImageContainer}>
          <Animated.View
            style={[
              styles.profilePhotoSkeleton,
              {backgroundColor: shimmerAnimation},
            ]}
          />
        </View>

        {/* Form Fields Skeleton */}
        <View style={styles.formContainer}>
          {/* Input Field Skeletons */}
          {[...Array(5)].map((_, index) => (
            <View key={index} style={styles.inputGroupSkeleton}>
              <Animated.View
                style={[
                  styles.labelSkeleton,
                  {backgroundColor: shimmerAnimation},
                ]}
              />
              <Animated.View
                style={[
                  styles.inputSkeleton,
                  {backgroundColor: shimmerAnimation},
                ]}
              />
            </View>
          ))}

          {/* Role Picker Skeleton */}
          <View style={styles.inputGroupSkeleton}>
            <Animated.View
              style={[styles.labelSkeleton, {backgroundColor: shimmerAnimation}]}
            />
            <Animated.View
              style={[
                styles.inputSkeleton,
                {backgroundColor: shimmerAnimation},
              ]}
            />
          </View>

          {/* Status Radio Buttons Skeleton */}
          <View style={styles.inputGroupSkeleton}>
            <Animated.View
              style={[styles.labelSkeleton, {backgroundColor: shimmerAnimation}]}
            />
            <View style={styles.radioSkeletonContainer}>
              <Animated.View
                style={[
                  styles.radioButtonSkeleton,
                  {backgroundColor: shimmerAnimation},
                ]}
              />
              <Animated.View
                style={[
                  styles.radioButtonSkeleton,
                  {backgroundColor: shimmerAnimation},
                ]}
              />
            </View>
          </View>

          {/* Button Skeleton */}
          <Animated.View
            style={[
              styles.buttonSkeleton,
              {backgroundColor: shimmerAnimation},
            ]}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007B8E',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  profilePhotoSkeleton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(211, 211, 211, 0.5)',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  inputGroupSkeleton: {
    marginBottom: 15,
  },
  labelSkeleton: {
    height: 16,
    width: 100,
    marginBottom: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(211, 211, 211, 0.5)',
  },
  inputSkeleton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(211, 211, 211, 0.5)',
  },
  radioSkeletonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  radioButtonSkeleton: {
    height: 24,
    width: '45%',
    borderRadius: 20,
    backgroundColor: 'rgba(211, 211, 211, 0.5)',
  },
  buttonSkeleton: {
    height: 50,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(211, 211, 211, 0.5)',
  },
});

export default DoctorSkeletonLoader;