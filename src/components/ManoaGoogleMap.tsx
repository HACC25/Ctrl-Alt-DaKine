import { useMemo, useState, useCallback, type CSSProperties } from 'react';
import { GoogleMap, Marker, DirectionsService, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { buildingCoordinates, campusCenter } from '../data/manoaBuildingGeo';
import './ManoaGoogleMap.css';

const mapContainerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
};

const defaultOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  tilt: 45,
  heading: 0,
  mapTypeId: 'satellite',
  isFractionalZoomEnabled: true,
};

type ItineraryStep = {
  id: string;
  type: 'parking' | 'class' | 'food' | 'experience';
  title: string;
  locationKey: string;
  description: string;
  time: string;
  kealaSummary?: string;
};

type ManoaGoogleMapProps = {
  activeStep?: ItineraryStep;
  nextStep?: ItineraryStep;
  schedule?: any[];
};

export default function ManoaGoogleMap({ activeStep, nextStep }: ManoaGoogleMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapId = import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'uh-manoa-map',
    googleMapsApiKey: apiKey ?? '',
  });

  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

  const mapCenter = useMemo(() => {
    if (activeStep && buildingCoordinates[activeStep.locationKey]) {
      return buildingCoordinates[activeStep.locationKey];
    }
    return campusCenter;
  }, [activeStep]);

  const directionsOptions = useMemo(() => {
    if (activeStep && nextStep) {
      const origin = buildingCoordinates[activeStep.locationKey];
      const destination = buildingCoordinates[nextStep.locationKey];
      if (origin && destination) {
        return {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: 'WALKING' as google.maps.TravelMode,
        };
      }
    }
    return null;
  }, [activeStep, nextStep]);

  const directionsCallback = useCallback((
    response: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus
  ) => {
    if (response !== null && status === 'OK') {
      setDirectionsResponse(response);
    }
  }, []);

  if (!apiKey) {
    return (
      <div className="uh-map-error">
        <p>Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> to load the campus map.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="uh-map-error">
        <p>Unable to load Google Maps. Please verify the API key is valid and enabled for Maps JavaScript.</p>
      </div>
    );
  }

  return (
    <div className="google-map-shell">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={18}
          options={{ ...defaultOptions, mapId }}
        >
          {/* Active Step Marker */}
          {activeStep && buildingCoordinates[activeStep.locationKey] && (
            <Marker
              position={buildingCoordinates[activeStep.locationKey]}
              label={{
                text: "A",
                color: '#ffffff',
                fontWeight: 'bold'
              }}
            />
          )}

          {/* Next Step Marker */}
          {nextStep && buildingCoordinates[nextStep.locationKey] && (
            <Marker
              position={buildingCoordinates[nextStep.locationKey]}
              label={{
                text: "B",
                color: '#ffffff',
                fontWeight: 'bold'
              }}
            />
          )}

          {/* Directions */}
          {directionsOptions && (
            <DirectionsService
              options={directionsOptions}
              callback={directionsCallback}
            />
          )}
          {directionsResponse && (
            <DirectionsRenderer
              options={{
                directions: directionsResponse,
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#f59e0b',
                  strokeOpacity: 0.8,
                  strokeWeight: 6,
                }
              }}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="google-map-loading">
          <span>Loading the Mānoa campus…</span>
        </div>
      )}
    </div>
  );
}
