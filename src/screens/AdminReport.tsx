import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Dimensions,
  FlatList 
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { useSession } from '../context/SessionContext';
import { useTheme } from './ThemeContext';
import BackTabTop from './BackTopTab';
import axiosInstance from '../utils/axiosConfig';
import {getTheme} from './Theme';
import DoctorLeaderboard from './LeaderReport';

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

interface ReferralDetailsResponse {
  success: boolean;
  month: number;
  year: number;
  referralDetailsCount: ReferralDetailsItem[];
}

const ReportsScreen: React.FC = () => {
  // State Management
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [referralData, setReferralData] = useState<ReferralData[]>([]);
  const [practoData, setPractoData] = useState<PractoData[]>([]);
  const [socialReferenceData, setSocialReferenceData] = useState<SocialReferenceData[]>([]);
  const [referralDetails, setReferralDetails] = useState<ReferralDetailsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 const {theme} = useTheme();
  const styles = getStyles(
    getTheme(
      theme.name as 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark',
    ),
  );
  // Context Hooks
  const { session } = useSession();

  // Screen Dimensions
  const screenWidth = Dimensions.get("window").width;

  // Months Array
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Years Array (last 5 years)
  const years = Array.from(
    { length: 5 }, 
    (_, i) => new Date().getFullYear() - i
  );

  const fetchReportData = async () => {
    if (!session.is_admin) return;
  
    setLoading(true);
    setError(null);
    
    try {
      // Fetch Referral Data
      const referralResponse = await axiosInstance.get(
        `/get/refrells?month=${selectedMonth}&year=${selectedYear}`,
      );
  
      const transformedReferralData: ReferralData[] = referralResponse.data.referralDetails.map((detail: { _id: string; referralCount: number }) => ({
        doctor_name: 
          detail._id === 'Patient Reference' ? 'Patient Reference' :
          detail._id === 'Hospital Reference' ? 'Hospital Reference' :
          detail._id,
        referral_count: detail.referralCount
      }));

      // Fetch Practo Data
      const practoResponse = await axiosInstance.get(
        `/get/practo?month=${selectedMonth}&year=${selectedYear}`,
      );
  
      const transformedPractoData: PractoData[] = practoResponse.data.data.pivotArray.filter(
        (item: PractoData) => item.year === selectedYear && item.month === months[selectedMonth - 1].slice(0, 3)
      );

      // Fetch Social Reference Data
      const socialReferenceResponse = await axiosInstance.get(
        `/get/socialrefrence?month=${selectedMonth}&year=${selectedYear}`,
      );
  
      const transformedSocialReferenceData: SocialReferenceData[] = Object.entries(
        socialReferenceResponse.data.data.pivotArray.find(
          (item: any) => item.year === selectedYear && item.month === months[selectedMonth - 1].slice(0, 3)
        ) || {}
      )
      .filter(([key, value]) => 
        key !== 'year' && 
        key !== 'month' && 
        key !== 'total' && 
        typeof value === 'number' &&
        key !== '(blank)'
      )
      .map(([source, count]) => ({
        source: source === '(blank)' ? 'Unspecified' : source,
        count: count as number
      }));

      // Fetch Referral Details
      const referralDetailsResponse = await axiosInstance.get<ReferralDetailsResponse>(
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
    '#007b8e',  // Soft Blue
    '#2ecc71',  // Emerald Green
    '#e74c3c',  // Vibrant Red
    '#f39c12',  // Warm Orange
    '#9b59b6',  // Soft Purple
    '#3498db',  // Bright Blue
    '#1abc9c',  // Turquoise
  ];

  // Prepare Pie Chart Data for Referrals
  const referralPieChartData = referralData.map((item, index) => ({
    name: item.doctor_name,
    population: item.referral_count,
    color: modernColors[index % modernColors.length],
    legendFontColor: theme.name === 'dark' ? '#FFFFFF' : '#2c3e50',
    legendFontSize: 11
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
            style={[
              styles.legendColorBox, 
              { backgroundColor: entry.color }
            ]} 
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
    const currentPractoData = practoData[0] || { practo: 0, total: 0 };
    
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

  // Prepare Bar Chart Data for Social References
  const socialReferenceBarChartData = {
    labels: socialReferenceData.map(item => // Truncate long source names
      item.source),
    datasets: [
      {
        data: socialReferenceData.map(item => item.count)
      }
    ]
  };

  // Referral Details Card Component
  const ReferralDetailsCard = () => {
    // Calculate total count
    const totalCount = referralDetails.reduce((sum, item) => sum + item.count, 0);
    
    return (
      <View style={[styles.chartCard, styles.referralDetailsCard]}>
        <Text style={styles.chartTitle}>
          Referral Sources
        </Text>
        <Text style={styles.chartSubtitle}>
          {months[selectedMonth - 1]} {selectedYear} • Total: {totalCount}
        </Text>
        
        <View style={styles.referralDetailsHeader}>
          <Text style={[styles.referralDetailsHeaderText, { flex: 2 }]}>Source</Text>
          <Text style={[styles.referralDetailsHeaderText, { flex: 1, textAlign: 'right' }]}>Count</Text>
          {/* <Text style={[styles.referralDetailsHeaderText, { flex: 1, textAlign: 'right' }]}>%</Text> */}
        </View>
        
        <FlatList
          data={referralDetails}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.referralDetailsRow}>
              <Text 
                style={[styles.referralDetailsText, { flex: 2 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item._id}
              </Text>
              <Text style={[styles.referralDetailsText, { flex: 1, textAlign: 'right' }]}>
                {item.count}
              </Text>
              {/* <Text style={[styles.referralDetailsText, { flex: 1, textAlign: 'right' }]}>
                {totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0}%
              </Text> */}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.noDataText}>No referral details available</Text>
          }
          scrollEnabled={false} // Disable scrolling since it's within ScrollView
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BackTabTop screenName="Reports" />
      
      <View style={styles.filterContainer}>
        {/* Month Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Month</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              {months.map((month, index) => (
                <Picker.Item 
                  key={month} 
                  label={month} 
                  value={index + 1} 
                  color={theme.name === 'dark' ? '#FFFFFF' : '#2c3e50'}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Year Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Year</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={(itemValue) => setSelectedYear(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              {years.map((year) => (
                <Picker.Item 
                  key={year} 
                  label={year.toString()} 
                  value={year} 
                  color={theme.name === 'dark' ? '#FFFFFF' : '#2c3e50'}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator 
          size="large" 
          color="#3498db" 
          style={styles.loader} 
        />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Practo Summary */}
          <PractoSummary />

          <DoctorLeaderboard month={selectedMonth} year={selectedYear}/>

          {/* Referral Details Card */}
          {referralDetails.length > 0 && <ReferralDetailsCard />}

          {/* Referrals Chart */}
          {referralPieChartData.length > 0 ? (
            <View style={[styles.chartCard, styles.referralChartCard]}>
              <Text style={styles.chartTitle}>
                New Referrals
              </Text>
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

          {/* Social Reference Bar Chart */}
          {socialReferenceData.length > 0 ? (
            <View style={[styles.chartCard, styles.socialReferenceChartCard]}>
              <Text style={styles.chartTitle}>
                Social References
              </Text>
              <Text style={styles.chartSubtitle}>
                {months[selectedMonth - 1]} {selectedYear}
              </Text>
              
              <BarChart
  data={socialReferenceBarChartData}
  width={screenWidth - 40}
  height={300}
  yAxisLabel=""
  chartConfig={{
    backgroundColor: '#ffffff',
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 123, 142, ${opacity})`,
    labelColor: () => theme.colors.text,
    fillShadowGradientFrom: '#3498db',
    fillShadowGradientTo: '#2980b9',
    fillShadowGradientFromOpacity: 0.8,
    fillShadowGradientToOpacity: 0.4,
    propsForHorizontalLabels: {
      fontSize: 12,
      rotation: 0,
      translateY: 5,
    },
    propsForVerticalLabels: {
      fontSize: 10,
      color: 'red',
      dx: 10, // Add horizontal spacing for vertical labels
    },
    paddingRight: 30, // Add right padding to create space between labels and card
  }}
  verticalLabelRotation={45}
  showValuesOnTopOfBars={true}
  withInnerLines={true}
  fromZero={true}
  style={{
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 30, // Ensure this matches or complements chartConfig.paddingRight
  }}
  yAxisInterval={1}
  horizontalLabelRotation={-60}
  yAxisSuffix=""
  segments={3}
/>
            </View>
          ) : (
            <Text style={styles.noDataText}>No social reference data available</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.inputBox,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: theme.colors.card,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
    },
  pickerWrapper: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerLabel: {
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  picker: {
    width: 150,
    color:  theme.colors.text,
  },
  scrollContainer: {
    padding: 15,
    paddingTop: 20, // Add more top padding
    paddingBottom: 20, // Add more bottom padding
    alignItems: 'center',
  },
  chartCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden', // Ensure content doesn't overflow
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
    fontWeight: '500',
  },
  // New style to ensure full visibility of legend
  chartLegendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  // New styles for custom legend
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
    color:theme.colors.text,
  },

  // New styles for Practo Summary
  practoSummaryContainer: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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

  // Add new styles for chart card spacing
  referralChartCard: {
    marginBottom: 20, // Increase space below referral chart
  },
  socialReferenceChartCard: {
    marginTop: 10, // Add space above social reference chart
  },

  // New styles for Referral Details Card
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
    color:theme.colors.text,
  },
});

export default ReportsScreen;