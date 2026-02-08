/* eslint-disable */
import React from "react";
import { Platform, View, Text } from "react-native";

// A small runtime wrapper that avoids statically importing `react-native-maps` on web.
// On native platforms we require the real package at runtime. On web we export
// lightweight stubs so bundlers won't try to load native-only internals.

let NativeMap: any = null;
let NativeMarker: any = null;
let NativePolyline: any = null;
let PROVIDER_GOOGLE: any = "google";

if (Platform.OS !== "web") {
  // require at runtime so the web bundler doesn't try to resolve native internals
  // during bundle time.
  const RNMaps = require("react-native-maps");
  NativeMap = RNMaps.default || RNMaps.MapView || RNMaps;
  NativeMarker = RNMaps.Marker || RNMaps.MapMarker || RNMaps;
  NativePolyline = RNMaps.Polyline || RNMaps;
  PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE ?? "google";
}

const StubMap = (props: any) => (
  <View
    style={
      Array.isArray(props.style)
        ? props.style
        : [props.style]
    }
    pointerEvents="box-none"
  >
    <View style={{ flex: 1, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#374151" }}>Map is not available on web</Text>
    </View>
    {props.children}
  </View>
);

const MapView = React.forwardRef((props: any, ref: any) => {
  if (Platform.OS === "web") return <StubMap ref={ref} {...props} />;
  const C = NativeMap;
  return <C ref={ref} {...props} />;
});
MapView.displayName = "MapView";

const Marker = (props: any) => {
  if (Platform.OS === "web") return <View>{props.children}</View>;
  const C = NativeMarker;
  return <C {...props} />;
};

const Polyline = (props: any) => {
  if (Platform.OS === "web") return null;
  const C = NativePolyline;
  return <C {...props} />;
};

export default MapView;
export { Marker, Polyline, PROVIDER_GOOGLE };
// Basic type exports to satisfy files that import types from 'react-native-maps'
export type Region = any;
