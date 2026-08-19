import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import * as Location from "expo-location";
import { AppleMaps, GoogleMaps } from "expo-maps";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

export default function GeoLocation() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          setLoading(false);
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation(current);
      } catch (err) {
        setErrorMsg(err?.message ?? "Failed to get location");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const coordinates = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
    : { latitude: 14.5995, longitude: 120.9842 }; // fallback: Manila

  const mapProps = {
    ref: mapRef,
    style: { flex: 1 },
    cameraPosition: {
      coordinates,
      zoom: 15,
    },
  };

  // Recenter the map on the current location
  const recenter = async () => {
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(current);

      mapRef.current?.setCameraPosition({
        coordinates: {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        },
        zoom: 15,
      });
    } catch (err) {
      setErrorMsg(err?.message ?? "Failed to get location");
    }
  };

  return (
    <View className="flex-1 bg-[#0F1620]">
      <View className="absolute inset-0">
        {Platform.OS === "android" ? (
          <GoogleMaps.View
            {...mapProps}
            colorScheme="FOLLOW_SYSTEM"
            properties={{
              isBuildingEnabled: true,
              isIndoorEnabled: true,
              isTrafficEnabled: false,
              isMyLocationEnabled: true,
              mapType: "NORMAL",
            }}
            uiSettings={{
              compassEnabled: true,
              zoomControlsEnabled: false,
              zoomGesturesEnabled: true,
              scrollGesturesEnabled: true,
              rotationGesturesEnabled: true,
              tiltGesturesEnabled: true,
              myLocationButtonEnabled: false,
            }}
          />
        ) : Platform.OS === "ios" ? (
          <AppleMaps.View
            {...mapProps}
            properties={{
              isMyLocationEnabled: true,
            }}
            uiSettings={{
              myLocationButtonEnabled: false,
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-[#1A2330]">
            <FontAwesome6
              name="map-location-dot"
              size={55}
              color="#3B82F6"
              iconStyle="solid"
            />

            <Text className="mt-4 text-lg font-semibold text-white">Map</Text>

            <Text className="mt-1 text-sm text-gray-500">
              Maps are available on Android and iOS
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Information Card + Locate button, in a row */}
      <View className="absolute top-5 left-5 right-5 z-10 flex-row items-center">
        <View className="flex-1 flex-row items-center rounded-2xl border border-white/5 bg-[#141B26]/95 p-4">
          <View
            className={`h-10 w-10 items-center justify-center rounded-full ${
              errorMsg ? "bg-red-500/15" : "bg-green-500/15"
            }`}>
            <FontAwesome6
              name="location-dot"
              size={16}
              color={errorMsg ? "#EF4444" : "#22C55E"}
              iconStyle="solid"
            />
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-white">
              Current Location
            </Text>

            <Text className="mt-1 text-xs text-gray-400">
              {loading
                ? "Fetching your location..."
                : errorMsg
                  ? errorMsg
                  : `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={recenter}
          className="ml-3 h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-[#141B26]/95">
          <FontAwesome6
            name="location-crosshairs"
            size={16}
            color="#3B82F6"
            iconStyle="solid"
          />
        </Pressable>
      </View>
    </View>
  );
}
