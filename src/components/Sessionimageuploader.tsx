import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Text,
  ScrollView,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';

interface SessionImage {
  uri: string;
  name: string;
  type: string;
  id: string;
}

interface SessionImageUploaderProps {
  onImagesSelected: (images: SessionImage[]) => void;
  onImageRemoved: (imageId: string) => void;
  initialImages?: SessionImage[];
  isUploading: boolean;
  maxImages?: number;
  sessionType: 'presession' | 'postsession';
}

interface ImagePickerError {
  code?: string;
  message?: string;
}

const SessionImageUploader: React.FC<SessionImageUploaderProps> = ({
  onImagesSelected,
  onImageRemoved,
  initialImages = [],
  isUploading,
  maxImages = 10,
  sessionType,
}) => {
  const [localImages, setLocalImages] = React.useState<SessionImage[]>(
    initialImages || [],
  );

  const handleImagePick = async () => {
    if (localImages.length >= maxImages) {
      Alert.alert(
        'Limit Reached',
        `You can only upload up to ${maxImages} images.`,
      );
      return;
    }

    Alert.alert('Select Images', 'Choose image source', [
      {
        text: 'Camera',
        onPress: () => pickImage('camera'),
      },
      {
        text: 'Gallery (Single)',
        onPress: () => pickImage('gallery'),
      },
      {
        text: 'Gallery (Multiple)',
        onPress: () => pickMultipleImages(),
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

      const newImage: SessionImage = {
        uri: image.path,
        name: image.path.split('/').pop() || 'image.jpg',
        type: image.mime || 'image/jpeg',
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };

      const updatedImages = [...localImages, newImage];
      setLocalImages(updatedImages);
      onImagesSelected(updatedImages);
    } catch (error: unknown) {
      const pickerError = error as ImagePickerError;
      if (pickerError.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Failed to select image');
      }
    }
  };

  const pickMultipleImages = async () => {
    try {
      const remainingSlots = maxImages - localImages.length;

      const images = await ImagePicker.openPicker({
        multiple: true,
        mediaType: 'photo',
        compressImageQuality: 0.8,
        maxFiles: remainingSlots,
        cropping: false, // Disable cropping for multiple selection
      });

      const newImages: SessionImage[] = images.map((image, index) => ({
        uri: image.path,
        name: image.path.split('/').pop() || `image_${index}.jpg`,
        type: image.mime || 'image/jpeg',
        id:
          Date.now().toString() +
          index +
          Math.random().toString(36).substr(2, 9),
      }));

      const updatedImages = [...localImages, ...newImages];
      setLocalImages(updatedImages);
      onImagesSelected(updatedImages);
    } catch (error: unknown) {
      const pickerError = error as ImagePickerError;
      if (pickerError.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Failed to select images');
      }
    }
  };

  const handleRemoveImage = (imageId: string) => {
    const imageToRemove = localImages.find(img => img.id === imageId);
    if (!imageToRemove) return;

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
            const updatedImages = localImages.filter(img => img.id !== imageId);
            setLocalImages(updatedImages);
            onImageRemoved(imageId);
            onImagesSelected(updatedImages);
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  const renderImageItem = ({item}: {item: SessionImage}) => (
    <View style={styles.imageContainer}>
      <Image source={{uri: item.uri}} style={styles.imagePreview} />
      {!isUploading && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveImage(item.id)}>
          <Icon name="close-circle" size={20} color="#ff4444" />
        </TouchableOpacity>
      )}
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
    </View>
  );

  const getTitle = () => {
    return sessionType === 'presession'
      ? 'Pre-Session Images'
      : 'Post-Session Images';
  };

  const getAddButtonText = () => {
    if (localImages.length === 0) {
      return 'Add Images';
    }
    return `Add More (${localImages.length}/${maxImages})`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>

      {localImages.length > 0 && (
        <FlatList
          data={localImages}
          renderItem={renderImageItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesList}
          contentContainerStyle={styles.imagesListContent}
        />
      )}

      {localImages.length < maxImages && (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleImagePick}
          disabled={isUploading}>
          <Icon
            name={
              localImages.length > 0 ? 'add-circle-outline' : 'camera-outline'
            }
            size={localImages.length > 0 ? 24 : 40}
            color="#007B8E"
          />
          <Text style={styles.addImageText}>{getAddButtonText()}</Text>
          {isUploading && (
            <ActivityIndicator
              size="small"
              color="#007B8E"
              style={styles.uploadingIndicator}
            />
          )}
        </TouchableOpacity>
      )}

      {localImages.length > 0 && (
        <Text style={styles.imageCount}>
          {localImages.length} of {maxImages} images selected
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  imagesList: {
    marginBottom: 12,
  },
  imagesListContent: {
    paddingHorizontal: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  uploadButton: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#007B8E',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    minWidth: 200,
  },
  addImageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#007B8E',
    fontWeight: '500',
  },
  uploadingIndicator: {
    marginTop: 8,
  },
  imageCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SessionImageUploader;
