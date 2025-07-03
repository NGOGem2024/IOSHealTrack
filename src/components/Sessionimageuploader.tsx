import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Text,
  FlatList,
  TextStyle,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import {useTheme} from '../screens/ThemeContext';
import {getTheme} from '../screens/Theme';

const {width} = Dimensions.get('window');

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
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
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
  titleStyle,
  containerStyle,
}) => {
  const [localImages, setLocalImages] = React.useState<SessionImage[]>(
    initialImages || [],
  );
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
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
        cropping: false,
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
          <Icon name="close-circle" size={22} color="#ff4444" />
        </TouchableOpacity>
      )}
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <TouchableOpacity
      style={styles.emptyStateContainer}
      onPress={handleImagePick}
      disabled={isUploading}
      activeOpacity={0.7}>
      <View style={styles.emptyStateContent}>
        <View style={styles.emptyStateIconContainer}>
          <Icon name="cloud-upload-outline" size={20} color="#007B8E" />
        </View>
        <Text style={styles.emptyStateTitle}>Add Images</Text>
        <Text style={styles.emptyStateSubtitle}>
          Tap to upload {sessionType === 'presession' ? 'pre-session' : 'post-session'} images
        </Text>
        <Text style={styles.emptyStateHint}>
          Support: Camera, Gallery • Max {maxImages} images
        </Text>
      </View>
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="small" color="#007B8E" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAddMoreButton = () => (
    <TouchableOpacity
      style={styles.addMoreButton}
      onPress={handleImagePick}
      disabled={isUploading || localImages.length >= maxImages}
      activeOpacity={0.7}>
      <View style={styles.addMoreIconContainer}>
        <Icon 
          name="add-outline" 
          size={24} 
          color={localImages.length >= maxImages ? '#ccc' : '#007B8E'} 
        />
      </View>
      <Text style={[
        styles.addMoreText,
        localImages.length >= maxImages && styles.addMoreTextDisabled
      ]}>
        Add More
      </Text>
    </TouchableOpacity>
  );

  const getTitle = () => {
    return sessionType === 'presession'
      ? 'Pre-Session Images'
      : 'Post-Session Images';
  };

  const getImageContainerWidth = () => {
    const numColumns = Math.min(3, localImages.length + 1);
    const totalPadding = 32; // Container padding
    const totalGaps = (numColumns - 1) * 12; // Gaps between items
    return (width - totalPadding - totalGaps) / numColumns;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, titleStyle]}>{getTitle()}</Text>
        </View>
        {localImages.length > 0 && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {localImages.length}/{maxImages}
            </Text>
          </View>
        )}
      </View>

      {/* Images Section */}
      <View style={styles.imagesSection}>
        {localImages.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.imagesGrid}>
            <FlatList
              data={localImages}
              renderItem={renderImageItem}
              keyExtractor={item => item.id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            
            {/* Add More Button */}
            {localImages.length < maxImages && (
              <View style={styles.addMoreContainer}>
                {renderAddMoreButton()}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Status Text */}
      {localImages.length > 0 && (
        <View style={styles.statusContainer}>
          <Icon name="checkmark-circle-outline" size={16} color="#27ae60" />
          <Text style={styles.statusText}>
            {localImages.length} image{localImages.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  counterContainer: {
    backgroundColor: '#007B8E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  imagesSection: {
    backgroundColor: theme.colors.inputBox,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  emptyStateContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 32,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  imagesGrid: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  separator: {
    height: 12,
  },
  imageContainer: {
    position: 'relative',
    width: (width - 80) / 3, // Dynamic width for 3 columns
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 11,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  addMoreContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#007B8E',
    borderStyle: 'dashed',
  },
  addMoreIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addMoreText: {
    fontSize: 14,
    color: '#007B8E',
    fontWeight: '600',
  },
  addMoreTextDisabled: {
    color: '#ccc',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
  },
});
export default SessionImageUploader;