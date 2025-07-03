import React, {useState, useMemo, useRef} from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Text,
  ScrollView,
  Animated,
} from 'react-native';
import {useTheme} from './ThemeContext';
import {getTheme} from './Theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface GalleryImage {
  _id: string;
  sas_url: string;
  session_type: string;
  session_number: number;
  uploaded_at: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

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
  const [expandedSessions, setExpandedSessions] = useState<{
    [key: string]: boolean;
  }>({});
  const [activeTab, setActiveTab] = useState<'pre' | 'post'>('pre');

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Group images by session_type and session_number
  const preImages = useMemo(
    () => images.filter(img => img.session_type === 'presession'),
    [images],
  );
  const postImages = useMemo(
    () => images.filter(img => img.session_type === 'postsession'),
    [images],
  );

  // Group images by session number within each type
  const groupedPreImages = useMemo(() => {
    const grouped: {[key: number]: GalleryImage[]} = {};
    preImages.forEach(img => {
      if (!grouped[img.session_number]) {
        grouped[img.session_number] = [];
      }
      grouped[img.session_number].push(img);
    });
    return grouped;
  }, [preImages]);

  const groupedPostImages = useMemo(() => {
    const grouped: {[key: number]: GalleryImage[]} = {};
    postImages.forEach(img => {
      if (!grouped[img.session_number]) {
        grouped[img.session_number] = [];
      }
      grouped[img.session_number].push(img);
    });
    return grouped;
  }, [postImages]);

  // Get sorted session numbers for each type
  const preSessionNumbers = useMemo(
    () =>
      Object.keys(groupedPreImages)
        .map(Number)
        .sort((a, b) => a - b),
    [groupedPreImages],
  );
  const postSessionNumbers = useMemo(
    () =>
      Object.keys(groupedPostImages)
        .map(Number)
        .sort((a, b) => a - b),
    [groupedPostImages],
  );

  // Combine images for modal navigation (maintains order: pre then post)
  const allImages = useMemo(
    () => [...preImages, ...postImages],
    [preImages, postImages],
  );

  // Get session colors for differentiation
  const getSessionColor = (
    sessionNumber: number,
    sessionType: 'presession' | 'postsession',
  ) => {
    const colors =
      sessionType === 'presession'
        ? ['#4caf4f', '#2e7d30', '#66bb6a', '#388e3c', '#81c784']
        : ['#f48c36', '#d84315', '#ff9800', '#f57c00', '#ffb74d'];
    return colors[sessionNumber % colors.length];
  };

  // Tab switching animation
  const switchTab = (tab: 'pre' | 'post') => {
    if (tab === activeTab) return;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: tab === 'pre' ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveTab(tab);
  };

  const toggleSessionExpansion = (
    sessionType: 'presession' | 'postsession',
    sessionNumber: number,
  ) => {
    const key = `${sessionType}_${sessionNumber}`;
    setExpandedSessions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openImage = (
    imageIndex: number,
    sessionType: 'presession' | 'postsession',
    sessionNumber: number,
  ) => {
    // Find the global index of the image
    const sessionImages =
      sessionType === 'presession'
        ? groupedPreImages[sessionNumber]
        : groupedPostImages[sessionNumber];
    const targetImage = sessionImages[imageIndex];
    const globalIndex = allImages.findIndex(img => img._id === targetImage._id);

    setSelectedImageIndex(globalIndex);
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
              <View style={styles.imageContainer}>
                <Image
                  source={{uri: allImages[selectedImageIndex].sas_url}}
                  style={styles.fullImage}
                  resizeMode="contain"
                  onLoad={() => setIsImageLoading(false)}
                />

                {/* Close button positioned over the image */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeImage}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={30}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Session badge */}
                <View
                  style={[
                    styles.sessionTypeBadge,
                    {
                      backgroundColor: getSessionColor(
                        allImages[selectedImageIndex].session_number,
                        allImages[selectedImageIndex].session_type as
                          | 'presession'
                          | 'postsession',
                      ),
                    },
                    styles.modalBadge,
                  ]}>
                  <Text style={styles.sessionTypeText}>
                    {allImages[selectedImageIndex].session_type === 'presession'
                      ? 'Pre'
                      : 'Post'}{' '}
                    - Session {allImages[selectedImageIndex].session_number}
                  </Text>
                </View>
              </View>
            )}

            {/* Navigation buttons */}
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

  const renderSessionGroup = (
    sessionNumber: number,
    sessionImages: GalleryImage[],
    sessionType: 'presession' | 'postsession',
  ) => {
    const expandedKey = `${sessionType}_${sessionNumber}`;
    const isExpanded = expandedSessions[expandedKey];
    const displayedImages = isExpanded
      ? sessionImages
      : sessionImages.slice(0, 3);
    const sessionColor = getSessionColor(sessionNumber, sessionType);

    return (
      <View key={`${sessionType}_${sessionNumber}`} style={styles.sessionGroup}>
        <View style={styles.sessionHeader}>
          <View
            style={[styles.sessionIndicator, {backgroundColor: sessionColor}]}
          />
          <Text style={styles.sessionTitle}>
            Session {sessionNumber} ({sessionImages.length}{' '}
            {sessionImages.length === 1 ? 'image' : 'images'})
          </Text>
          {sessionImages.length > 3 && (
            <TouchableOpacity
              onPress={() => toggleSessionExpansion(sessionType, sessionNumber)}
              style={styles.expandButton}>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#119FB3"
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sessionImagesContainer}>
          {displayedImages.map((image, index) => (
            <TouchableOpacity
              key={image._id}
              onPress={() => openImage(index, sessionType, sessionNumber)}
              style={[
                styles.imageCard,
                {borderColor: sessionColor, borderWidth: 2},
              ]}>
              <Image
                source={{uri: image.sas_url}}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>

        {!isExpanded && sessionImages.length > 3 && (
          <TouchableOpacity
            style={[styles.showMoreButton, {borderColor: sessionColor}]}
            onPress={() => toggleSessionExpansion(sessionType, sessionNumber)}>
            <Text style={[styles.showMoreText, {color: sessionColor}]}>
              Show {sessionImages.length - 3} more images
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSessionTypeContent = (
    sessionType: 'presession' | 'postsession',
    groupedImages: {[key: number]: GalleryImage[]},
    sessionNumbers: number[],
  ) => {
    return (
      <ScrollView style={styles.sessionsScrollView} nestedScrollEnabled={true}>
        {sessionNumbers.length > 0 ? (
          sessionNumbers.map(sessionNumber =>
            renderSessionGroup(
              sessionNumber,
              groupedImages[sessionNumber],
              sessionType,
            ),
          )
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="image-off"
              size={48}
              color="#CCCCCC"
            />
            <Text style={styles.emptyStateText}>
              No {sessionType === 'presession' ? 'pre-session' : 'post-session'}{' '}
              images
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Images will appear here once uploaded
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.mainTitle}>Image Gallery</Text>
            <Text style={styles.subTitle}>
              {images.length} images • {preSessionNumbers.length} sessions
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SCREEN_WIDTH / 2 - 32],
                    }),
                  },
                ],
              },
            ]}
          />

          <TouchableOpacity
            style={[styles.tab, activeTab === 'pre' && styles.activeTab]}
            onPress={() => switchTab('pre')}>
            <Text
              style={[
                styles.tabText,
                {color: activeTab === 'pre' ? '#FFFFFF' : '#119FB3'},
              ]}>
              Pre-session ({preImages.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'post' && styles.activeTab]}
            onPress={() => switchTab('post')}>
            <Text
              style={[
                styles.tabText,
                {color: activeTab === 'post' ? '#FFFFFF' : '#119FB3'},
              ]}>
              Post-session ({postImages.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <Animated.View style={[styles.contentContainer, {opacity: fadeAnim}]}>
        {activeTab === 'pre'
          ? renderSessionTypeContent(
              'presession',
              groupedPreImages,
              preSessionNumbers,
            )
          : renderSessionTypeContent(
              'postsession',
              groupedPostImages,
              postSessionNumbers,
            )}
      </Animated.View>

      {renderImageModal}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      margin: 16,
      marginBottom: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    imageIcon: {
      marginRight: 16,
    },
    mainTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 2,
    },
    subTitle: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.6,
    },
    tabContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.card,
    },
    tabBackground: {
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgb(240, 246, 255)'
          : 'rgba(17, 159, 179, 0.1)',
      borderRadius: 12,
      padding: 4,
      position: 'relative',
      flexDirection: 'row',
    },

    tabIndicator: {
      position: 'absolute',
      top: 4,
      left: 4,
      width: SCREEN_WIDTH / 2 - 32,
      height: 40,
      backgroundColor: '#119FB3',
      borderRadius: 8,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    activeTab: {
      // Styling handled by indicator
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
    },
    contentContainer: {
      flex: 1,
      padding: 12,
    },
    sessionsScrollView: {
      flex: 1,
    },
    sessionGroup: {
      backgroundColor:  theme.colors.card === '#FFFFFF'
          ? 'rgb(240, 246, 255)'
          : 'rgba(17, 159, 179, 0.1)',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    sessionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sessionIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    sessionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    expandButton: {
      padding: 4,
    },
    sessionImagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    imageCard: {
      width: (SCREEN_WIDTH - 120) / 3,
      aspectRatio: 1,
      borderRadius: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      backgroundColor: theme.colors.card,
      overflow: 'hidden',
    },
    thumbnail: {
      width: '100%',
      height: '100%',
      borderRadius: 6,
    },
    sessionTypeBadge: {
      position: 'absolute',
      bottom: 4,
      left: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    sessionTypeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#9CA3AF',
      marginTop: 12,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: 4,
    },
    showMoreButton: {
      alignItems: 'center',
      paddingVertical: 8,
      marginTop: 8,
      backgroundColor: 'rgba(17, 159, 179, 0.1)',
      borderRadius: 6,
      borderWidth: 1,
    },
    showMoreText: {
      fontSize: 12,
      fontWeight: '600',
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
    imageContainer: {
      width: SCREEN_WIDTH * 0.95,
      height: SCREEN_HEIGHT * 0.7,
      position: 'relative',
      backgroundColor: '#000',
      borderRadius: 12,
      overflow: 'hidden',
    },
    fullImage: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 15,
      padding: 5,
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
      width: SCREEN_WIDTH * 0.95,
      height: SCREEN_HEIGHT * 0.7,
      borderRadius: 12,
    },
    modalBadge: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
  });
export default ImageGallery;
