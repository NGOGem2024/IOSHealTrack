import React, {useState} from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ProfilePhotoProps {
  photoUri?: string; // Made optional with ?
  size?: number;
  defaultImage?: any;
}

const EnhancedProfilePhoto: React.FC<ProfilePhotoProps> = ({
  photoUri,
  size = 90,
  defaultImage = require('../assets/profile.png'),
}) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [scale] = useState(new Animated.Value(1));

  const handlePress = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 1.1,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const imageSource = photoUri ? {uri: photoUri} : defaultImage;

  return (
    <>
      <TouchableOpacity onPress={handlePress}>
        <Image
          source={imageSource}
          style={[
            styles.profilePhoto,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}>
        <SafeAreaView style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      transform: [{scale: scale}],
                    },
                  ]}>
                  <TouchableWithoutFeedback
                    onPressIn={animateIn}
                    onPressOut={animateOut}>
                    <Image
                      source={imageSource}
                      style={styles.enlargedPhoto}
                      resizeMode="contain"
                    />
                  </TouchableWithoutFeedback>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeModal}>
                    <Icon name="close-circle" size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  profilePhoto: {
    borderWidth: 1,
    borderColor: '#119FB3', // Updated to match your color scheme
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedPhoto: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
});

export default EnhancedProfilePhoto;
