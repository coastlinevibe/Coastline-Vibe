import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Button } from 'react-native';
import DateSpinner from './DateSpinner';
import GuestSpinner from './GuestSpinner';
import BedAndExtrasSpinner from './BedAndExtrasSpinner';
import AmenitiesSpinner from './AmenitiesSpinner';

const SpinnerTest = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [step, setStep] = useState(1);

  const handleDateSelected = (dateString) => {
    setSelectedDate(dateString);
    console.log('Selected date:', dateString);
  };

  const handleAddGuest = (guestKey) => {
    setSelectedGuests([...selectedGuests, guestKey]);
    console.log('Added guest:', guestKey);
  };

  const handleRemoveGuest = (guestKey) => {
    setSelectedGuests(selectedGuests.filter(key => key !== guestKey));
    console.log('Removed guest:', guestKey);
  };
  
  const handleAddItem = (itemKey) => {
    setSelectedItems([...selectedItems, itemKey]);
    console.log('Added item:', itemKey);
  };

  const handleRemoveItem = (itemKey) => {
    setSelectedItems(selectedItems.filter(key => key !== itemKey));
    console.log('Removed item:', itemKey);
  };
  
  const handleAddAmenity = (amenityKey) => {
    setSelectedAmenities([...selectedAmenities, amenityKey]);
    console.log('Added amenity:', amenityKey);
  };

  const handleRemoveAmenity = (amenityKey) => {
    setSelectedAmenities(selectedAmenities.filter(key => key !== amenityKey));
    console.log('Removed amenity:', amenityKey);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Booking Flow Test</Text>

        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Step 1: Select Date</Text>
            <DateSpinner 
              initialDate="2023-06-15" 
              onDateSelected={handleDateSelected} 
            />
            {selectedDate && (
              <View style={styles.selectionInfo}>
                <Text>Selected date: {selectedDate}</Text>
                <Button 
                  title="Next: Select Guests" 
                  onPress={() => setStep(2)} 
                />
              </View>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Step 2: Select Guests</Text>
            <GuestSpinner
              onAddGuest={handleAddGuest}
              onRemoveGuest={handleRemoveGuest}
            />
            {selectedGuests.length > 0 && (
              <View style={styles.selectionInfo}>
                <Text>Selected guests: {selectedGuests.join(', ')}</Text>
                <View style={styles.buttonRow}>
                  <Button 
                    title="Back to Date Selection" 
                    onPress={() => setStep(1)} 
                  />
                  <Button 
                    title="Next: Beds & Extras" 
                    onPress={() => setStep(3)} 
                  />
                </View>
              </View>
            )}
          </>
        )}
        
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Step 3: Select Beds & Extras</Text>
            <BedAndExtrasSpinner
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
            />
            {selectedItems.length > 0 && (
              <View style={styles.selectionInfo}>
                <Text>Selected items: {selectedItems.join(', ')}</Text>
                <View style={styles.buttonRow}>
                  <Button 
                    title="Back to Guest Selection" 
                    onPress={() => setStep(2)} 
                  />
                  <Button 
                    title="Next: Amenities" 
                    onPress={() => setStep(4)} 
                  />
                </View>
              </View>
            )}
          </>
        )}
        
        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>Step 4: Select Amenities</Text>
            <AmenitiesSpinner
              onAddAmenity={handleAddAmenity}
              onRemoveAmenity={handleRemoveAmenity}
            />
            {selectedAmenities.length > 0 && (
              <View style={styles.selectionInfo}>
                <Text>Selected amenities: {selectedAmenities.join(', ')}</Text>
                <View style={styles.buttonRow}>
                  <Button 
                    title="Back to Beds & Extras" 
                    onPress={() => setStep(3)} 
                  />
                  <Button 
                    title="Complete Booking" 
                    onPress={() => alert('Booking completed!')} 
                  />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
    color: '#555',
    alignSelf: 'center',
  },
  selectionInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  }
});

export default SpinnerTest; 