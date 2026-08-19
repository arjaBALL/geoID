import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import * as Location from "expo-location";
import { AppleMaps, GoogleMaps } from "expo-maps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

// Rough planar area estimate (meters^2) via shoelace formula on an
// equirectangular projection centered at the first point. Good enough
// for typical geofence sizes (neighborhood-scale), not for huge regions.
function polygonAreaMeters(coords) {
  if (coords.length < 3) return 0;
  const R = 6378137;
  const toRad = (d) => (d * Math.PI) / 180;
  const lat0 = toRad(coords[0].latitude);

  const pts = coords.map((c) => ({
    x: R * toRad(c.longitude) * Math.cos(lat0),
    y: R * toRad(c.latitude),
  }));

  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area / 2);
}

function formatArea(m2) {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`;
  return `${Math.round(m2)} m²`;
}

export default function GeoLocation() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Geofence drawing state
  const [drawMode, setDrawMode] = useState(false);
  const [points, setPoints] = useState([]); // [{ latitude, longitude }]

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

  // Add a pin wherever the user taps, only while in draw mode
  const handleMapClick = useCallback(
    (event) => {
      if (!drawMode) return;
      const c = event?.coordinates;
      if (c?.latitude == null || c?.longitude == null) return;
      setPoints((prev) => [
        ...prev,
        { latitude: c.latitude, longitude: c.longitude },
      ]);
    },
    [drawMode],
  );

  const undoPoint = () => setPoints((prev) => prev.slice(0, -1));
  const clearPoints = () => setPoints([]);

  // Markers for every pinned point
  const markers = useMemo(
    () =>
      points.map((p, i) => ({
        id: `pt-${i}`,
        coordinates: p,
        title: `Point ${i + 1}`,
      })),
    [points],
  );

  // While only 2 points exist, show a line. Once 3+, render as a closed polygon.
  const polylines = useMemo(() => {
    if (points.length !== 2) return [];
    return [
      {
        id: "draw-line",
        coordinates: points,
        color: "#3B82F6",
        width: 3,
      },
    ];
  }, [points]);

  const polygons = useMemo(() => {
    if (points.length < 3) return [];
    return [
      {
        id: "geofence",
        coordinates: points,
        color: "#3B82F633",
        lineColor: "#3B82F6",
        lineWidth: 3,
      },
    ];
  }, [points]);

  const areaLabel =
    points.length >= 3 ? formatArea(polygonAreaMeters(points)) : null;

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
            markers={markers}
            polylines={polylines}
            polygons={polygons}
            onMapClick={handleMapClick}
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
            markers={markers}
            polylines={polylines}
            polygons={polygons}
            onMapClick={handleMapClick}
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

      {/* Top row: Info card + Locate button */}
      <View className="absolute top-20 left-5 right-5 z-10 flex-row items-center">
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

      {/* Bottom row: Geofence drawing toolbar */}
      <View className="absolute top-40 left-5 right-5 z-10 flex-row items-center justify-between rounded-2xl border border-white/5 bg-[#141B26]/95 p-3">
        <Pressable
          onPress={() => setDrawMode((v) => !v)}
          className={`flex-row items-center rounded-xl px-3 py-2 ${
            drawMode ? "bg-blue-500/20" : "bg-white/5"
          }`}>
          <FontAwesome6
            name="draw-polygon"
            size={14}
            color={drawMode ? "#3B82F6" : "#9CA3AF"}
            iconStyle="solid"
          />
          <Text
            className={`ml-2 text-xs font-semibold ${
              drawMode ? "text-blue-400" : "text-gray-400"
            }`}>
            {drawMode ? "Tap map to pin" : "Draw Geofence"}
          </Text>
        </Pressable>

        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-400">
            {points.length === 0
              ? "No points yet"
              : `${points.length} point${points.length > 1 ? "s" : ""}${
                  areaLabel ? ` · ${areaLabel}` : ""
                }`}
          </Text>
        </View>

        <Pressable
          onPress={undoPoint}
          disabled={points.length === 0}
          className={`ml-2 h-9 w-9 items-center justify-center rounded-full ${
            points.length === 0 ? "bg-white/5" : "bg-white/10"
          }`}>
          <FontAwesome6
            name="rotate-left"
            size={13}
            color={points.length === 0 ? "#4B5563" : "#E5E7EB"}
            iconStyle="solid"
          />
        </Pressable>

        <Pressable
          onPress={clearPoints}
          disabled={points.length === 0}
          className={`ml-2 h-9 w-9 items-center justify-center rounded-full ${
            points.length === 0 ? "bg-white/5" : "bg-red-500/15"
          }`}>
          <FontAwesome6
            name="trash"
            size={13}
            color={points.length === 0 ? "#4B5563" : "#EF4444"}
            iconStyle="solid"
          />
        </Pressable>
      </View>
    </View>
  );
}
