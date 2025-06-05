import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import dayjs from 'dayjs';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 60;
const ITEM_MARGIN = 5;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const DateSpinner = ({ initialDate = dayjs().format('YYYY-MM-DD'), onDateSelected }) => {
  const [dates, setDates] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const flatListRef = useRef(null);

  // Generate dates for the month on mount
  useEffect(() => {
    const date = dayjs(initialDate);
    const daysInMonth = date.daysInMonth();
    const month = date.month();
    const year = date.year();
    const initialDay = date.date();
    
    const datesArray = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = dayjs().year(year).month(month).date(i);
      datesArray.push({
        day: i,
        dateString: dateObj.format('YYYY-MM-DD'),
        dayOfWeek: dateObj.format('ddd')
      });
    }
    
    setDates(datesArray);
    
    // Set the initial selected day
    const initialIndex = initialDay - 1;
    setSelectedIndex(initialIndex);
    
    // Scroll to the initial date with a small delay to ensure the list is rendered
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: initialIndex,
          animated: false,
          viewPosition: 0.5
        });
      }
    }, 100);
  }, [initialDate]);

  const handleDayPress = (index) => {
    setSelectedIndex(index);
    if (onDateSelected) {
      onDateSelected(dates[index].dateString);
    }
    
    // Scroll to center the selected day
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5
      });
    }
  };

  const getItemLayout = (_, index) => ({
    length: ITEM_HEIGHT + (ITEM_MARGIN * 2),
    offset: (ITEM_HEIGHT + (ITEM_MARGIN * 2)) * index,
    index,
  });

  const renderDay = ({ item, index }) => {
    const isSelected = index === selectedIndex;
    
    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          { marginVertical: ITEM_MARGIN }
        ]}
        onPress={() => handleDayPress(index)}
      >
        <View style={[
          styles.dayCircle,
          isSelected ? styles.selectedDayCircle : styles.unselectedDayCircle
        ]}>
          <Text style={[
            styles.dayText,
            isSelected ? styles.selectedDayText : styles.unselectedDayText
          ]}>
            {item.day}
          </Text>
        </View>
        <Text style={styles.dayOfWeekText}>{item.dayOfWeek}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={dates}
        renderItem={renderDay}
        keyExtractor={(item) => item.dateString}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT + (ITEM_MARGIN * 2)}
        snapToAlignment="center"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2,
  },
  dayContainer: {
    height: ITEM_HEIGHT,
    width: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayCircle: {
    backgroundColor: '#0073b1',
    borderWidth: 0,
  },
  unselectedDayCircle: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedDayText: {
    color: 'white',
  },
  unselectedDayText: {
    color: '#333',
  },
  dayOfWeekText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});

export default DateSpinner; 