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

  const showDeleteConfirmation = () => {
    setIsDialogVisible(true);
  };

  const hideDeleteConfirmation = () => {
    if (!isDeleting) {
      setIsDialogVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={showDeleteConfirmation}>
        {children}
      </TouchableOpacity>

      <Modal
        visible={isDialogVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideDeleteConfirmation}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <MaterialIcons
                name="warning"
                size={24}
                color="#FF6B6B"
                style={styles.warningIcon}
              />
              <Text style={styles.modalTitle}>Delete Document</Text>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete this document?
              </Text>
              <Text style={styles.documentName}>
                "{document.document_name}"
              </Text>
              <Text style={styles.warningText}>
                This action cannot be undone.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={hideDeleteConfirmation}
                disabled={isDeleting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  isDeleting && styles.deleteButtonDisabled,
                ]}
                onPress={handleDeleteDocument}
                disabled={isDeleting}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
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
      width: '100%',
      maxWidth: 400,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    warningIcon: {
      marginRight: 12,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    modalContent: {
      marginBottom: 24,
    },
    modalMessage: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 12,
      lineHeight: 24,
    },
    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#119FB3',
      marginBottom: 12,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    warningText: {
      fontSize: 14,
      color: '#FF6B6B',
      fontStyle: 'italic',
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.colors.card === '#FFFFFF' ? '#F5F5F5' : '#444444',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.text + '30',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    deleteButton: {
      flex: 1,
      backgroundColor: '#FF6B6B',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    deleteButtonDisabled: {
      backgroundColor: '#FF6B6B80',
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

export default DocumentDeleteDialog;
