import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {StackNavigationProp, StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../../types/types';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Edit,
  Clipboard,
  FileText,
  Stethoscope,
} from 'lucide-react-native';
import {Title, Card, Paragraph} from 'react-native-paper';
import {useSession} from '../../context/SessionContext';
import {handleError} from '../../utils/errorHandler';
import BackTopTab from '../BackTopTab';
import axiosInstance from '../../utils/axiosConfig';

type PatientScreenProps = StackScreenProps<RootStackParamList, 'Patient'>;

interface TherapyPlan {
  therapy_name: string;
  patient_diagnosis: string;
  patient_symptoms: string;
  therapy_duration: string;
  therapy_end: string;
  therapy_start: string;
  patient_therapy_category: string;
  total_amount: string;
  received_amount: string;
  balance: string;
}

interface PatientData {
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  patient_id: string;
  patient_address1: string;
  therapy_plans: TherapyPlan[];
}

const PatientScreen: React.FC<PatientScreenProps> = ({navigation, route}) => {
  const {session} = useSession();
  const {patientId} = route.params;
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!session.idToken || patientData) return;
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(`/patient/${patientId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.idToken,
          },
        });
        setPatientData(response.data.patientData);
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, session.idToken, patientData]);

  const renderPatientInfo = () => {
    if (!patientData) return null;

    return (
      <>
        <Title style={styles.patientName}>
          {patientData.patient_first_name} {patientData.patient_last_name}
        </Title>

        {patientData.patient_email && (
          <View style={styles.content}>
            <Mail size={20} color="white" />
            <Text style={styles.mytext}> {patientData.patient_email}</Text>
          </View>
        )}

        <View style={styles.content}>
          <Phone size={20} color="white" />
          <Text style={styles.mytext}> {patientData.patient_phone}</Text>
        </View>

        {patientData.patient_address1 && (
          <View style={styles.content}>
            <MapPin size={20} color="white" />
            <Text style={styles.mytext}> {patientData.patient_address1}</Text>
          </View>
        )}
      </>
    );
  };

  const renderTherapyPlanCards = () => {
    if (!patientData?.therapy_plans || patientData.therapy_plans.length === 0) {
      return null;
    }

    return patientData.therapy_plans
      .slice()
      .reverse()
      .map((plan, index) => (
        <Card key={index} style={styles.therapyPlanCard}>
          <Card.Content>
            <Title>
              {index === 0
                ? 'Current Therapy Plan'
                : `Past Therapy Plan ${index + 1}`}
            </Title>
            <Paragraph>Name: {plan.therapy_name}</Paragraph>
            <Paragraph>Diagnosis: {plan.patient_diagnosis}</Paragraph>
            <Paragraph>Symptoms: {plan.patient_symptoms}</Paragraph>
            <Paragraph>Duration: {plan.therapy_duration}</Paragraph>
            <Paragraph>
              Start Date: {new Date(plan.therapy_start).toLocaleDateString()}
            </Paragraph>
            <Paragraph>
              End Date: {new Date(plan.therapy_end).toLocaleDateString()}
            </Paragraph>
            <Paragraph>Category: {plan.patient_therapy_category}</Paragraph>
            <Paragraph>Cost: {plan.total_amount}</Paragraph>
            <Paragraph>Received: {plan.received_amount}</Paragraph>
            <Paragraph>Balance: {plan.balance}</Paragraph>
          </Card.Content>
        </Card>
      ));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
        <Text style={styles.loadingText}>Loading patient information...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BackTopTab screenName="Patient" />
      <ScrollView
        style={styles.main}
        contentContainerStyle={styles.mainContent}>
        <View style={styles.profileContainer}>{renderPatientInfo()}</View>

        <View style={styles.botscrview}>
          <Text style={styles.headlist}>Account Overview</Text>
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() =>
                navigation.navigate('UpdatePatient', {
                  patientId: patientId,
                })
              }
              disabled={!patientData}>
              <View style={styles.iconleft}>
                <View style={[styles.iconlist]}>
                  <Edit size={30} color="#65b6e7" />
                </View>
                <Text style={styles.link}>Update Patient</Text>
              </View>
              <ChevronRight size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() =>
                navigation.navigate('CreateTherapyPlan', {
                  patientId: patientId,
                })
              }
              disabled={!patientData}>
              <View style={styles.iconleft}>
                <View style={[styles.iconlist, styles.therapyicon]}>
                  <Clipboard size={30} color="#6A0DAD" />
                </View>
                <Text style={styles.link}>Therapy Plan</Text>
              </View>
              <ChevronRight size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() =>
                navigation.navigate('CreateTherapy', {
                  patientId: patientId,
                })
              }
              disabled={!patientData}>
              <View style={styles.iconleft}>
                <View style={[styles.iconlist, styles.reportsicon]}>
                  <FileText size={30} color="#6e54ef" />
                </View>
                <Text style={styles.link}>Book Appointment</Text>
              </View>
              <ChevronRight size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() =>
                navigation.navigate('UpdateTherapy', {
                  patientId: patientId,
                })
              }
              disabled={!patientData}>
              <View style={styles.iconleft}>
                <View style={[styles.iconlist, styles.therapyicon]}>
                  <Stethoscope size={30} color="#55b55b" />
                </View>
                <Text style={styles.link}>Therapy Session</Text>
              </View>
              <ChevronRight size={24} color="black" />
            </TouchableOpacity>

            {renderTherapyPlanCards()}
          </View>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#119FB3',
  },
  mainContent: {
    flexGrow: 1,
  },
  content: {
    flexDirection: 'row',
    margin: 3,
  },
  iconlist: {
    padding: 7,
    borderRadius: 15,
    backgroundColor: '#d6e6f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mytext: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  botscrview: {
    backgroundColor: 'white',
    width: '100%',
    borderTopLeftRadius: 40,
    marginTop: 20,
    borderTopRightRadius: 40,
    paddingTop: 20,
    flexGrow: 1,
  },
  container: {
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#119FB3',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  link: {
    fontSize: 16,
    marginLeft: 15,
    color: 'black',
    fontWeight: 'bold',
  },
  linkContainer: {
    paddingHorizontal: 10,
    borderRadius: 10,
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row',
    marginBottom: 10,
  },
  content1: {
    margin: 5,
    fontSize: 10,
    marginBottom: -15,
  },
  iconleft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headlist: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 20,
    marginBottom: 0,
  },
  therapyicon: {
    backgroundColor: '#d3edda',
  },
  reportsicon: {
    backgroundColor: '#dddaf2',
  },
  remarksicon: {
    backgroundColor: '#ebe0dc',
  },
  mediaicon: {
    backgroundColor: '#eaddeb',
  },
  backcover: {
    position: 'absolute',
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#119FB3',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  profileContainer: {
    paddingLeft: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  patientName: {
    fontSize: 23,
    color: 'white',
    fontWeight: 'bold',
  },
  therapyPlanCard: {
    marginTop: 20,
    width: '100%',
    elevation: 4,
  },
});

export default PatientScreen;
