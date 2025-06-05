import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AmenitiesSpinner = ({ onAddAmenity, onRemoveAmenity }) => {
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [draggingIconKey, setDraggingIconKey] = useState(null);
  const [hovering, setHovering] = useState(false);
  const [draggingIcon, setDraggingIcon] = useState(null);
  
  const pan = useRef(new Animated.ValueXY()).current;
  const dropZoneRef = useRef(null);
  const dropZoneLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  const roomAmenities = [
    { key: 'wifi', iconSet: 'MaterialCommunityIcons', name: 'wifi', color: '#3498db' },
    { key: 'tv', iconSet: 'MaterialCommunityIcons', name: 'television', color: '#2c3e50' },
    { key: 'ac', iconSet: 'MaterialCommunityIcons', name: 'air-conditioner', color: '#3498db' },
    { key: 'fridge', iconSet: 'MaterialCommunityIcons', name: 'fridge', color: '#95a5a6' },
    { key: 'coffee', iconSet: 'MaterialCommunityIcons', name: 'coffee-maker', color: '#795548' },
    { key: 'desk', iconSet: 'MaterialCommunityIcons', name: 'desk', color: '#795548' }
  ];
  
  const facilityIcons = [
    { key: 'pool', iconSet: 'MaterialCommunityIcons', name: 'pool', color: '#3498db' },
    { key: 'gym', iconSet: 'MaterialCommunityIcons', name: 'weight-lifter', color: '#e74c3c' },
    { key: 'spa', iconSet: 'MaterialCommunityIcons', name: 'spa', color: '#9b59b6' },
    { key: 'restaurant', iconSet: 'Ionicons', name: 'restaurant', color: '#f39c12' },
    { key: 'parking', iconSet: 'MaterialCommunityIcons', name: 'parking', color: '#3498db' },
    { key: 'elevator', iconSet: 'FontAwesome5', name: 'elevator', color: '#7f8c8d' }
  ];
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (_, gestureState) => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        checkHover(evt.nativeEvent);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        
        if (hovering && draggingIconKey) {
          // Only add if not already in the array
          if (!selectedAmenities.includes(draggingIconKey)) {
            const newSelectedAmenities = [...selectedAmenities, draggingIconKey];
            setSelectedAmenities(newSelectedAmenities);
            onAddAmenity && onAddAmenity(draggingIconKey);
          }
        }
        
        // Reset everything
        setHovering(false);
        setDraggingIconKey(null);
        setDraggingIcon(null);
        pan.setValue({ x: 0, y: 0 });
      }
    })
  ).current;
  
  const checkHover = (nativeEvent) => {
    const { pageX, pageY } = nativeEvent;
    const { x, y, width, height } = dropZoneLayout.current;
    
    // Check if the gesture is inside the drop zone
    if (
      pageX > x && 
      pageX < x + width && 
      pageY > y && 
      pageY < y + height
    ) {
      setHovering(true);
    } else {
      setHovering(false);
    }
  };
  
  const startDrag = (item) => {
    setDraggingIconKey(item.key);
    setDraggingIcon(item);
  };
  
  const removeAmenity = (amenityKey) => {
    const newSelectedAmenities = selectedAmenities.filter(key => key !== amenityKey);
    setSelectedAmenities(newSelectedAmenities);
    onRemoveAmenity && onRemoveAmenity(amenityKey);
  };
  
  const getItemLayout = (_, index) => ({
    length: 80,
    offset: 80 * index,
    index,
  });
  
  const renderIcon = ({ item }) => {
    let IconComponent;
    
    switch(item.iconSet) {
      case 'MaterialCommunityIcons':
        IconComponent = MaterialCommunityIcons;
        break;
      case 'FontAwesome5':
        IconComponent = FontAwesome5;
        break;
      case 'Ionicons':
        IconComponent = Ionicons;
        break;
      default:
        IconComponent = MaterialCommunityIcons;
    }
    
    return (
      <TouchableOpacity 
        style={styles.iconWrapper}
        onLongPress={() => startDrag(item)}
      >
        <IconComponent name={item.name} size={48} color={item.color} />
      </TouchableOpacity>
    );
  };
  
  const findIconByKey = (key) => {
    const allIcons = [...roomAmenities, ...facilityIcons];
    return allIcons.find(icon => icon.key === key);
  };
  
  // Measure drop zone on layout
  const measureDropZone = () => {
    if (dropZoneRef.current) {
      dropZoneRef.current.measure((x, y, width, height, pageX, pageY) => {
        dropZoneLayout.current = { x: pageX, y: pageY, width, height };
      });
    }
  };
  
  const renderSelectedIcon = (amenityKey) => {
    const icon = findIconByKey(amenityKey);
    if (!icon) return null;
    
    let IconComponent;
    
    switch(icon.iconSet) {
      case 'MaterialCommunityIcons':
        IconComponent = MaterialCommunityIcons;
        break;
      case 'FontAwesome5':
        IconComponent = FontAwesome5;
        break;
      case 'Ionicons':
        IconComponent = Ionicons;
        break;
      default:
        IconComponent = MaterialCommunityIcons;
    }
    
    return (
      <View key={amenityKey} style={{ position: 'relative' }}>
        <View style={styles.selectedIcon}>
          <IconComponent name={icon.name} size={32} color={icon.color} />
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeAmenity(amenityKey)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderDraggingIcon = () => {
    if (!draggingIcon) return null;
    
    let IconComponent;
    
    switch(draggingIcon.iconSet) {
      case 'MaterialCommunityIcons':
        IconComponent = MaterialCommunityIcons;
        break;
      case 'FontAwesome5':
        IconComponent = FontAwesome5;
        break;
      case 'Ionicons':
        IconComponent = Ionicons;
        break;
      default:
        IconComponent = MaterialCommunityIcons;
    }
    
    return (
      <Animated.View
        style={[
          styles.draggable,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
        ]}
        {...panResponder.panHandlers}
      >
        <IconComponent name={draggingIcon.name} size={48} color={draggingIcon.color} />
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Left spinner - Room Amenities */}
      <View style={styles.spinnerColumn}>
        <FlatList
          data={roomAmenities}
          renderItem={renderIcon}
          keyExtractor={item => item.key}
          showsVerticalScrollIndicator={false}
          snapToInterval={80}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
        />
      </View>
      
      {/* Drop Zone */}
      <View 
        ref={dropZoneRef}
        onLayout={measureDropZone}
        style={[styles.dropZone, hovering && styles.dropZoneHover]}
      >
        {selectedAmenities.length === 0 ? (
          <Text style={styles.dropZoneText}>Drag here</Text>
        ) : (
          <View style={styles.selectedRow}>
            {selectedAmenities.map(amenityKey => renderSelectedIcon(amenityKey))}
          </View>
        )}
      </View>
      
      {/* Right spinner - Facilities */}
      <View style={styles.spinnerColumn}>
        <FlatList
          data={facilityIcons}
          renderItem={renderIcon}
          keyExtractor={item => item.key}
          showsVerticalScrollIndicator={false}
          snapToInterval={80}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
        />
      </View>
      
      {/* Draggable icon */}
      {renderDraggingIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', height: 300 },
  spinnerColumn: { width: 80, flexGrow: 0 },
  iconWrapper: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  dropZone: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 8,
    marginHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dropZoneHover: { borderColor: '#2196F3' },
  dropZoneText: { color: '#666' },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  selectedIcon: { width: 40, height: 40, margin: 2, justifyContent: 'center', alignItems: 'center' },
  removeButton: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    top: -5,
    right: -5
  },
  removeButtonText: { color: '#fff', fontSize: 12, lineHeight: 12 },
  draggable: { position: 'absolute', width: 60, height: 60, zIndex: 10, justifyContent: 'center', alignItems: 'center' }
});

export default AmenitiesSpinner; 