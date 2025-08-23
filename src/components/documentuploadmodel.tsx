import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  TouchableWithoutFeedback, // Add this import
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';
import {useTheme} from '../screens/ThemeContext';
import {getTheme} from '../screens/Theme';
import {useSession} from '../context/SessionContext';
import axiosInstance from '../utils/axiosConfig';

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

interface DocumentSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onDocumentConfirmed: (document: DocumentInfo) => void;
  patientId: string;
}

const DocumentSetupModal: React.FC<DocumentSetupModalProps> = ({
  visible,
  onClose,
  onDocumentConfirmed,
  patientId,
}) => {
  const {theme} = useTheme();
  const {session} = useSession();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  const [pendingDocument, setPendingDocument] =
    useState<PendingDocument | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] =
    useState('Medical Report');
  const [isUploading, setIsUploading] = useState(false);

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

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: supportedTypes,
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
    } catch (error: unknown) {
      const pickerError = error as DocumentPickerError;
      if (pickerError.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Error', 'Failed to select document');
        console.error('Document picker error:', error);
      }
    }
  };

  const handleConfirmDocument = async () => {
    if (!pendingDocument || !session.idToken) return;
    if (!documentName.trim()) {
      Alert.alert('Error', 'Please enter a document name');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      // Add file to form data
      formData.append('file', {
        uri: pendingDocument.uri,
        type: pendingDocument.type,
        name: pendingDocument.name,
      } as any);

      // Add other required fields
      formData.append('document_name', documentName.trim());
      formData.append('document_type', selectedDocumentType);

      const response = await axiosInstance.post(
        `/upload-document/${patientId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Document uploaded successfully');

        // Call the callback to notify parent component
        const documentInfo: DocumentInfo = {
          uri: pendingDocument.uri,
          name: pendingDocument.name,
          type: pendingDocument.type,
          size: pendingDocument.size,
          document_name: documentName.trim(),
          document_type: selectedDocumentType,
        };

        onDocumentConfirmed(documentInfo);
        resetModal();
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setPendingDocument(null);
    setDocumentName('');
    setSelectedDocumentType('Medical Report');
    setIsUploading(false);
  };

  const handleClose = () => {
    if (isUploading) {
      Alert.alert(
        'Upload in Progress',
        'Please wait for the upload to complete',
        [{text: 'OK'}],
      );
      return;
    }
    resetModal();
    onClose();
  };

  // Enhanced document type selection handler
  const handleDocumentTypeSelection = (type: string) => {
    // Dismiss keyboard first if it's visible
    Keyboard.dismiss();
    // Use setTimeout to ensure keyboard dismissal completes before state update
    setTimeout(() => {
      setSelectedDocumentType(type);
    }, 50);
  };

  const renderDocumentTypeSelector = () => {
    return (
      <View style={styles.documentTypeContainer}>
        <Text style={styles.documentTypeLabel}>Document Type:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.documentTypeScrollContainer}
          keyboardShouldPersistTaps="handled" // This is crucial for handling taps when keyboard is visible
        >
          {documentTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.documentTypeChip,
                selectedDocumentType === type &&
                  styles.selectedDocumentTypeChip,
              ]}
              onPress={() => handleDocumentTypeSelection(type)}
              disabled={isUploading}
              activeOpacity={0.7} // Add visual feedback
            >
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Document</Text>
              <TouchableOpacity onPress={handleClose} disabled={isUploading}>
                <Icon name="close" size={24} color={theme.colors.text + '66'} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled" // Important for handling taps when keyboard is visible
            >
              {!pendingDocument ? (
                // Document selection phase - SIMPLIFIED
                <View>
                  <Text style={styles.instructionText}>
                    Select a document or photo to upload
                  </Text>

                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleDocumentPick}
                    disabled={isUploading}>
                    <View style={styles.uploadButtonContent}>
                      <Icon
                        name="cloud-upload-outline"
                        size={48}
                        color="#007B8E"
                      />
                      <Text style={styles.uploadButtonText}>Choose File</Text>
                      <Text style={styles.supportedFormats}>
                        PDF, Images (Max 10MB)
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                // Document configuration phase
                <View>
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
                    {!isUploading && (
                      <TouchableOpacity
                        onPress={() => setPendingDocument(null)}
                        style={styles.removeButton}>
                        <Icon name="close-circle" size={20} color="#ff4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Document Name *</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isUploading && styles.disabledInput,
                      ]}
                      value={documentName}
                      onChangeText={setDocumentName}
                      placeholder="Enter document name"
                      placeholderTextColor={theme.colors.text + '66'}
                      editable={!isUploading}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>

                  {renderDocumentTypeSelector()}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  isUploading && styles.disabledButton,
                ]}
                onPress={handleClose}
                disabled={isUploading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              {pendingDocument && (
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!documentName.trim() || isUploading) &&
                      styles.disabledButton,
                  ]}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleConfirmDocument();
                  }}
                  disabled={!documentName.trim() || isUploading}>
                  {isUploading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.confirmButtonText}>Uploading...</Text>
                    </View>
                  ) : (
                    <Text style={styles.confirmButtonText}>Upload</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
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
    instructionText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    uploadButton: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.colors.card === '#FFFFFF'
          ? 'rgba(245, 250, 255, 0.5)'
          : 'rgba(17, 159, 179, 0.05)',
      borderColor: '#007B8E',
    },
    uploadButtonContent: {
      alignItems: 'center',
    },
    uploadButtonText: {
      marginTop: 12,
      fontSize: 18,
      color: '#007B8E',
      fontWeight: '600',
    },
    supportedFormats: {
      marginTop: 8,
      fontSize: 12,
      color: theme.colors.text + '66',
      textAlign: 'center',
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
    removeButton: {
      padding: 4,
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
    disabledInput: {
      backgroundColor: theme.colors.text + '10',
      color: theme.colors.text + '66',
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
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

export default DocumentSetupModal;
