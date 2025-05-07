import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import moment from 'moment-timezone';
import {useTheme} from '../screens/ThemeContext';

type Slot = {
  start: string;
  end: string;
  duration: number;
  status: 'free' | 'occupied';
};

type AvailableSlotsProps = {
  slotDuration: number;
  onSelectSlot?: (slotIndex: number, slot: Slot) => void;
};

const generateAvailableSlots = (
  slotDuration: number = 30
): Slot[] => {
  const now = moment.tz('Asia/Kolkata');
  const today = moment(now).startOf('day');

  const workingHours = {
    start: moment(today).hour(9).minute(0),
    end: moment(today).hour(21).minute(0),
  };

  const slots: Slot[] = [];
  let currentSlotTime = moment(workingHours.start);

  while (currentSlotTime.isBefore(workingHours.end)) {
    const slotStart = moment(currentSlotTime);
    const slotEnd = moment(currentSlotTime).add(slotDuration, 'minutes');

    if (slotEnd.isAfter(workingHours.end)) break;

    // Only add future slots
    if (slotEnd.isAfter(now)) {
      slots.push({
        start: slotStart.format('HH:mm'),
        end: slotEnd.format('HH:mm'),
        duration: slotDuration,
        status: 'free',
      });
    }

    currentSlotTime.add(
      slotDuration >= 60 ? 30 : slotDuration,
      'minutes'
    ); // Handle 1hr+ durations with 30min offsets
  }

  return slots;
};

const AvailableSlots: React.FC<AvailableSlotsProps> = ({ 
  slotDuration,
  onSelectSlot 
}) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
 const {theme, isDarkMode} = useTheme();
 const styles = createStyles(theme.colors, isDarkMode);
  useEffect(() => {
    const availableSlots = generateAvailableSlots(slotDuration);
    setSlots(availableSlots);
    // Reset selection when slot duration changes
    setSelectedSlotIndex(null);
  }, [slotDuration]);

  const handleSlotSelect = (slotIndex: number, slot: Slot) => {
    setSelectedSlotIndex(slotIndex);
    if (onSelectSlot) {
      onSelectSlot(slotIndex, slot);
    }
  };

  // Function to get the absolute index from row and column
  const getAbsoluteIndex = (rowIndex: number, colIndex: number) => {
    return rowIndex * 2 + colIndex;
  };

  // Function to render a row with two slots
  const renderRow = ({ item, index: rowIndex }: { item: Slot[], index: number }) => (
    <View style={styles.row}>
      {item.map((slot, colIndex) => {
        const slotIndex = getAbsoluteIndex(rowIndex, colIndex);
        const isSelected = selectedSlotIndex === slotIndex;
        
        return (
          <TouchableOpacity
            key={colIndex}
            style={[
              styles.slotBox,
              isSelected && styles.selectedSlotBox
            ]}
            onPress={() => handleSlotSelect(slotIndex, slot)}
          >
            <Text style={[
              styles.slotText,
              isSelected && styles.selectedSlotText
            ]}>
              {slot.start} - {slot.end}
            </Text>
          </TouchableOpacity>
        );
      })}
      {/* If there's only one item in the row, add an empty slot for layout */}
      {item.length === 1 && <View style={styles.emptySlot} />}
    </View>
  );

  // Prepare data for 2-column layout
  const prepareRowData = () => {
    const rows = [];
    for (let i = 0; i < slots.length; i += 2) {
      const row = slots.slice(i, i + 2);
      rows.push(row);
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      {slots.length > 0 ? (
        <FlatList
          data={prepareRowData()}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderRow}
          scrollEnabled={false} 
          contentContainerStyle={styles.slotGrid}
        />
      ) : (
        <Text style={styles.noSlotsText}>No available slots for the selected duration</Text>
      )}
    </View>
  );
};

export default AvailableSlots;

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007B8E',
    marginBottom: 12,
  },
  slotGrid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  slotBox: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007b8e',
    alignItems: 'center',
  },
  selectedSlotBox: {
    backgroundColor: '#007B8E',
    borderColor: '#007B8E',
  },
  emptySlot: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12, // Match slotBox
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent', // So it's invisible but maintains structure
    backgroundColor: 'transparent', // No color, just spacing
  },
  slotText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedSlotText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noSlotsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
    marginBottom: 10,
  }
});