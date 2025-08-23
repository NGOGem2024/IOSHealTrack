import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../screens/ThemeContext';
import {getTheme} from '../screens/Theme';

interface DocumentInfo {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
  document_name?: string;
  document_type?: string;
}

interface DocumentDisplayProps {
  documents: DocumentInfo[];
  isUploading: boolean;
  onDocumentPress: (document: DocumentInfo, index: number) => void;
}

const DocumentDisplay: React.FC<DocumentDisplayProps> = ({
  documents,
  isUploading,
  onDocumentPress,
}) => {
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

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

  const handleRemoveDocument = (index: number) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          onPress: () => {
            // This would be handled by parent component
            // onDocumentRemoved(index);
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  if (documents.length === 0) {
    return null; // Don't render anything if no documents
  }

  return (
    <View style={styles.container}>
      {documents.map((document, index) => (
        <View key={index} style={styles.documentPreviewContainer}>
          <TouchableOpacity
            style={styles.documentPreview}
            onPress={() => onDocumentPress(document, index)}
            disabled={isUploading}>
            <View style={styles.documentIcon}>
              <Icon
                name={getFileIcon(document.type, document.name)}
                size={40}
                color={getFileIconColor(document.type, document.name)}
              />
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentName} numberOfLines={2}>
                {document.document_name || document.name}
              </Text>
              {document.size && (
                <Text style={styles.documentSize}>
                  {formatFileSize(document.size)}
                </Text>
              )}
              <Text style={styles.documentType}>
                {document.document_type || 'Other'}
              </Text>
            </View>
            {!isUploading && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveDocument(index)}>
                <Icon name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#007B8E" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      marginVertical: 16,
      backgroundColor: theme.colors.card,
    },
    documentPreviewContainer: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
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
  });

export default DocumentDisplay;
