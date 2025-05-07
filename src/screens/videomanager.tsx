import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { themeColors } from './Theme';

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  description: string;
}

interface Props {
  videos: YouTubeVideo[];
  onChange: (videos: YouTubeVideo[]) => void;
  themeColors: {
    card: string;
    text: string;
    inputBox: string;
    primary: string;
    border: string;
    secondary: string;
  };
}

const YouTubeVideoManager: React.FC<Props> = ({
  videos,
  onChange,
  themeColors,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetModal = () => {
    setVideoTitle('');
    setVideoUrl('');
    setVideoDescription('');
    setEditingId(null);
  };

  const openAddModal = () => {
    resetModal();
    setModalVisible(true);
  };

  const closeModal = () => {
    resetModal();
    setModalVisible(false);
  };

  const handleSaveVideo = () => {
    if (!videoTitle.trim() || !videoUrl.trim()) {
      Alert.alert('Validation Error', 'Please enter both title and URL.');
      return;
    }

    if (!videoUrl.includes('youtube.com/') && !videoUrl.includes('youtu.be/')) {
      Alert.alert('Invalid URL', 'Only YouTube URLs are supported.');
      return;
    }

    const newVideo: YouTubeVideo = {
      id: editingId || Date.now().toString(),
      title: videoTitle,
      url: videoUrl,
      description: videoDescription,
    };

    const updated = editingId
      ? videos.map(v => (v.id === editingId ? newVideo : v))
      : [...videos, newVideo];

    onChange(updated);
    closeModal();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this video?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onChange(videos.filter(v => v.id !== id)),
      },
    ]);
  };

  const handleEdit = (video: YouTubeVideo) => {
    setEditingId(video.id);
    setVideoTitle(video.title);
    setVideoUrl(video.url);
    setVideoDescription(video.description);
    setModalVisible(true);
  };

  return (
    <View>
      {videos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="videocam-outline"
            size={40}
            color="#007B8E"
          />
          <Text style={{color: themeColors.secondary}}>
            No videos added yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View
              style={[
                styles.videoItem,
                {backgroundColor: themeColors.inputBox},
              ]}>
              <View style={styles.videoInfo}>
                <Icon
                  name="logo-youtube"
                  size={24}
                  color="#FF0000"
                  style={styles.iconMargin}
                />
                <View style={styles.videoTextContainer}>
                  <Text style={{color: themeColors.primary, fontWeight: '600'}}>
                    {item.title}
                  </Text>
                  <Text style={{color: themeColors.text}}>{item.url}</Text>
                  {item.description ? (
                    <Text style={{color: themeColors.secondary}}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.videoActions}>
                <TouchableOpacity
                  onPress={() => handleEdit(item)}
                  style={styles.iconMargin}>
                  <Icon
                    name="create-outline"
                    size={20}
                    color={themeColors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Icon name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity
        style={[styles.addButton, {backgroundColor: themeColors.primary}]}
        onPress={openAddModal}
        activeOpacity={0.7}>
        <Icon name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add YouTube Video</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {backgroundColor: themeColors.inputBox},
            ]}>
            <Text style={[styles.modalTitle, {color: themeColors.primary}]}>
              {editingId ? 'Edit Video' : 'Add YouTube Video'}
            </Text>

            <TextInput
              placeholder="Video Title"
              value={videoTitle}
              onChangeText={setVideoTitle}
              style={[
                styles.input,
                {color: themeColors.text, borderColor: themeColors.border},
              ]}
              placeholderTextColor={themeColors.secondary}
            />

            <TextInput
              placeholder="YouTube URL"
              value={videoUrl}
              onChangeText={setVideoUrl}
              style={[
                styles.input,
                {color: themeColors.text, borderColor: themeColors.border},
              ]}
              placeholderTextColor={themeColors.secondary}
              autoCapitalize="none"
              keyboardType="url"
            />

            <TextInput
              placeholder="Description (optional)"
              value={videoDescription}
              onChangeText={setVideoDescription}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                styles.textArea,
                {
                  color: themeColors.text,
                  borderColor: themeColors.border,
                },
              ]}
              placeholderTextColor={themeColors.secondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                activeOpacity={0.7}>
                <Text style={{color: 'white'}}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {backgroundColor: themeColors.primary},
                ]}
                onPress={handleSaveVideo}
                activeOpacity={0.7}>
                <Text style={{color: '#fff'}}>
                  {editingId ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  videoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 12,
  },
  videoInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  videoTextContainer: {
    flex: 1,
  },
  iconMargin: {
    marginRight: 10,
  },
  videoActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  addButton: {
    marginTop: 20,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  modalContainer: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'gray',
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});

export default YouTubeVideoManager;