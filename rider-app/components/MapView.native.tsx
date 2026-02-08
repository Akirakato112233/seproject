import RNMaps, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

// Native entry: re-export the real react-native-maps API.
const MapView = RNMaps as any;
export default MapView;
export { Marker, Polyline, PROVIDER_GOOGLE };
export type Region = any;
