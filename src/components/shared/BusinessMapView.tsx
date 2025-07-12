import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';
import Image from 'next/image';

// Define the business type
type MapBusiness = {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  cover_image_url?: string;
  location?: { latitude: number; longitude: number } | null;
  rating?: number;
  category_name?: string;
  is_featured?: boolean;
  neighborhood?: string;
  neighborhood_id?: string;
  district?: string;
};

type BusinessMapViewProps = {
  businesses: MapBusiness[];
  communityId: string;
  initialViewState?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
};

const defaultInitialViewState = {
  latitude: 16.0544, // Da Nang by default
  longitude: 108.2022,
  zoom: 12,
};

const BusinessMapView: React.FC<BusinessMapViewProps> = ({ 
  businesses, 
  communityId,
  initialViewState = defaultInitialViewState 
}) => {
  const [popupInfo, setPopupInfo] = useState<MapBusiness | null>(null);
  const [viewState, setViewState] = useState(initialViewState);
  const [hoverInfo, setHoverInfo] = useState<MapBusiness | null>(null);
  const [isClusteringEnabled, setIsClusteringEnabled] = useState(true);

  // Filter businesses with valid locations
  const businessesWithLocation = useMemo(() => {
    return businesses.filter(b => b.location && 
      b.location.latitude && 
      b.location.longitude && 
      !isNaN(b.location.latitude) && 
      !isNaN(b.location.longitude));
  }, [businesses]);

  // Calculate map bounds based on business locations
  useEffect(() => {
    if (businessesWithLocation.length === 0) {
      return;
    }

    // Calculate bounds
    const lats = businessesWithLocation.map(b => b.location!.latitude);
    const lngs = businessesWithLocation.map(b => b.location!.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Calculate center point
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate appropriate zoom level based on bounds
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    let zoom = 12; // Default zoom
    
    // Adjust zoom based on the spread of businesses
    if (latDiff > 0.5 || lngDiff > 0.5) {
      zoom = 10;
    } else if (latDiff > 0.2 || lngDiff > 0.2) {
      zoom = 11;
    } else if (latDiff > 0.1 || lngDiff > 0.1) {
      zoom = 12;
    } else {
      zoom = 13;
    }
    
    // Set new view state
    setViewState({
      latitude: centerLat,
      longitude: centerLng,
      zoom: zoom,
    });
  }, [businessesWithLocation]);

  const handleMarkerClick = useCallback((business: MapBusiness) => {
    setPopupInfo(business);
  }, []);

  // GeoJSON for clustering
  const geojsonData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: businessesWithLocation.map(business => ({
        type: 'Feature',
        properties: {
          id: business.id,
          name: business.name,
          description: business.description,
          rating: business.rating || 0,
          category: business.category_name || '',
          isFeatured: business.is_featured || false,
          neighborhood: business.neighborhood || '',
          neighborhood_id: business.neighborhood_id || '',
          district: business.district || '',
          businessObject: business // Store the entire business object
        },
        geometry: {
          type: 'Point',
          coordinates: [business.location!.longitude, business.location!.latitude]
        }
      }))
    };
  }, [businessesWithLocation]);

  // Cluster layer
  const clusterLayer = {
    id: 'clusters',
    type: 'circle',
    source: 'businesses',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6', // Color for clusters with < 10 points
        10,
        '#f1f075', // Color for clusters with < 30 points
        30,
        '#f28cb1' // Color for clusters with >= 30 points
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20, // Radius for clusters with < 10 points
        10,
        25, // Radius for clusters with < 30 points
        30,
        30 // Radius for clusters with >= 30 points
      ]
    }
  };

  const clusterCountLayer = {
    id: 'cluster-count',
    type: 'symbol',
    source: 'businesses',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    },
    paint: {
      'text-color': '#ffffff'
    }
  };

  const unclusteredPointLayer = {
    id: 'unclustered-point',
    type: 'circle',
    source: 'businesses',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 8,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  };

  // Handle cluster click to zoom in
  const handleClusterClick = (event: any) => {
    const features = event.target.queryRenderedFeatures(event.point, {
      layers: ['clusters']
    });
    
    if (!features.length) return;
    
    const clusterId = features[0].properties.cluster_id;
    const mapboxSource = event.target.getSource('businesses');
    
    mapboxSource.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
      if (err) return;
      
      setViewState({
        ...viewState,
        longitude: features[0].geometry.coordinates[0],
        latitude: features[0].geometry.coordinates[1],
        zoom: zoom,
      });
    });
  };

  // Handle unclustered point click
  const handlePointClick = (event: any) => {
    const features = event.target.queryRenderedFeatures(event.point, {
      layers: ['unclustered-point']
    });
    
    if (!features.length) return;
    
    const business = features[0].properties.businessObject;
    if (business) {
      setPopupInfo(JSON.parse(business));
    }
  };

  // Handle point hover
  const handlePointHover = (event: any) => {
    const features = event.target.queryRenderedFeatures(event.point, {
      layers: ['unclustered-point']
    });
    
    if (!features.length) {
      setHoverInfo(null);
      return;
    }
    
    const business = features[0].properties.businessObject;
    if (business) {
      setHoverInfo(JSON.parse(business));
    }
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-md relative">
      {/* Map Controls */}
      <div className="absolute top-2 left-2 z-10 bg-white rounded-md shadow-md p-1.5 flex flex-col gap-1.5">
        <button 
          className={`p-1.5 rounded-md ${isClusteringEnabled ? 'bg-primaryTeal text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          onClick={() => setIsClusteringEnabled(!isClusteringEnabled)}
          title={isClusteringEnabled ? "Disable clustering" : "Enable clustering"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
          </svg>
        </button>
        <button 
          className="p-1.5 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
          onClick={() => {
            if (businessesWithLocation.length > 0) {
              // Reset to initial bounds
              const lats = businessesWithLocation.map(b => b.location!.latitude);
              const lngs = businessesWithLocation.map(b => b.location!.longitude);
              
              const minLat = Math.min(...lats);
              const maxLat = Math.max(...lats);
              const minLng = Math.min(...lngs);
              const maxLng = Math.max(...lngs);
              
              const centerLat = (minLat + maxLat) / 2;
              const centerLng = (minLng + maxLng) / 2;
              
              setViewState({
                latitude: centerLat,
                longitude: centerLng,
                zoom: 11,
              });
            }
          }}
          title="Reset view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
        </button>
      </div>

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        attributionControl={false}
        onMouseMove={handlePointHover}
        onClick={(event) => {
          if (isClusteringEnabled) {
            handleClusterClick(event);
            handlePointClick(event);
          }
        }}
        interactiveLayerIds={isClusteringEnabled ? ['clusters', 'unclustered-point'] : []}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        
        {/* Render markers directly when clustering is disabled */}
        {!isClusteringEnabled && businessesWithLocation.map(business => (
          <Marker
            key={business.id}
            latitude={business.location!.latitude}
            longitude={business.location!.longitude}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(business);
            }}
          >
            <div 
              className={`cursor-pointer transition-transform hover:scale-110 ${
                business.is_featured ? 'text-amber-500' : 'text-primaryTeal'
              }`}
              onMouseEnter={() => setHoverInfo(business)}
              onMouseLeave={() => setHoverInfo(null)}
            >
              <svg 
                viewBox="0 0 24 24" 
                width="24" 
                height="24" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="white" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="sm:w-8 sm:h-8"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </Marker>
        ))}
        
        {/* Use clustering when enabled */}
        {isClusteringEnabled && (
          <Source
            id="businesses"
            type="geojson"
            data={geojsonData as any}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer {...clusterLayer as any} />
            <Layer {...clusterCountLayer as any} />
            <Layer {...unclusteredPointLayer as any} />
          </Source>
        )}

        {/* Hover tooltip */}
        {hoverInfo && (
          <div 
            className="absolute z-10 bg-white p-2 rounded-md shadow-lg pointer-events-none"
            style={{
              left: viewState.longitude < hoverInfo.location!.longitude ? '10px' : 'auto',
              right: viewState.longitude >= hoverInfo.location!.longitude ? '10px' : 'auto',
              bottom: '10px',
              maxWidth: '200px'
            }}
          >
            <div className="font-semibold text-primaryTeal text-sm truncate">{hoverInfo.name}</div>
            {hoverInfo.category_name && (
              <div className="text-xs text-gray-500 truncate">{hoverInfo.category_name}</div>
            )}
            {(hoverInfo.neighborhood || hoverInfo.district) && (
              <div className="text-xs text-gray-500 truncate flex items-center mt-0.5">
                <svg 
                  className="w-3 h-3 mr-0.5 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span className="truncate">{hoverInfo.neighborhood || hoverInfo.district}</span>
              </div>
            )}
            {hoverInfo.rating !== undefined && (
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg 
                    key={i}
                    className={`w-3 h-3 ${i < hoverInfo.rating! ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-xs text-gray-500 ml-1">{hoverInfo.rating}</span>
              </div>
            )}
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {hoverInfo.description?.substring(0, 50) || "No description available"}
              {hoverInfo.description && hoverInfo.description.length > 50 ? "..." : ""}
            </div>
            <div className="text-xs text-primaryTeal mt-1">Click for details</div>
          </div>
        )}

        {/* Popup for selected business */}
        {popupInfo && popupInfo.location && (
          <Popup
            latitude={popupInfo.location.latitude}
            longitude={popupInfo.location.longitude}
            anchor="top"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            closeButton={true}
            className="z-10"
            maxWidth="220px"
          >
            <div className="p-1 sm:p-2 max-w-[220px]">
              <Link 
                href={`/community/${communityId}/business/${popupInfo.id}`}
                className="font-semibold text-primaryTeal text-sm hover:underline block truncate"
              >
                {popupInfo.name}
              </Link>
              {popupInfo.category_name && (
                <div className="text-xs text-gray-500">{popupInfo.category_name}</div>
                  )}
              {popupInfo.rating !== undefined && (
                <div className="flex items-center mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                          <svg 
                      key={i}
                      className={`w-3 h-3 ${i < popupInfo.rating! ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                  <span className="text-xs text-gray-500 ml-1">{popupInfo.rating.toFixed(1)}</span>
                  </div>
                )}
              {(popupInfo.neighborhood || popupInfo.district) && (
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <svg 
                    className="w-3 h-3 mr-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  {popupInfo.neighborhood || popupInfo.district}
                </div>
              )}
              <div className="text-xs text-gray-600 mt-1 max-h-12 overflow-y-auto">
                {popupInfo.description || "No description available"}
              </div>
              <Link 
                href={`/community/${communityId}/business/${popupInfo.id}`}
                className="mt-2 text-xs text-white bg-primaryTeal px-2 py-1 rounded inline-block hover:bg-teal-600 transition-colors"
              >
                View Details
              </Link>
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 p-2 rounded-md shadow-md text-xs">
        <div className="font-medium mb-1">Map Legend</div>
        <div className="flex items-center gap-1 mb-1">
          <div className="w-3 h-3 rounded-full bg-primaryTeal"></div>
          <span>Regular Business</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Featured Business</span>
        </div>
        {isClusteringEnabled && (
          <>
            <div className="mt-2 font-medium">Clusters</div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#51bbd6]"></div>
              <span>&lt; 10 businesses</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#f1f075]"></div>
              <span>&lt; 30 businesses</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#f28cb1]"></div>
              <span>&gt;= 30 businesses</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessMapView; 