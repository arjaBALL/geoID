import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { GoogleMaps } from "expo-maps";
import { Platform, Text, View } from "react-native";

export default function GeoLocation() {
  const mapProps = {
    style: { flex: 1 },
    cameraPosition: {
      coordinates: { latitude: 14.5995, longitude: 120.9842 },
      zoom: 12,
    },
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
              isMyLocationEnabled: false,
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
          <AppleMaps.View {...mapProps} />
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

      {/* Header */}
      <View className="absolute left-5 right-5 top-5 z-10">
        <View className="rounded-2xl border border-white/5 bg-[#141B26]/95 p-4">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
              <FontAwesome6
                name="location-dot"
                size={17}
                color="#3B82F6"
                iconStyle="solid"
              />
            </View>

            <View className="ml-3">
              <Text className="text-lg font-bold text-white">Geo Location</Text>

              <Text className="text-sm text-gray-400">Employee locations</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Information Card */}
      <View className="absolute bottom-5 left-5 right-5 z-10 rounded-2xl border border-white/5 bg-[#141B26]/95 p-4">
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-green-500/15">
            <FontAwesome6
              name="location-dot"
              size={16}
              color="#22C55E"
              iconStyle="solid"
            />
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-white">
              Current Location
            </Text>

            <Text className="mt-1 text-xs text-gray-400">
              Location data will appear here
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
