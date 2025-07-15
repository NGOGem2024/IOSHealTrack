import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSession} from '../context/SessionContext';
import {useTheme} from '../screens/ThemeContext';
import {getTheme} from '../screens/Theme';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';

interface PatientDocument {
  _id: string;
  document_name: string;
  document_url: string;
  document_upload_date: string;
  document_type: string;
  uploaded_by: string;
  file_size: number;
  file_extension: string;
}

interface DocumentDeleteDialogProps {
  document: PatientDocument;
  patientId: string;
  onDeleteSuccess: () => void;
  children: React.ReactNode;
}

const DocumentDeleteDialog: React.FC<DocumentDeleteDialogProps> = ({
  document,
  patientId,
  onDeleteSuccess,
  children,
}) => {
  const {session} = useSession();
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteDocument = async () => {
    if (!session.idToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete(
        `/patients/${patientId}/documents/${document._id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        },
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Document deleted successfully');
        onDeleteSuccess();
        setIsDialogVisible(false);
      }
    } catch (error) {
      console.error('Document deletion error:', error);
      handleError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={() => setIsDialogVisible(true)}>
        {children}
      </TouchableOpacity>

      <Modal
        visible={isDialogVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDialogVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="delete" size={24} color="#FF4757" />
              <Text style={styles.title}>Delete Document</Text>
            </View>

            {/* Document name */}
            <Text style={styles.documentName}>{document.document_name}</Text>
            
            {/* Warning */}
            <Text style={styles.warning}>
              This action cannot be undone.
            </Text>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDialogVisible(false)}
                disabled={isDeleting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                onPress={handleDeleteDocument}
                disabled={isDeleting}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxWidth: 400,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    documentName: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 12,
      fontWeight: '500',
    },
    warning: {
      fontSize: 14,
      color: '#666',
      marginBottom: 24,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#F0F0F0',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
    },
    deleteButton: {
      flex: 1,
      backgroundColor: '#FF4757',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    deleteButtonDisabled: {
      backgroundColor: '#FF4757A0',
    },
    deleteText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#FFFFFF',
    },
  });

export default DocumentDeleteDialog;