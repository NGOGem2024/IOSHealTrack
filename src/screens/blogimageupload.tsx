import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';

interface BlogImageUploaderProps {
  onImageSelected: (image: any) => void;
  onImageRemoved: () => void;
  initialImage?: string | null;
  isUploading: boolean;
}

// Add an interface for the picker error
interface ImagePickerError {
  code?: string;
  message?: string;
}

const BlogImageUploader: React.FC<BlogImageUploaderProps> = ({
  onImageSelected,
  onImageRemoved,
  initialImage,
  isUploading,
}) => {
  const [localImage, setLocalImage] = React.useState<string | null>(
    initialImage || null,
  );

  const handleImagePick = async () => {
    Alert.alert('Select Image', 'Choose image source', [
      {
        text: 'Camera',
        onPress: () => pickImage('camera'),
      },
      {
        text: 'Gallery',
        onPress: () => pickImage('gallery'),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      const pickerMethod =
        source === 'camera' ? ImagePicker.openCamera : ImagePicker.openPicker;

      const image = await pickerMethod({
        width: 1200,
        height: 800,
        cropping: true,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      });

      setLocalImage(image.path);
      onImageSelected({
        uri: image.path,
        name: image.path.split('/').pop(),
        type: image.mime || 'image/jpeg',
      });
    } catch (error: unknown) {
      // Type check the error before accessing properties
      const pickerError = error as ImagePickerError;
      if (pickerError.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Failed to select image');
      }
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            setLocalImage(null);
            onImageRemoved();
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };
  

  return (
    <View style={styles.container}>
      {localImage ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{uri: localImage}} style={styles.imagePreview} />
          {!isUploading && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveImage}>
              <Icon name="close-circle" size={24} color="#ff4444" />
            </TouchableOpacity>
          )}
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleImagePick}
        disabled={isUploading}
      >
        <Icon name="camera-outline" size={40} color="#007B8E" />
        <Text style={styles.addImageText}>Add Image</Text>
      </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  uploadButton: {
    
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 5,
  },
  
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  addImageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BlogImageUploader;
