import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  useColorScheme,
  Appearance,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon3 from 'react-native-vector-icons/FontAwesome';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import BackTabTop from './BackTopTab';
import axiosInstance from '../utils/axiosConfig';
import {handleError} from '../utils/errorHandler';
import {RootTabParamList} from '../types/types';
import WhatsAppReminderButton from './WhatsappReminder';

// Define your theme colors
const themeColors = {
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    primary: '#007B8E',
    text: '#333333',
    secondary: '#666666',
    border: '#E0E0E0',
  },
  dark: {
    background: '#161c24',
    card: '#272d36',
    primary: '#007B8E',
    text: '#f3f4f6',
    secondary: '#cccccc',
    border: '#3d4654',
  },
};

type Appointment = {
  _id: string;
  plan_id: string;
  patient_id: string;
  therepy_type: string;
  therepy_link?: string;
  therepy_start_time: string;
  therepy_end_time?: string;
  therepy_date: string;
  patient_name?: string;
  doctor_name?: string;
  status?: string;
  is_consultation?: boolean;
};

type DayAppointments = {
  date: Date;
  appointments: Appointment[];
};

const HealTrackConnectScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = React.useState(colorScheme === 'dark');
  const [appointmentsData, setAppointmentsData] =
    React.useState<DayAppointments[]>([]);
  const [loadingAppointments, setLoadingAppointments] = React.useState(true);
  const [isFabOpen, setIsFabOpen] = React.useState(false);
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  React.useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const currentColors = themeColors[isDarkMode ? 'dark' : 'light'];

  const loadAppointmentsPreview = React.useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 2);

      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];

      const response = await axiosInstance.post('/get/appointments/dates', {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });

      const appointmentsResponse = response.data?.appointments || {};
      const dayArray: DayAppointments[] = [];
      const cursor = new Date(startDate);
      const end = new Date(endDate);

      while (cursor <= end) {
        const dateKey = cursor.toISOString().split('T')[0];
        dayArray.push({
          date: new Date(cursor),
          appointments: appointmentsResponse[dateKey] || [],
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      setAppointmentsData(dayArray);
    } catch (error) {
      handleError(error);
      setAppointmentsData([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAppointmentsPreview();
    }, [loadAppointmentsPreview]),
  );

  const formatDateLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const navigateToAllAppointments = () => {
    navigation.navigate('AllAppointmentsStack');
  };

  const renderNoAppointments = (key: string) => (
    <View
      key={key}
      style={[
        styles.noAppointmentsCard,
        {backgroundColor: currentColors.card},
      ]}>
      <Icon name="calendar-outline" size={36} color={currentColors.primary} />
      <Text style={[styles.noAppointmentsTitle, {color: currentColors.text}]}>
        No appointments scheduled
      </Text>
      <Text
        style={[
          styles.noAppointmentsSubtitle,
          {color: currentColors.secondary},
        ]}>
        Your appointments for this day will appear here.
      </Text>
    </View>
  );

  const cardBackgroundColor = isDarkMode ? '#233436' : '#FFFFFF';

  // Skeletons (similar approach to AllAppointments)
  const SkeletonAppointmentCard: React.FC = () => {
    const stylesSk = getSkeletonStyles(isDarkMode);
    const fadeAnim = React.useRef(new Animated.Value(0.3)).current;
    React.useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {toValue: 0.7, duration: 800, useNativeDriver: true}),
          Animated.timing(fadeAnim, {toValue: 0.3, duration: 800, useNativeDriver: true}),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }, [fadeAnim]);
    return (
      <Animated.View style={[stylesSk.appointmentItem, {opacity: fadeAnim}]}>
        <View style={stylesSk.appointmentContent}>
          <View style={stylesSk.timeColumn}>
            <View style={stylesSk.timeText} />
            <View style={stylesSk.iconCircle} />
          </View>
          <View style={stylesSk.infoColumn}>
            <View style={stylesSk.typeLine} />
            <View style={stylesSk.nameLine} />
            <View style={stylesSk.doctorLine} />
            <View style={stylesSk.statusPill} />
          </View>
          <View style={stylesSk.buttonPill} />
        </View>
      </Animated.View>
    );
  };

  const SkeletonDaySection: React.FC = () => {
    const stylesSk = getSkeletonStyles(isDarkMode);
    return (
      <View style={stylesSk.daySection}>
        <View style={stylesSk.dayHeader} />
        <SkeletonAppointmentCard />
        <SkeletonAppointmentCard />
      </View>
    );
  };

  return (
    <View
      style={[styles.container, {backgroundColor: '#007B8E'}]}>
      <StatusBar
        backgroundColor={currentColors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <BackTabTop screenName="HealTrack-Connect" />
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          {paddingBottom: isFabOpen ? 180 : 120},
        ]}>
        <View style={styles.featuresSection}>

          <View style={styles.appointmentsSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Icon3
                  name="calendar"
                  size={20}
                  color="#FFFFFF"
                  style={styles.sectionHeaderIcon}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.sectionSubTitle]}>
                  Appointments via HealTrack
                </Text>
              </View>
              <TouchableOpacity
                onPress={navigateToAllAppointments}
                style={styles.viewAllButton}>
                <Text
                  style={[styles.viewAllText]}>
                  View All
                </Text>
                <Icon
                  name="chevron-forward"
                  size={16}
                  color="#B7C7C9"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.sectionDivider} />

            {loadingAppointments ? (
              <View>
                <SkeletonDaySection />
                <SkeletonDaySection />
                <SkeletonDaySection />
              </View>
            ) : (
              appointmentsData.map(day => (
                <View key={day.date.toISOString()} style={styles.daySection}>
                  <Text
                    style={[
                      styles.dayLabel,
                      {color: isDarkMode ? 'white' : 'black'},
                    ]}>
                    {formatDateLabel(day.date)}
                  </Text>
                  {day.appointments.length === 0
                    ? renderNoAppointments(day.date.toISOString())
                    : day.appointments.map(appointment => (
                        <View
                          key={appointment._id}
                          style={[
                            styles.previewAppointmentCard,
                            {backgroundColor: cardBackgroundColor},
                          ]}>
                          <View
                            style={[
                              styles.previewTimeColumn,
                              {
                                borderRightColor: isDarkMode
                                  ? '#669191'
                                  : '#E0E0E0',
                              },
                            ]}>
                            <Text
                              style={[
                                styles.previewTimeText,
                              ]}>
                              {appointment.therepy_start_time}
                            </Text>
                            <View
                              style={[
                                styles.previewIconCircle,
                                {backgroundColor: isDarkMode ? '#1f2a30' : '#E8F6F8'},
                              ]}>
                              <Icon
                                name="person"
                                size={20}
                                color={currentColors.primary}
                              />
                            </View>
                          </View>
                          <View style={styles.previewInfoColumn}>
                            <View style={styles.previewTypeRow}>
                              <Text
                                style={[
                                  styles.previewTherapyType,
                                  {color: currentColors.secondary},
                                ]}>
                                {appointment.therepy_type}
                              </Text>
                              {appointment.is_consultation && (
                                <View style={styles.consultationBadge}>
                                  <Text style={styles.consultationBadgeText}>
                                    Consultation
                                  </Text>
                                </View>
                              )}
                            </View>
                            {appointment.patient_name && (
                              <Text
                                style={[
                                  styles.previewPatientText,
                                  {color: currentColors.text},
                                ]}
                                numberOfLines={1}>
                                {appointment.patient_name}
                              </Text>
                            )}
                            {appointment.doctor_name && (
                              <Text
                                style={[
                                  styles.previewDoctorText,
                                  {color: isDarkMode ? '#4DD0E1' : '#119FB3'},
                                ]}
                                numberOfLines={1}>
                                Dr. {appointment.doctor_name}
                              </Text>
                            )}
                            {appointment.status && (
                              <View
                                style={[
                                  styles.statusBadge,
                                  {
                                    backgroundColor:
                                      appointment.status?.toLowerCase() === 'scheduled'
                                        ? '#119FB3'
                                        : appointment.status?.toLowerCase() ===
                                          'completed'
                                        ? '#4CAF50'
                                        : '#6B7280',
                                  },
                                ]}>
                                <Text style={styles.statusBadgeText}>
                                  {appointment.status?.toLowerCase() === 'completed'
                                    ? 'Completed'
                                    : appointment.status}
                                </Text>
                              </View>
                            )}
                          </View>
                          {(!appointment.status ||
                            appointment.status.toLowerCase() !== 'completed') && (
                            <View style={styles.previewStartWrapper}>
                              <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.previewStartButton}
                                onPress={() => {
                                  if (appointment.is_consultation) {
                                    (navigation as any).navigate('CreateConsultation', {
                                      patientId: appointment.patient_id,
                                      appointmentId: appointment._id,
                                    });
                                  } else {
                                    (navigation as any).navigate('planDetails', {
                                      planId: appointment.plan_id,
                                    });
                                  }
                                }}>
                                <Icon name="play" size={14} color="black" />
                                <Text style={styles.previewStartText}>Start</Text>
                              </TouchableOpacity>
                              <WhatsAppReminderButton
                                sessionId={appointment._id}
                                patientName={appointment.patient_name || 'Patient'}
                                isDarkMode={isDarkMode}
                                size="medium"
                                onSuccess={() => {}}
                              />
                            </View>
                          )}
                        </View>
                      ))}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
      {isFabOpen && (
        <View style={styles.fabActionsContainer}>
          <TouchableOpacity
            style={[styles.fabActionButton, {backgroundColor: '#233436'}]}
            onPress={() => {
              console.log('Collections pressed');
              setIsFabOpen(false);
            }}>
            <Icon name="wallet-outline" size={20} color="#4DD0E1" />
            <Text style={[styles.fabActionText, {color: '#FFFFFF'}]}>
              Collections
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabActionButton, {backgroundColor: '#233436'}]}
            onPress={() => {
              console.log('Invoices via HealTrack pressed');
              setIsFabOpen(false);
            }}>
            <Icon name="receipt-outline" size={20} color="#4DD0E1" />
            <Text style={[styles.fabActionText, {color: '#FFFFFF'}]}>
              Invoices via HealTrack
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.fabButton,
          {
            backgroundColor: '#0FB5C6',
          },
        ]}
        activeOpacity={0.9}
        onPress={() => setIsFabOpen(prev => !prev)}>
        <Icon name={isFabOpen ? 'close' : 'add'} size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  featuresSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionHeaderIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSubTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  appointmentsSection: {
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginLeft: 'auto',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B7C7C9',
    marginRight: 2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  loadingIndicator: {
    marginVertical: 16,
  },
  daySection: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  previewAppointmentCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    minHeight: 110,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewTimeColumn: {
    width: 68,
    alignItems: 'center',
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
  },
  previewTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  previewIconCircle: {
    marginTop: 8,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfoColumn: {
    flex: 1,
  },
  previewTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  previewStartWrapper: {
    backgroundColor: '#aeebbd',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'center',
  },
  previewStartButton: {
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewStartText: {
    color: 'black',
    fontSize: 15,
    fontWeight: '600',
  },
  previewTherapyType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 0,
  },
  previewPatientText: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 2,
  },
  previewDoctorText: {
    fontSize: 14,
    color: '#119FB3',
    marginBottom: 8,
  },
  consultationBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 0,
    alignSelf: 'flex-start',
  },
  consultationBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noAppointmentsCard: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 8,
  },
  noAppointmentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noAppointmentsSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  fabButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fabActionsContainer: {
    position: 'absolute',
    right: 24,
    bottom: 110,
    alignItems: 'flex-end',
    gap: 12,
  },
  fabActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  fabActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

