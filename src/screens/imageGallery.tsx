import React, {useState, useMemo} from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface GalleryImage {
  _id: string;
  sas_url: string;
  session_type: string;
  uploaded_at: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const ImageGallery: React.FC<ImageGalleryProps> = ({images}) => {
  const {theme} = useTheme();
  const memoizedTheme = useMemo(
    () =>
      getTheme(
        theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
      ),
    [theme.name],
  );
  const styles = useMemo(() => getStyles(memoizedTheme), [memoizedTheme]);

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showAllPreImages, setShowAllPreImages] = useState(false);
  const [showAllPostImages, setShowAllPostImages] = useState(false);

  // Group images by session_type
  const preImages = useMemo(
    () => images.filter(img => img.session_type === 'presession'),
    [images],
  );
  const postImages = useMemo(
    () => images.filter(img => img.session_type === 'postsession'),
    [images],
  );

  // Limit displayed images to 1 for the stack, others shown only when expanded
  const displayedPreImages = showAllPreImages
    ? preImages
    : preImages.slice(0, 1);
  const displayedPostImages = showAllPostImages
    ? postImages
    : postImages.slice(0, 1);

  // Combine images for modal navigation (maintains order: pre then post)
  const allImages = useMemo(
    () => [...preImages, ...postImages],
    [preImages, postImages],
  );

  const openImage = (
    index: number,
    sessionType: 'presession' | 'postsession',
  ) => {
    const offset = sessionType === 'presession' ? 0 : preImages.length;
    setSelectedImageIndex(index + offset);
    setIsImageLoading(true);
    setIsModalVisible(true);
  };

  const closeImage = () => {
    setIsModalVisible(false);
    setSelectedImageIndex(null);
    setIsImageLoading(true);
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setIsImageLoading(true);
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (
      selectedImageIndex !== null &&
      selectedImageIndex < allImages.length - 1
    ) {
      setIsImageLoading(true);
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const renderImageModal = useMemo(
    () => (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeImage}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {isImageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color="#119FB3" />
              </View>
            )}
            {selectedImageIndex !== null && (
              <>
                <Image
                  source={{uri: allImages[selectedImageIndex].sas_url}}
                  style={styles.fullImage}
                  resizeMode="contain"
                  onLoad={() => setIsImageLoading(false)}
                />
                <View
                  style={[
                    styles.sessionTypeBadge,
                    allImages[selectedImageIndex].session_type === 'presession'
                      ? styles.preSessionBadge
                      : styles.postSessionBadge,
                    styles.modalBadge,
                  ]}>
                  <Text style={styles.sessionTypeText}>
                    {allImages[selectedImageIndex].session_type === 'presession'
                      ? 'Pre'
                      : 'Post'}
                  </Text>
                </View>
              </>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={closeImage}>
              <MaterialCommunityIcons
                name="close-circle"
                size={30}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            {allImages.length > 1 && (
              <>
                {selectedImageIndex !== 0 && (
                  <TouchableOpacity
                    style={styles.navButtonLeft}
                    onPress={goToPrevious}>
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={40}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                )}
                {selectedImageIndex !== allImages.length - 1 && (
                  <TouchableOpacity
                    style={styles.navButtonRight}
                    onPress={goToNext}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={40}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    ),
    [isModalVisible, selectedImageIndex, isImageLoading, allImages, styles],
  );

  const renderImageStack = (
    imageList: GalleryImage[],
    sessionType: 'presession' | 'postsession',
  ) => {
    return (
      <View style={styles.stackContainer}>
        <Text style={styles.stackTitle}>
          {sessionType === 'presession' ? 'Pre-session' : 'Post-session'} (
          {imageList.length})
        </Text>
        {imageList.length > 0 ? (
          <TouchableOpacity
            onPress={() => openImage(0, sessionType)}
            style={styles.imageStack}>
            {imageList.slice(0, 1).map((image, index) => (
              <View
                key={image._id}
                style={[
                  styles.imageCard,
                  {
                    zIndex: 3 - index,
                    transform: [
                      {translateY: index * 6},
                      {translateX: index * 6},
                      {rotateZ: `${index * 2}deg`},
                    ],
                  },
                ]}>
                <Image
                  source={{uri: image.sas_url}}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.sessionTypeBadge,
                    sessionType === 'presession'
                      ? styles.preSessionBadge
                      : styles.postSessionBadge,
                  ]}>
                  <Text style={styles.sessionTypeText}>
                    {sessionType === 'presession' ? 'Pre' : 'Post'}
                  </Text>
                </View>
              </View>
            ))}
            {/* Simulated stacked cards with enhanced effect */}
            {imageList.length > 1 && (
              <>
                <View
                  style={[
                    styles.imageCard,
                    {
                      zIndex: 2,
                      transform: [
                        {translateY: 6},
                        {translateX: 6},
                        {rotateZ: '2deg'},
                      ],
                      backgroundColor: theme.colors.card,
                      opacity: 0.7,
                      shadowColor: '#000',
                      shadowOffset: {width: 2, height: 2},
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                    },
                  ]}
                />
                {imageList.length > 2 && (
                  <View
                    style={[
                      styles.imageCard,
                      {
                        zIndex: 1,
                        transform: [
                          {translateY: 12},
                          {translateX: 12},
                          {rotateZ: '4deg'},
                        ],
                        backgroundColor: theme.colors.card,
                        opacity: 0.5,
                        shadowColor: '#000',
                        shadowOffset: {width: 4, height: 4},
                        shadowOpacity: 0.2,
                        shadowRadius: 6,
                      },
                    ]}
                  />
                )}
              </>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={styles.noImagesText}>
            No {sessionType === 'presession' ? 'Pre' : 'Post'} images
          </Text>
        )}
        {imageList.length > 1 &&
          !(sessionType === 'presession'
            ? showAllPreImages
            : showAllPostImages) && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() =>
                sessionType === 'presession'
                  ? setShowAllPreImages(true)
                  : setShowAllPostImages(true)
              }>
              <Text style={styles.showMoreText}>
                Show More ({imageList.length - 1})
              </Text>
            </TouchableOpacity>
          )}
        {(sessionType === 'presession'
          ? showAllPreImages
          : showAllPostImages) &&
          imageList.length > 1 && (
            <View style={styles.expandedImages}>
              {imageList.slice(1).map((image, index) => (
                <TouchableOpacity
                  key={image._id}
                  onPress={() => openImage(index + 1, sessionType)}
                  style={styles.imageCard}>
                  <Image
                    source={{uri: image.sas_url}}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  <View
                    style={[
                      styles.sessionTypeBadge,
                      sessionType === 'presession'
                        ? styles.preSessionBadge
                        : styles.postSessionBadge,
                    ]}>
                    <Text style={styles.sessionTypeText}>
                      {sessionType === 'presession' ? 'Pre' : 'Post'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.notesContainer}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons
              name="image"
              size={24}
              color="#119FB3"
              style={styles.imageIcon}
            />
            <View>
              <View style={styles.titleContainer}>
                <Text style={styles.sectionTitle}>Images</Text>
                <Text style={styles.imageCount}>({images.length})</Text>
              </View>
              <Text style={styles.subTitle}>
                {preImages.length} Pre-session • {postImages.length}{' '}
                Post-session
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.stacksContainer}>
        {renderImageStack(displayedPreImages, 'presession')}
        {renderImageStack(displayedPostImages, 'postsession')}
      </View>
      {renderImageModal}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    header: {
      marginBottom: 12,
    },
    notesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    imageIcon: {
      marginRight: 8,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    imageCount: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
      marginLeft: 8,
    },
    subTitle: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    stacksContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    stackContainer: {
      flex: 1,
      marginHorizontal: 6,
    },
    stackTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    imageStack: {
      position: 'relative',
      height: (SCREEN_WIDTH - 88) / 4 + 18, // Adjusted for smaller size + enhanced stack effect
      width: (SCREEN_WIDTH - 88) / 4,
    },
    imageCard: {
      position: 'absolute',
      width: (SCREEN_WIDTH - 88) / 4,
      aspectRatio: 1,
      borderRadius: 8,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 6,
      backgroundColor: theme.colors.card,
      overflow: 'hidden',
    },
    thumbnail: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    sessionTypeBadge: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    preSessionBadge: {
      backgroundColor: '#4caf4f',
    },
    postSessionBadge: {
      backgroundColor: '#f48c36',
    },
    sessionTypeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '500',
    },
    noImagesText: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
      marginVertical: 8,
    },
    showMoreButton: {
      alignItems: 'center',
      paddingVertical: 6,
      marginTop: 6,
      backgroundColor: 'rgba(17, 159, 179, 0.1)',
      borderRadius: 6,
    },
    showMoreText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#119FB3',
    },
    expandedImages: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: SCREEN_WIDTH,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    fullImage: {
      width: SCREEN_WIDTH * 0.9,
      height: SCREEN_WIDTH * 0.9,
      borderRadius: 12,
    },
    closeButton: {
      position: 'absolute',
      top: 40,
      right: 20,
    },
    navButtonLeft: {
      position: 'absolute',
      left: 20,
      top: '50%',
      transform: [{translateY: -20}],
    },
    navButtonRight: {
      position: 'absolute',
      right: 20,
      top: '50%',
      transform: [{translateY: -20}],
    },
    imageLoadingContainer: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      width: SCREEN_WIDTH * 0.9,
      height: SCREEN_WIDTH * 0.9,
      borderRadius: 12,
    },
    modalBadge: {
      position: 'absolute',
      bottom: 20,
      left: 20,
    },
  });

export default ImageGallery;
