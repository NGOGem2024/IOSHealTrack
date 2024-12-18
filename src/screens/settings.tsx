import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import GoogleSignInButton from '../components/googlebutton';
import axiosInstance from '../utils/axiosConfig';
import axios from 'axios';
import {handleError} from '../utils/errorHandler';
import BackTabTop from './BackTopTab';

interface SessionInfo {
  lastUpdated?: string;
  updatedBy?: string;
  organization_name?: string;
  doctor_name?: string;
}

const SettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  const fetchSessionStatus = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/get/googlestatus`);
      if (response.data) {
        setSessionInfo(response.data);
      } else {
        setSessionInfo(null);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log('Error fetching status:', error.response?.status);
        setSessionInfo(null);
      } else {
        handleError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
  }, []);

  const handleSignInSuccess = async () => {
    console.log('Google Sign-In successful');
    await fetchSessionStatus();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <BackTabTop screenName="Settings" />
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google Calendar Integration</Text>

          {sessionInfo ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Doctor:</Text>
                <Text style={styles.value}>{sessionInfo.doctor_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Organization:</Text>
                <Text style={styles.value}>
                  {sessionInfo.organization_name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Last Synced:</Text>
                <Text style={styles.value}>
                  {formatDate(sessionInfo.lastUpdated || '')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Synced By:</Text>
                <Text style={styles.value}>{sessionInfo.updatedBy}</Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.syncButton}
                  onPress={handleSignInSuccess}>
                  <Text style={styles.buttonText}>Update Integration</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchSessionStatus}>
                  <Text style={styles.buttonText}>Refresh Status</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.signInContainer}>
              <Text style={styles.noteText}>
                Connect your Google Calendar to sync appointments
              </Text>
              <GoogleSignInButton onSignInSuccess={handleSignInSuccess} />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  syncButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#119FB3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    alignItems: 'center',
    gap: 15,
  },
  noteText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default SettingsScreen;
