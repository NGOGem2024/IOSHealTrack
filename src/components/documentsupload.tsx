import React from 'react';
import {Keyboard} from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DocumentPicker from 'react-native-document-picker';
import {useTheme} from '../screens/ThemeContext';
import {getTheme} from '../screens/Theme';

interface PatientDocumentUploaderProps {
  onDocumentSelected: (document: DocumentInfo) => void;
  onDocumentRemoved: () => void;
  initialDocument?: DocumentInfo | null;
  isUploading: boolean;
  documentType?: string;
  patientId: string;
}

interface DocumentInfo {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
  document_name?: string;
  document_type?: string;
}

interface DocumentPickerError {
  code?: string;
  message?: string;
}

interface PendingDocument {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
}

const PatientDocumentUploader: React.FC<PatientDocumentUploaderProps> = ({
  onDocumentSelected,
  onDocumentRemoved,
  initialDocument,
  isUploading,
  documentType = 'Other',
  patientId,
}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  const [localDocument, setLocalDocument] = React.useState<DocumentInfo | null>(
    initialDocument || null,
  );
  const [showNameModal, setShowNameModal] = React.useState(false);
  const [pendingDocument, setPendingDocument] =
    React.useState<PendingDocument | null>(null);
  const [documentName, setDocumentName] = React.useState('');
  const [selectedDocumentType, setSelectedDocumentType] =
    React.useState('Medical Report');
  const [uploadType, setUploadType] = React.useState<'document' | 'photo'>(
    'document',
  );

  const documentTypes = [
    'Medical Report',
    'Test Results',
    'Prescription',
    'Insurance',
    'Identity',
    'Other',
  ];

  const supportedTypes = [
    DocumentPicker.types.pdf,
    DocumentPicker.types.images,
  ];

  const getFileIcon = (fileType: string | undefined, fileName: string) => {
    if (!fileType && !fileName) return 'document-outline';
    const type = fileType?.toLowerCase() || '';
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    if (type.includes('pdf') || extension === 'pdf') {
      return 'document-text-outline';
    } else if (
      type.includes('image') ||
      ['jpg', 'jpeg', 'png', 'gif'].includes(extension)
    ) {
      return 'image-outline';
    }
    return 'document-outline';
  };

  const getFileIconColor = (fileType: string | undefined, fileName: string) => {
    if (!fileType && !fileName) return theme.colors.text + '66';
    const type = fileType?.toLowerCase() || '';
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    if (type.includes('pdf') || extension === 'pdf') {
      return '#d32f2f';
    } else if (
      type.includes('image') ||
      ['jpg', 'jpeg', 'png', 'gif'].includes(extension)
    ) {
      return '#f57c00';
    }
    return theme.colors.text + '66';
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes === 0) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDocumentPick = async (isPhotoOnly = false) => {
    try {
      const pickerTypes = isPhotoOnly
        ? [DocumentPicker.types.images]
        : supportedTypes;
      const result = await DocumentPicker.pickSingle({
        type: pickerTypes,
        copyTo: 'cachesDirectory',
      });

      const maxSize = 10 * 1024 * 1024;
      if (result.size && result.size > maxSize) {
        Alert.alert(
          'File Too Large',
          'Please select a file smaller than 10MB',
          [{text: 'OK'}],
        );
        return;
      }

      let documentUri = result.uri;
      let documentName = result.name || 'Unknown Document';
      let documentType = result.type || 'application/octet-stream';

      if (Platform.OS === 'android' && result.fileCopyUri) {
        documentUri = result.fileCopyUri;
      }

      const pendingDoc: PendingDocument = {
        uri: documentUri,
        name: documentName,
        type: documentType,
        size: result.size,
      };

      const nameWithoutExtension = documentName
        .split('.')
        .slice(0, -1)
        .join('.');
      setDocumentName(nameWithoutExtension || documentName);
      setPendingDocument(pendingDoc);
      setUploadType(isPhotoOnly ? 'photo' : 'document');
      setShowNameModal(true);
    } catch (error: unknown) {
      const pickerError = error as DocumentPickerError;
      if (pickerError.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Error', 'Failed to select document');
        console.error('Document picker error:', error);
      }
    }
  };

  const handleConfirmDocument = () => {
    if (!pendingDocument) return;
    if (!documentName.trim()) {
      Alert.alert('Error', 'Please enter a document name');
      return;
    }

    const documentInfo: DocumentInfo = {
      uri: pendingDocument.uri,
      name: pendingDocument.name,
      type: pendingDocument.type,
      size: pendingDocument.size,
      document_name: documentName.trim(),
      document_type: selectedDocumentType,
    };

    onDocumentSelected(documentInfo);
    setLocalDocument(null);
    setShowNameModal(false);
    setPendingDocument(null);
    setDocumentName('');
  };

  const handleCancelModal = () => {
    setShowNameModal(false);
    setPendingDocument(null);
    setDocumentName('');
  };

  const handleRemoveDocument = () => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          onPress: () => {
            setLocalDocument(null);
            onDocumentRemoved();
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  const handleDocumentPress = () => {
    if (localDocument && !isUploading) {
      Alert.alert(
        'Document Options',
        `What would you like to do with "${
          localDocument.document_name || localDocument.name
        }"?`,
        [
          {
            text: 'Remove Document',
            onPress: handleRemoveDocument,
            style: 'destructive',
          },
          {text: 'Replace Document', onPress: () => handleDocumentPick(false)},
          {text: 'Cancel', style: 'cancel'},
        ],
        {cancelable: true},
      );
    }
  };

  const renderDocumentTypeSelector = () => {
    return (
      <View style={styles.documentTypeContainer}>
        <Text style={styles.documentTypeLabel}>Document Type:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.documentTypeScrollContainer}>
          {documentTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.documentTypeChip,
                selectedDocumentType === type &&
                  styles.selectedDocumentTypeChip,
              ]}
              onPress={() => setSelectedDocumentType(type)}>
              <Text
                style={[
                  styles.documentTypeChipText,
                  selectedDocumentType === type &&
                    styles.selectedDocumentTypeChipText,
                ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderUploadButtons = () => {
    return (
      <View style={styles.uploadButtonsContainer}>
        <TouchableOpacity
          style={[styles.uploadButton, styles.documentButton]}
          onPress={() => handleDocumentPick(false)}
          disabled={isUploading}>
          <View style={styles.uploadButtonContent}>
            <MaterialIcons name="attach-file" size={32} color="#007B8E" />
            <Text style={styles.uploadButtonText}>Add Document</Text>
            <Text style={styles.supportedFormats}>PDF, Images</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, styles.photoButton]}
          onPress={() => handleDocumentPick(true)}
          disabled={isUploading}>
          <View style={styles.uploadButtonContent}>
            <MaterialIcons name="photo-camera" size={32} color="#28a745" />
            <Text style={[styles.uploadButtonText, styles.photoButtonText]}>
              Add Photo
            </Text>
            <Text style={styles.supportedFormats}>JPG, PNG, GIF</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {localDocument ? (
        <View>
          <TouchableOpacity
            style={styles.documentPreviewContainer}
            onPress={handleDocumentPress}
            disabled={isUploading}>
            <View style={styles.documentPreview}>
              <View style={styles.documentIcon}>
                <Icon
                  name={getFileIcon(localDocument.type, localDocument.name)}
                  size={40}
                  color={getFileIconColor(
                    localDocument.type,
                    localDocument.name,
                  )}
                />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={2}>
                  {localDocument.document_name || localDocument.name}
                </Text>
                {localDocument.size && (
                  <Text style={styles.documentSize}>
                    {formatFileSize(localDocument.size)}
                  </Text>
                )}
                <Text style={styles.documentType}>
                  {localDocument.document_type}
                </Text>
              </View>
              {!isUploading && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemoveDocument}>
                  <Icon name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#007B8E" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </TouchableOpacity>
          {!isUploading && (
            <View style={styles.addMoreSection}>
              <Text style={styles.addMoreText}>Add More Documents</Text>
              {renderUploadButtons()}
            </View>
          )}
        </View>
      ) : (
        renderUploadButtons()
      )}
      <Modal
        visible={showNameModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {uploadType === 'photo'
                  ? 'Photo Information'
                  : 'Document Information'}
              </Text>
              <TouchableOpacity onPress={handleCancelModal}>
                <Icon name="close" size={24} color={theme.colors.text + '66'} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}>
              {pendingDocument && (
                <View style={styles.filePreview}>
                  <View style={styles.filePreviewIcon}>
                    <Icon
                      name={getFileIcon(
                        pendingDocument.type,
                        pendingDocument.name,
                      )}
                      size={30}
                      color={getFileIconColor(
                        pendingDocument.type,
                        pendingDocument.name,
                      )}
                    />
                  </View>
                  <View style={styles.filePreviewInfo}>
                    <Text style={styles.filePreviewName} numberOfLines={1}>
                      {pendingDocument.name}
                    </Text>
                    {pendingDocument.size && (
                      <Text style={styles.filePreviewSize}>
                        {formatFileSize(pendingDocument.size)}
                      </Text>
                    )}
                  </View>
                </View>
              )}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {uploadType === 'photo' ? 'Photo Name *' : 'Document Name *'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={documentName}
                  onChangeText={setDocumentName}
                  placeholder={
                    uploadType === 'photo'
                      ? 'Enter photo name'
                      : 'Enter document name'
                  }
                  placeholderTextColor={theme.colors.text + '66'}
                />
              </View>
              {renderDocumentTypeSelector()}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !documentName.trim() && styles.disabledButton,
                ]}
                onPress={() => {
                  Keyboard.dismiss(); // 👈 closes keyboard
                  handleConfirmDocument();
                }}
                disabled={!documentName.trim()}>
                <Text style={styles.confirmButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      marginVertical: 16,
      backgroundColor: theme.colors.card,
    },
    uploadButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    uploadButton: {
      flex: 1,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(245, 250, 255, 0.5)'
          : 'rgba(17, 159, 179, 0.05)',
      minHeight: 100,
    },
    documentButton: {
      borderColor: '#007B8E',
    },
    photoButton: {
      borderColor: '#28a745',
    },
    uploadButtonContent: {
      alignItems: 'center',
    },
    uploadButtonText: {
      marginTop: 8,
      fontSize: 14,
      color: '#007B8E',
      fontWeight: '600',
    },
    photoButtonText: {
      color: '#28a745',
    },
    supportedFormats: {
      marginTop: 4,
      fontSize: 11,
      color: theme.colors.text + '66',
      textAlign: 'center',
    },
    addMoreSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    addMoreText: {
      fontSize: 14,
      color: theme.colors.text + '99',
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
    },
    documentPreviewContainer: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    documentPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(245, 250, 255, 0.5)'
          : 'rgba(17, 159, 179, 0.05)',
      position: 'relative',
    },
    documentIcon: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    documentInfo: {
      flex: 1,
      paddingRight: 40,
    },
    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    documentSize: {
      fontSize: 12,
      color: theme.colors.text + '66',
      marginBottom: 2,
    },
    documentType: {
      fontSize: 12,
      color: '#007B8E',
      fontWeight: '500',
    },
    removeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: theme.colors.card + 'E6',
      borderRadius: 12,
      padding: 4,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    uploadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.card + 'E6',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    uploadingText: {
      marginLeft: 12,
      fontSize: 16,
      color: '#007B8E',
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    modalContent: {
      padding: 20,
    },
    filePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(245, 250, 255, 0.5)'
          : 'rgba(17, 159, 179, 0.05)',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    filePreviewIcon: {
      width: 40,
      height: 40,
      backgroundColor: theme.colors.card,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    filePreviewInfo: {
      flex: 1,
    },
    filePreviewName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    filePreviewSize: {
      fontSize: 12,
      color: theme.colors.text + '66',
      marginTop: 2,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.colors.card,
      color: theme.colors.text,
    },
    documentTypeContainer: {
      marginBottom: 20,
    },
    documentTypeLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    documentTypeScrollContainer: {
      paddingRight: 20,
    },
    documentTypeChip: {
      backgroundColor:
        theme.colors.card === '#FFFFFF' ? '#f0f0f0' : 'rgba(17, 159, 179, 0.1)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedDocumentTypeChip: {
      backgroundColor: '#007B8E',
      borderColor: '#007B8E',
    },
    documentTypeChipText: {
      fontSize: 14,
      color: theme.colors.text + '66',
      fontWeight: '500',
    },
    selectedDocumentTypeChipText: {
      color: theme.colors.card,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    cancelButton: {
      flex: 1,
      backgroundColor:
        theme.colors.card === '#FFFFFF' ? '#f0f0f0' : 'rgba(17, 159, 179, 0.1)',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginRight: 10,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text + '66',
    },
    confirmButton: {
      flex: 1,
      backgroundColor: '#007B8E',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginLeft: 10,
      alignItems: 'center',
    },
    disabledButton: {
      backgroundColor: theme.colors.text + '33',
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.card,
    },
  });

export default PatientDocumentUploader;
