import React from 'react';
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
import RNFS from 'react-native-fs';

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
  const [localDocument, setLocalDocument] = React.useState<DocumentInfo | null>(
    initialDocument || null,
  );
  const [showNameModal, setShowNameModal] = React.useState(false);
  const [pendingDocument, setPendingDocument] =
    React.useState<PendingDocument | null>(null);
  const [documentName, setDocumentName] = React.useState('');
  const [selectedDocumentType, setSelectedDocumentType] =
    React.useState('Medical Report');

  // Document types available for selection
  const documentTypes = [
    'Medical Report',
    'Test Results',
    'Prescription',
    'Insurance',
    'Identity',
    'Other',
  ];

  // Define supported document types - only images and PDFs
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
    if (!fileType && !fileName) return '#666';

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
    return '#666';
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

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
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

      // Handle file copying for Android
      if (Platform.OS === 'android' && result.fileCopyUri) {
        documentUri = result.fileCopyUri;
      }

      const pendingDoc: PendingDocument = {
        uri: documentUri,
        name: documentName,
        type: documentType,
        size: result.size,
      };

      // Set default document name (without extension)
      const nameWithoutExtension = documentName
        .split('.')
        .slice(0, -1)
        .join('.');
      setDocumentName(nameWithoutExtension || documentName);
      setPendingDocument(pendingDoc);
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

    setLocalDocument(documentInfo);
    onDocumentSelected(documentInfo);
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
          {
            text: 'Replace Document',
            onPress: handleDocumentPick,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
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

  return (
    <View style={styles.container}>
      {localDocument ? (
        <TouchableOpacity
          style={styles.documentPreviewContainer}
          onPress={handleDocumentPress}
          disabled={isUploading}>
          <View style={styles.documentPreview}>
            <View style={styles.documentIcon}>
              <Icon
                name={getFileIcon(localDocument.type, localDocument.name)}
                size={40}
                color={getFileIconColor(localDocument.type, localDocument.name)}
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
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleDocumentPick}
          disabled={isUploading}>
          <View style={styles.uploadButtonContent}>
            <MaterialIcons name="attach-file" size={40} color="#007B8E" />
            <Text style={styles.addDocumentText}>Add Document</Text>
            <Text style={styles.supportedFormats}>
              Supported: PDF, Images (JPG, PNG, GIF)
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Document Name and Type Modal */}
      <Modal
        visible={showNameModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Document Information</Text>
              <TouchableOpacity onPress={handleCancelModal}>
                <Icon name="close" size={24} color="#666" />
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
                <Text style={styles.inputLabel}>Document Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={documentName}
                  onChangeText={setDocumentName}
                  placeholder="Enter document name"
                  placeholderTextColor="#999"
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
                onPress={handleConfirmDocument}
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

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#007B8E',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    minHeight: 120,
  },
  uploadButtonContent: {
    alignItems: 'center',
  },
  addDocumentText: {
    marginTop: 8,
    fontSize: 16,
    color: '#007B8E',
    fontWeight: '600',
  },
  supportedFormats: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  documentPreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  documentIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  filePreviewIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
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
    color: '#333',
  },
  filePreviewSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  documentTypeContainer: {
    marginBottom: 20,
  },
  documentTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  documentTypeScrollContainer: {
    paddingRight: 20,
  },
  documentTypeChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDocumentTypeChip: {
    backgroundColor: '#007B8E',
    borderColor: '#007B8E',
  },
  documentTypeChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedDocumentTypeChipText: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
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
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PatientDocumentUploader;
