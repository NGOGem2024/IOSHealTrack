import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import {PieChart, BarChart} from 'react-native-chart-kit';
import {useSession} from '../context/SessionContext';
import {useTheme} from './ThemeContext';
import BackTabTop from './BackTopTab';
import axiosInstance from '../utils/axiosConfig';
import {getTheme} from './Theme';
import DoctorLeaderboard from './LeaderReport';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Types for Referral Data
interface ReferralData {
  doctor_name: string;
  referral_count: number;
}

// Type for Practo Data
interface PractoData {
  year: number;
  month: string;
  practo: number;
  total: number;
}

// Type for Social Reference Data
interface SocialReferenceData {
  source: string;
  count: number;
}

// Type for Referral Details
interface ReferralDetailsItem {
  _id: string;
  count: number;
}
interface BarPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface ReferralDetailsResponse {
  success: boolean;
  month: number;
  year: number;
  referralDetailsCount: ReferralDetailsItem[];
}

// Skeleton UI component for loading state
const SkeletonUI = ({
  theme,
}: {
  theme: {name: 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark'};
}) => {
  // Get styles with the current theme
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}>
      {/* Practo Summary Skeleton */}
      <View style={[styles.chartCard, styles.practoSummaryContainer]}>
        <View style={styles.skeletonTitle} />
        <View style={styles.practoSummaryDetails}>
          <View style={styles.practoSummaryItem}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonValue} />
          </View>
          <View style={styles.practoSummaryItem}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonValue} />
          </View>
        </View>
      </View>

      {/* Doctor Leaderboard Skeleton */}
      <View style={[styles.chartCard, {width: '100%', marginBottom: 20}]}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonSubtitle} />

        {/* Fake leaderboard entries */}
        {[1, 2, 3].map(item => (
          <View key={item} style={styles.leaderboardRow}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonText} />
            <View style={styles.skeletonSmallText} />
          </View>
        ))}
      </View>

      {/* Referral Details Skeleton */}
      <View style={[styles.chartCard, styles.referralDetailsCard]}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonSubtitle} />

        <View style={styles.referralDetailsHeader}>
          <View style={[styles.skeletonHeaderText, {flex: 2}]} />
          <View style={[styles.skeletonHeaderText, {flex: 1}]} />
        </View>

        {/* Fake referral details */}
        {[1, 2, 3, 4].map(item => (
          <View key={item} style={styles.referralDetailsRow}>
            <View style={[styles.skeletonText, {flex: 2}]} />
            <View style={[styles.skeletonSmallText, {flex: 1}]} />
          </View>
        ))}
      </View>

      {/* Referrals Chart Skeleton */}
      <View style={[styles.chartCard, styles.referralChartCard]}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonSubtitle} />

        {/* Pie Chart Skeleton */}
        <View style={styles.skeletonPieChart}>
          <View style={styles.skeletonPieInner} />
        </View>

        {/* Legend Skeleton */}
        <View style={styles.customLegendContainer}>
          {[1, 2, 3].map(item => (
            <View key={item} style={styles.legendItem}>
              <View style={styles.skeletonLegendBox} />
              <View style={styles.skeletonLegendText} />
            </View>
          ))}
        </View>
      </View>

      {/* Social Reference Bar Chart Skeleton */}
      <View style={[styles.chartCard, styles.socialReferenceChartCard]}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonSubtitle} />

        {/* Bar Chart Skeleton */}
        <View style={styles.skeletonBarChart}>
          {[1, 2, 3, 4].map(item => (
            <View key={item} style={styles.skeletonBar} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const ReportsScreen: React.FC = () => {
  // State Management
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [referralData, setReferralData] = useState<ReferralData[]>([]);
  const [practoData, setPractoData] = useState<PractoData[]>([]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [socialReferenceData, setSocialReferenceData] = useState<
    SocialReferenceData[]
  >([]);
  const [referralDetails, setReferralDetails] = useState<ReferralDetailsItem[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  // Context Hooks
  const {session} = useSession();

  // Screen Dimensions
  const screenWidth = Dimensions.get('window').width;

  // Months Array
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getSocialReferenceIcon = (source: string) => {
    const sourceLower = source.toLowerCase();

    if (sourceLower.includes('google')) {
      return <FontAwesome name="google" size={17} color="#007b8e" />;
    }
    if (sourceLower.includes('facebook')) {
      return <FontAwesome name="facebook" size={17} color="#007b8e" />;
    }
    if (sourceLower.includes('instagram')) {
      return <FontAwesome name="instagram" size={17} color="#007b8e" />;
    }
    if (sourceLower.includes('twitter') || sourceLower.includes('x')) {
      return <FontAwesome name="twitter" size={17} color="#007b8e" />;
    }
    if (sourceLower.includes('whatsapp')) {
      return <FontAwesome name="whatsapp" size={17} color="#007b8e" />;
    }
    if (sourceLower.includes('linkedin')) {
      return <FontAwesome name="linkedin" size={17} color="#0077B5" />;
    }
    if (sourceLower.includes('youtube')) {
      return <FontAwesome name="youtube" size={17} color="#007b8e" />;
    }

    // Default icon for unknown sources
    return (
      <MaterialCommunityIcons name="web" size={20} color={theme.colors.text} />
    );
  };
  // Years Array (last 5 years)
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  // Close dropdowns when tapping outside
  const closeAllDropdowns = () => {
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  // Check if any dropdown is open
  const isAnyDropdownOpen = showMonthPicker || showYearPicker;

  const fetchReportData = async () => {
    if (!session.is_admin) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch Referral Data
      const referralResponse = await axiosInstance.get(
        `/get/refrells?month=${selectedMonth}&year=${selectedYear}`,
      );

      const transformedReferralData: ReferralData[] =
        referralResponse.data.referralDetails.map(
          (detail: {_id: string; referralCount: number}) => ({
            doctor_name:
              detail._id === 'Patient Reference'
                ? 'Patient Reference'
                : detail._id === 'Hospital Reference'
                ? 'Hospital Reference'
                : detail._id,
            referral_count: detail.referralCount,
          }),
        );

      // Fetch Practo Data
      const practoResponse = await axiosInstance.get(
        `/get/practo?month=${selectedMonth}&year=${selectedYear}`,
      );

      const transformedPractoData: PractoData[] =
        practoResponse.data.data.pivotArray.filter(
          (item: PractoData) =>
            item.year === selectedYear &&
            item.month === months[selectedMonth - 1].slice(0, 3),
        );

      // Fetch Social Reference Data
      const socialReferenceResponse = await axiosInstance.get(
        `/get/socialrefrence?month=${selectedMonth}&year=${selectedYear}`,
      );

      const transformedSocialReferenceData: SocialReferenceData[] =
        Object.entries(
          socialReferenceResponse.data.data.pivotArray.find(
            (item: any) =>
              item.year === selectedYear &&
              item.month === months[selectedMonth - 1].slice(0, 3),
          ) || {},
        )
          .filter(
            ([key, value]) =>
              key !== 'year' &&
              key !== 'month' &&
              key !== 'total' &&
              typeof value === 'number' &&
              key !== '(blank)',
          )
          .map(([source, count]) => ({
            source: source === '(blank)' ? 'Unspecified' : source,
            count: count as number,
          }));

      // Fetch Referral Details
      const referralDetailsResponse =
        await axiosInstance.get<ReferralDetailsResponse>(
          `/get/referralDetails?month=${selectedMonth}&year=${selectedYear}`,
        );

      setReferralData(transformedReferralData);
      setPractoData(transformedPractoData);
      setSocialReferenceData(transformedSocialReferenceData);
      setReferralDetails(referralDetailsResponse.data.referralDetailsCount);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data on month/year change
  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear]);

  // Modern color palette
  const modernColors = [
    '#007b8e', // Soft Blue
    '#2ecc71', // Emerald Green
    '#e74c3c', // Vibrant Red
    '#f39c12', // Warm Orange
    '#9b59b6', // Soft Purple
    '#3498db', // Bright Blue
    '#1abc9c', // Turquoise
  ];

  // Prepare Pie Chart Data for Referrals
  const referralPieChartData = referralData.map((item, index) => ({
    name: item.doctor_name,
    population: item.referral_count,
    color: modernColors[index % modernColors.length],
    legendFontColor: theme.name === 'dark' ? '#FFFFFF' : '#2c3e50',
    legendFontSize: 11,
  }));

  // Render only for admin
  if (!session.is_admin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access Denied</Text>
      </View>
    );
  }

  // Custom Legend Component for Referrals
  const ReferralLegend = () => (
    <View style={styles.customLegendContainer}>
      {referralPieChartData.map((entry, index) => (
        <View key={index} style={styles.legendItem}>
          <View
            style={[styles.legendColorBox, {backgroundColor: entry.color}]}
          />
          <Text style={styles.legendText}>
            {entry.name} ({entry.population})
          </Text>
        </View>
      ))}
    </View>
  );

  // Practo Summary Component
  const PractoSummary = () => {
    const currentPractoData = practoData[0] || {practo: 0, total: 0};

    return (
      <View style={styles.practoSummaryContainer}>
        <Text style={styles.practoSummaryTitle}>Report</Text>
        <View style={styles.practoSummaryDetails}>
          <View style={styles.practoSummaryItem}>
            <Text style={styles.practoSummaryLabel}>Practo Patients:</Text>
            <Text style={styles.practoSummaryValue}>
              {currentPractoData.practo}
            </Text>
          </View>
          <View style={styles.practoSummaryItem}>
            <Text style={styles.practoSummaryLabel}>New Patients:</Text>
            <Text style={styles.practoSummaryValue}>
              {currentPractoData.total}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const socialReferenceBarChartData = {
    labels: socialReferenceData.map(() => ''),
    datasets: [
      {
        data: socialReferenceData.map(item => item.count),
      },
    ],
  };

  // Referral Details Card Component
  const ReferralDetailsCard = () => {
    // Local state for toggling view mode
    const [showAll, setShowAll] = useState(false);

    // Calculate total count as before
    const totalCount = referralDetails.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    // If not showing all, slice the first 3 items (you can change the number as needed)
    const displayedData = showAll
      ? referralDetails
      : referralDetails.slice(0, 3);

    return (
      <View style={[styles.chartCard, styles.referralDetailsCard]}>
        <Text style={styles.chartTitle}>Referral Sources</Text>
        <Text style={styles.chartSubtitle}>
          {months[selectedMonth - 1]} {selectedYear} • Total: {totalCount}
        </Text>

        <View style={styles.referralDetailsHeader}>
          <Text style={[styles.referralDetailsHeaderText, {flex: 2}]}>
            Source
          </Text>
          <Text
            style={[
              styles.referralDetailsHeaderText,
              {flex: 1, textAlign: 'right'},
            ]}>
            Count
          </Text>
        </View>

        <FlatList
          data={displayedData}
          removeClippedSubviews={true} // Helps with performance
          initialNumToRender={10} // Loads only the initial 10 items
          maxToRenderPerBatch={10} // Controls rendering performance
          windowSize={5}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          renderItem={({item}) => (
            <View style={styles.referralDetailsRow}>
              <Text
                style={[styles.referralDetailsText, {flex: 2}]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item._id}
              </Text>
              <Text
                style={[
                  styles.referralDetailsText,
                  {flex: 1, textAlign: 'right'},
                ]}>
                {item.count}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.noDataText}>No referral details available</Text>
          }
          scrollEnabled={false} // Disable scrolling since it's within ScrollView
        />

        {/* Toggle button: only show if there are more than 3 items */}
        {referralDetails.length > 3 && (
          <TouchableOpacity
            onPress={() => setShowAll(!showAll)}
            style={{marginTop: 10}}>
            <Text style={styles.viewMoreText}>
              {showAll ? 'View Less' : 'View More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  const maxValue = Math.max(...socialReferenceData.map(item => item.count));
  const segments = maxValue <= 1 ? 1 : Math.min(4, maxValue);
  
  // Get the chart width to calculate proper icon positioning
  const chartWidth = screenWidth - 80;
  const barWidth = (chartWidth / socialReferenceData.length) * 0.6; // Approximate bar width based on chart
  
  return (
    <View style={styles.container}>
      <BackTabTop screenName="Reports" />

      <View style={styles.filterContainer}>
        {/* Month Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Month</Text>
          <TouchableOpacity
            style={styles.customPicker}
            onPress={() => {
              setShowMonthPicker(!showMonthPicker);
              setShowYearPicker(false);
            }}
            activeOpacity={0.7}>
            <Text style={styles.customPickerText}>
              {months[selectedMonth - 1]}
            </Text>
            <MaterialIcons
              name={
                showMonthPicker ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
              }
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>

          {showMonthPicker && (
            <View style={styles.dropdownContainer}>
              <FlatList
                data={months}
                keyExtractor={item => item}
                renderItem={({item, index}) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedMonth === index + 1 &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedMonth(index + 1);
                      setShowMonthPicker(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedMonth === index + 1 &&
                          styles.dropdownItemTextSelected,
                      ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.dropdownSeparator} />
                )}
                style={styles.dropdownList}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                initialNumToRender={12}
              />
            </View>
          )}
        </View>

        {/* Year Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Year</Text>
          <TouchableOpacity
            style={styles.customPicker}
            onPress={() => {
              setShowYearPicker(!showYearPicker);
              setShowMonthPicker(false);
            }}
            activeOpacity={0.7}>
            <Text style={styles.customPickerText}>{selectedYear}</Text>
            <MaterialIcons
              name={
                showYearPicker ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
              }
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>

          {showYearPicker && (
            <View style={styles.dropdownContainer}>
              <FlatList
                data={years}
                keyExtractor={item => item.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedYear === item && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedYear(item);
                      setShowYearPicker(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedYear === item &&
                          styles.dropdownItemTextSelected,
                      ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={styles.dropdownSeparator} />
                )}
                style={styles.dropdownList}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              />
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <SkeletonUI theme={theme} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}>
          {/* Practo Summary */}
          <PractoSummary />

          {/* Referral Details Card */}
          {referralDetails.length > 0 && <ReferralDetailsCard />}

          {/* Referrals Chart */}
          {referralPieChartData.length > 0 ? (
            <View style={[styles.chartCard, styles.referralChartCard]}>
              <Text style={styles.chartTitle}>New Referrals</Text>
              <Text style={styles.chartSubtitle}>
                {months[selectedMonth - 1]} {selectedYear}
              </Text>

              {/* Custom Legend Above Chart */}
              <ReferralLegend />

              <PieChart
                data={referralPieChartData}
                width={screenWidth - 40}
                height={250}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[50, 0]}
                absolute
                hasLegend={false}
              />
            </View>
          ) : (
            <Text style={styles.noDataText}>No referral data available</Text>
          )}
          <DoctorLeaderboard month={selectedMonth} year={selectedYear} />

          {/* Social Reference Bar Chart */}
          {socialReferenceData.length > 0 ? (
            <View style={[styles.chartCard, styles.socialReferenceChartCard]}>
              <Text style={styles.chartTitle}>Social References</Text>
              <Text style={styles.chartSubtitle}>
                {months[selectedMonth - 1]} {selectedYear}
              </Text>

              <View style={{height: 280}}>
                <BarChart
                  data={socialReferenceBarChartData}
                  width={screenWidth - 80}
                  height={220}
                  yAxisLabel=""
                  chartConfig={{
                    backgroundColor: theme.colors.card,
                    backgroundGradientFrom: theme.colors.card,
                    backgroundGradientTo: theme.colors.card,
                    backgroundGradientFromOpacity: 0,
                    backgroundGradientToOpacity: 0,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 123, 142, ${opacity})`,
                    labelColor: () => theme.colors.text,
                    fillShadowGradientFrom: '#007b8e',
                    fillShadowGradientTo: '#c1e3e8',
                    fillShadowGradientFromOpacity: 0.8,
                    fillShadowGradientToOpacity: 0.4,
                    propsForHorizontalLabels: {
                      fontSize: 12,
                      rotation: 0,
                      translateY: 5,
                    },
                    propsForVerticalLabels: {
                      fontSize: 0,
                      opacity: 0, // Make Y-axis labels fully transparent
                    },
                    formatYLabel: () => '', // Hide Y labels
                    strokeWidth: 2, // Ensure axis lines are visible
                  }}
                  verticalLabelRotation={45}
                  showValuesOnTopOfBars={true}
                  withInnerLines={false} // Disable inner grid lines
                  withHorizontalLabels={false} // Hide horizontal labels
                  fromZero={true}
                  style={{
                    marginVertical: 2,
                    borderRadius: 16,
                    paddingRight: 10,
                  }}
                  yAxisInterval={1}
                  horizontalLabelRotation={-80}
                  yAxisSuffix=""
                  segments={0} // Remove segment lines on Y-axis
                />

                {/* Fixed alignment for icons */}
                <View style={styles.iconContainer}>
                  {socialReferenceData.map((item, index) => (
                    <View key={`icon-${index}`} style={styles.iconWrapper}>
                      <View style={styles.icon}>
                        {getSocialReferenceIcon(item.source)}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>
              No social reference data available
            </Text>
          )}
        </ScrollView>
      )}

      {/* Transparent overlay that appears only when a dropdown is open */}
      {isAnyDropdownOpen && (
        <TouchableWithoutFeedback onPress={closeAllDropdowns}>
          <View style={styles.dropdownOverlay} />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const calculateSegments = (maxValue: number): number => {
  if (maxValue <= 0) return 1;
  if (maxValue === 1) return 1;
  if (maxValue <= 5) return Math.min(4, maxValue);
  if (maxValue <= 10) return 5;
  if (maxValue <= 20) return 4;
  if (maxValue <= 50) return 5;
  if (maxValue <= 100) return 5;
  return 5; // Default for larger values
};
const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.inputBox,
    },
    // Add overlay style for dropdown backdrop
    dropdownOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent', // Transparent but captures touches
      zIndex: 5, // Higher than content but lower than dropdowns
    },
    mainContentTouchable: {
      flex: 1,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 15,
      backgroundColor: theme.colors.card,
      position: 'relative',
      zIndex: 10, // Increased for better dropdown positioning
    },
    iconContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: -15,
      paddingHorizontal: 8, // Match chart padding
      position: 'relative',
      width: '100%',
    },
    iconWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#007b8e',
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    customPickerText: {
      fontSize: 16,
      color: '#ffffff',
    },
    // Improved dropdown styles
    dropdownContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: theme.colors.secondary,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: 580, // Maximum height for the container
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: 1000,
      overflow: 'hidden',
    },
    icon: {
      alignItems: 'center',
      backgroundColor: '#c1e3e8',
      borderColor: '#c1e3e8',
      borderWidth: 2,
      justifyContent: 'center',
      borderRadius: 8,
      width: 25,
      height: 25,
    },
    viewMoreText: {
      color: '#007b8e',
      fontSize: 14,
      textAlign: 'center',
    },
    customIcon: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginLeft: 2,
      gap: 1,
      marginTop: -20,
    },
    dropdownList: {
      flexGrow: 0,
      maxHeight: 580, // Match container height
    },
    dropdownItem: {
      paddingHorizontal: 15,
      paddingVertical: 12,
      backgroundColor: theme.colors.secondary,
    },
    dropdownItemSelected: {
      backgroundColor: '#007b8e',
    },
    dropdownItemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    dropdownItemTextSelected: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    dropdownSeparator: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 10,
    },
    pickerContainer: {
      flex: 1,
      marginHorizontal: 8,
      zIndex: 100, // Very high to ensure visibility
      position: 'relative', // For proper dropdown positioning
    },
    pickerLabel: {
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: 8,
    },
    scrollContainer: {
      padding: 15,
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: 'center',
    },
    chartCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 15,
      padding: 20,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
      overflow: 'hidden',
    },
    chartTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#007b8e',
      textAlign: 'center',
    },
    chartSubtitle: {
      fontSize: 14,
      color: '#7f8c8d',
      textAlign: 'center',
      marginBottom: 15,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: '#e74c3c',
      textAlign: 'center',
      marginTop: 20,
      fontWeight: '500',
    },
    noDataText: {
      color: '#2c3e50',
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 30,
      fontWeight: '500',
    },
    // Custom legend styles
    customLegendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
      paddingHorizontal: 10,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 5,
      marginVertical: 3,
    },
    legendColorBox: {
      width: 15,
      height: 15,
      marginRight: 5,
      borderRadius: 3,
    },
    legendText: {
      fontSize: 12,
      color: theme.colors.text,
    },
    // Practo Summary styles
    practoSummaryContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
    practoSummaryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#007b8e',
      textAlign: 'center',
      marginBottom: 15,
    },
    practoSummaryDetails: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    practoSummaryItem: {
      alignItems: 'center',
    },
    practoSummaryLabel: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 5,
    },
    practoSummaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    // Chart card spacing
    referralChartCard: {
      marginBottom: 20,
    },
    socialReferenceChartCard: {
      marginTop: 10,
    },
    // Referral Details Card styles
    referralDetailsCard: {
      marginBottom: 20,
    },
    referralDetailsHeader: {
      flexDirection: 'row',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      marginBottom: 8,
    },
    referralDetailsHeaderText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#007b8e',
    },
    referralDetailsRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    referralDetailsText: {
      fontSize: 13,
      color: theme.colors.text,
    },

    // Skeleton UI styles to add to your getStyles function
    // Skeleton UI styles with fixed conditional logic
    skeletonTitle: {
      height: 20,
      width: '70%',
      backgroundColor: theme.colors.inputBox === '#121212' ? '#444' : '#E0E0E0',
      borderRadius: 4,
      alignSelf: 'center',
      marginBottom: 15,
    },
    skeletonSubtitle: {
      height: 14,
      width: '50%',
      backgroundColor:
        theme.colors.inputBox === '#121212' ? '#3A3A3A' : '#EEEEEE',
      borderRadius: 4,
      alignSelf: 'center',
      marginBottom: 15,
    },
    skeletonLabel: {
      height: 14,
      width: 80,
      backgroundColor:
        theme.colors.inputBox === '#121212' ? '#3A3A3A' : '#EEEEEE',
      borderRadius: 4,
      marginBottom: 5,
    },
    skeletonValue: {
      height: 20,
      width: 50,
      backgroundColor: theme.colors.inputBox === '#121212' ? '#444' : '#E0E0E0',
      borderRadius: 4,
    },
    skeletonCircle: {
      height: 30,
      width: 30,
      borderRadius: 15,
      backgroundColor: theme.colors.inputBox === '#121212' ? '#444' : '#E0E0E0',
      marginRight: 10,
    },
    skeletonText: {
      height: 16,
      width: 120,
      backgroundColor:
        theme.colors.inputBox === '#121212' ? '#3A3A3A' : '#EEEEEE',
      borderRadius: 4,
      marginRight: 10,
    },
    skeletonSmallText: {
      height: 16,
      width: 40,
      backgroundColor:
        theme.colors.inputBox === '#121212' ? '#3A3A3A' : '#EEEEEE',
      borderRadius: 4,
    },
    skeletonHeaderText: {
      height: 16,
      width: '80%',
      backgroundColor: theme.colors.inputBox === '#121212' ? '#444' : '#E0E0E0',
      borderRadius: 4,
      marginBottom: 8,
    },
    leaderboardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        theme.colors.inputBox === '#121212' ? '#333' : '#f0f0f0',
    },
    skeletonPieChart: {
      height: 200,
      width: 200,
      borderRadius: 100,
      backgroundColor:
        theme.colors.inputBox === '#121212' ? '#3A3A3A' : '#EEEEEE',
      alignSelf: 'center',
      marginVertical: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    skeletonPieInner: {
      height: 100,
      width: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.inputBox === '#121212' ? '#444' : '#E0E0E0',
    },
    skeletonLegendBox: {
      width: 15,
      height: 15,
      backgroundColor: theme.colors.inputBox === '#121212' ? '#444' : '#E0E0E0',
      borderRadius: 3,
      marginRight: 5,
    },
    skeletonLegendText: {
      height: 12,
      width: 80,
      backgroundColor:
        theme.colors.inputBox === '#121212' ? '#3A3A3A' : '#EEEEEE',
      borderRadius: 4,
    },
    skeletonBarChart: {
      flexDirection: 'row',
      height: 150,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: 20,
      paddingHorizontal: 10,
    },
    skeletonBar: {
      width: '18%',
      height: '60%',
      backgroundColor:
        theme.colors.inputBox === '#121212' ? '#3A3A3A' : '#EEEEEE',
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
  });

export default ReportsScreen;
