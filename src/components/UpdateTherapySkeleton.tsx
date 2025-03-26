import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const windowWidth = Dimensions.get('window').width;

const UpdateTherapySkeleton: React.FC = () => {
  const opacity = useSharedValue(0.3);

  opacity.value = withRepeat(
    withTiming(1, { duration: 1000 }),
    -1,
    true
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, animatedStyle]} />
      
      <View style={styles.formContainer}>
        {/* Therapy Type Skeleton */}
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.label, animatedStyle]} />
          <Animated.View style={[styles.input, animatedStyle]} />
        </View>

        {/* Doctor Name Skeleton */}
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.label, animatedStyle]} />
          <Animated.View style={[styles.input, animatedStyle]} />
        </View>

        {/* Date Skeleton */}
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.label, animatedStyle]} />
          <Animated.View style={[styles.input, animatedStyle]} />
        </View>

        {/* Start Time Skeleton */}
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.label, animatedStyle]} />
          <Animated.View style={[styles.input, animatedStyle]} />
        </View>

        {/* End Time Skeleton */}
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.label, animatedStyle]} />
          <Animated.View style={[styles.input, animatedStyle]} />
        </View>

        {/* Cost Skeleton */}
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.label, animatedStyle]} />
          <Animated.View style={[styles.input, animatedStyle]} />
        </View>

        {/* Remarks Skeleton */}
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.label, animatedStyle]} />
          <Animated.View style={[styles.inputMultiline, animatedStyle]} />
        </View>

        {/* Buttons Skeleton */}
        <View style={styles.buttonContainer}>
          <Animated.View style={[styles.button, animatedStyle]} />
          <Animated.View style={[styles.button, animatedStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    height: 50,
    backgroundColor: '#E1E9EE',
    marginBottom: 20,
    borderRadius: 8,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    height: 20,
    backgroundColor: '#E1E9EE',
    width: '40%',
    marginBottom: 8,
    borderRadius: 4,
  },
  input: {
    height: 50,
    backgroundColor: '#E1E9EE',
    borderRadius: 8,
  },
  inputMultiline: {
    height: 100,
    backgroundColor: '#E1E9EE',
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    width: windowWidth > 360 ? '45%' : '40%',
    height: 50,
    backgroundColor: '#E1E9EE',
    borderRadius: 10,
  },
});

export default UpdateTherapySkeleton;