// Skeleton styles
const getSkeletonStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    daySection: {
      marginBottom: 16,
    },
    dayHeader: {
      height: 20,
      width: 110,
      borderRadius: 4,
      marginBottom: 12,
      marginHorizontal: 16,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
    },
    appointmentItem: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: isDarkMode ? '#233436' : '#FFFFFF',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDarkMode ? 0.4 : 0.1,
      shadowRadius: 4,
      borderColor: isDarkMode ? '#119FB3' : 'white',
      borderWidth: 1,
      height: 110,
    },
    appointmentContent: {
      flex: 1,
      padding: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timeColumn: {
      alignItems: 'center',
      marginRight: 10,
      paddingRight: 10,
      borderRightWidth: 1,
      borderRightColor: isDarkMode ? '#669191' : '#E0E0E0',
      height: 70,
      justifyContent: 'space-between',
    },
    timeText: {
      width: 42,
      height: 16,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 4,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#1f2a30' : '#E8F6F8',
    },
    infoColumn: {
      flex: 1,
      height: 70,
      justifyContent: 'space-between',
    },
    typeLine: {
      width: '50%',
      height: 16,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 4,
      marginBottom: 6,
    },
    nameLine: {
      width: '70%',
      height: 14,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 4,
    },
    doctorLine: {
      width: '60%',
      height: 14,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 4,
      marginTop: 6,
    },
    statusPill: {
      width: 90,
      height: 22,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
      borderRadius: 12,
      marginTop: 8,
    },
    buttonPill: {
      width: 110,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
    },
  });

export default HealTrackConnectScreen;


