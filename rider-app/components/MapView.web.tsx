import React from "react";
import { View, Text } from "react-native";

// Web stub for MapView. Keeps the same named exports so app code can import
// from './MapView' and the bundler will resolve this file on web.

const MapView = React.forwardRef((props: any, ref: any) => (
  <View style={props.style} pointerEvents="box-none" ref={ref}>
    <View style={{ flex: 1, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#374151" }}>Map is not available on web</Text>
    </View>
    {props.children}
  </View>
));
MapView.displayName = "MapView";

const Marker = (props: any) => <View>{props.children}</View>;
const Polyline = (_props: any) => null;
const PROVIDER_GOOGLE = "google";

export default MapView;
export { Marker, Polyline, PROVIDER_GOOGLE };
export type Region = any;
