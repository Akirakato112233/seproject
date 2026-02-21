import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.0.247:3000/api';

export interface LocationData {
  address: string;
  name: string;
  lat?: number;
  lon?: number;
}

interface LocationContextType {
  currentLocation: LocationData | null;
  setLocation: (location: LocationData) => Promise<void>;
  loading: boolean;
  locationLoaded: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const { user } = useAuth();

  // Load user's saved location from database when user logs in
  useEffect(() => {
    const loadUserLocation = async () => {
      if (user?.id) {
        console.log('📍 Loading location from database for user:', user.id);
        try {
          const response = await fetch(`${API_URL}/auth/user/${user.id}`);
          const data = await response.json();
          
          if (data.success && data.user) {
            const userData = data.user;
            if (userData.lat && userData.lon && userData.locationName) {
              console.log('📍 Found saved location:', userData.locationName);
              setCurrentLocation({
                name: userData.locationName,
                address: userData.address || '',
                lat: userData.lat,
                lon: userData.lon,
              });
            } else {
              console.log('📍 No saved location in database');
              setCurrentLocation(null);
            }
          }
        } catch (error) {
          console.error('❌ Error loading location:', error);
        } finally {
          setLocationLoaded(true);
        }
      } else {
        setLocationLoaded(true);
      }
    };
    
    loadUserLocation();
  }, [user?.id]);

  const setLocation = useCallback(async (location: LocationData) => {
    console.log('📍 setLocation called:', location);
    console.log('📍 user object:', user);
    console.log('📍 user.id:', user?.id || user?._id);
    setCurrentLocation(location);
    
    // Save to database if user is logged in
    if (user?.id) {
      console.log('📍 User ID:', user.id, '- Saving to database...');
      setLoading(true);
      try {
        const url = `${API_URL}/auth/update-location/${user.id}`;
        console.log('📍 Fetching:', url);
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: location.lat,
            lon: location.lon,
            locationName: location.name,
            address: location.address,
          }),
        });
        
        const data = await response.json();
        console.log('📍 Response:', data);
        if (data.success) {
          console.log('✅ Location saved to database:', location.name);
        } else {
          console.error('❌ Failed to save location:', data.message);
        }
      } catch (error) {
        console.error('❌ Error saving location to database:', error);
      } finally {
        setLoading(false);
      }
    } else {
      console.log('⚠️ No user ID - skipping database save');
    }
  }, [user?.id]);

  return (
    <LocationContext.Provider value={{ currentLocation, setLocation, loading, locationLoaded }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
