import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import * as Location from "expo-location";
import { AppleMaps, GoogleMaps } from "expo-maps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

/* =========================================================
   HELPERS
========================================================= */

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
  if (m2 >= 1_000_000) {
    return `${(m2 / 1_000_000).toFixed(2)} km²`;
  }

  if (m2 >= 10_000) {
    return `${(m2 / 10_000).toFixed(2)} ha`;
  }

  return `${Math.round(m2)} m²`;
}

function centroid(points) {
  if (!points.length) {
    return {
      latitude: 14.5995,
      longitude: 120.9842,
    };
  }

  const lat =
    points.reduce((sum, point) => sum + point.latitude, 0) / points.length;

  const lng =
    points.reduce((sum, point) => sum + point.longitude, 0) / points.length;

  return {
    latitude: lat,
    longitude: lng,
  };
}

function initialsFor(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/* =========================================================
   MOCK EMPLOYEES
========================================================= */

const MOCK_EMPLOYEES = [
  {
    id: "e1",
    name: "Ana Reyes",
    role: "Field Technician",
  },
  {
    id: "e2",
    name: "Marco Cruz",
    role: "Site Supervisor",
  },
  {
    id: "e3",
    name: "Liza Santos",
    role: "Field Technician",
  },
  {
    id: "e4",
    name: "Paolo Garcia",
    role: "Dispatcher",
  },
  {
    id: "e5",
    name: "Kim Dela Torre",
    role: "Field Technician",
  },
  {
    id: "e6",
    name: "Ramon Ibarra",
    role: "Site Supervisor",
  },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function GeoLocation() {
  /* =======================================================
     LOCATION
  ======================================================= */

  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef(null);

  /* =======================================================
     DRAWING
  ======================================================= */

  const [drawMode, setDrawMode] = useState(false);
  const [points, setPoints] = useState([]);

  /* =======================================================
     SAVED GEOFENCES
  ======================================================= */

  const [savedGeofences, setSavedGeofences] = useState([]);

  const [showList, setShowList] = useState(false);

  const [activeGeofenceId, setActiveGeofenceId] = useState(null);

  /* =======================================================
     SAVE MODAL
  ======================================================= */

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [nameInput, setNameInput] = useState("");

  /* =======================================================
     EMPLOYEE MODAL
  ======================================================= */

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const [employeeModalGeofenceId, setEmployeeModalGeofenceId] = useState(null);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  const [employeeSearch, setEmployeeSearch] = useState("");

  /* =======================================================
     GET LOCATION
  ======================================================= */

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setErrorMsg("Location permission was denied.");
          setLoading(false);
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation(current);
      } catch (err) {
        setErrorMsg(err?.message ?? "Failed to get your current location.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* =======================================================
     CURRENT COORDINATES
  ======================================================= */

  const coordinates = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
    : {
        latitude: 14.5995,
        longitude: 120.9842,
      };

  /* =======================================================
     MAP PROPERTIES
  ======================================================= */

  const mapProps = {
    ref: mapRef,
    style: {
      flex: 1,
    },
    cameraPosition: {
      coordinates,
      zoom: 15,
    },
  };

  /* =======================================================
     RECENTER
  ======================================================= */

  const recenter = async () => {
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(current);
      setErrorMsg(null);

      mapRef.current?.setCameraPosition({
        coordinates: {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        },
        zoom: 15,
      });
    } catch (err) {
      setErrorMsg(err?.message ?? "Failed to get current location.");
    }
  };

  /* =======================================================
     MAP CLICK
  ======================================================= */

  const handleMapClick = useCallback(
    (event) => {
      if (!drawMode) return;

      const c = event?.coordinates;

      if (c?.latitude == null || c?.longitude == null) {
        return;
      }

      setPoints((prev) => [
        ...prev,
        {
          latitude: c.latitude,
          longitude: c.longitude,
        },
      ]);
    },
    [drawMode],
  );

  /* =======================================================
     DRAWING ACTIONS
  ======================================================= */

  const undoPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const clearPoints = () => {
    Alert.alert(
      "Clear Geofence",
      "Remove all points from the current drawing?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setPoints([]);
            setActiveGeofenceId(null);
          },
        },
      ],
    );
  };

  /* =======================================================
     SAVE GEOFENCE
  ======================================================= */

  const openSaveModal = () => {
    if (points.length < 3) {
      Alert.alert(
        "More Points Required",
        "A geofence needs at least 3 points.",
      );

      return;
    }

    setNameInput(`Geofence ${savedGeofences.length + 1}`);

    setShowSaveModal(true);
  };

  const confirmSave = () => {
    const name = nameInput.trim() || `Geofence ${savedGeofences.length + 1}`;

    const newEntry = {
      id: Date.now().toString(),
      name,
      points,
      area: polygonAreaMeters(points),
      createdAt: new Date(),
      employeeIds: [],
    };

    setSavedGeofences((prev) => [newEntry, ...prev]);

    setShowSaveModal(false);

    setActiveGeofenceId(newEntry.id);

    setShowList(true);

    setDrawMode(false);

    setTimeout(() => {
      openEmployeeModal(newEntry);
    }, 250);
  };

  /* =======================================================
     DELETE GEOFENCE
  ======================================================= */

  const deleteGeofence = (id) => {
    const geofence = savedGeofences.find((g) => g.id === id);

    Alert.alert(
      "Delete Geofence",
      `Are you sure you want to delete "${geofence?.name ?? "this geofence"}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSavedGeofences((prev) => prev.filter((g) => g.id !== id));

            if (activeGeofenceId === id) {
              setActiveGeofenceId(null);
              setPoints([]);
            }
          },
        },
      ],
    );
  };

  /* =======================================================
     LOAD GEOFENCE
  ======================================================= */

  const loadGeofence = (geofence) => {
    setPoints(geofence.points);

    setActiveGeofenceId(geofence.id);

    setDrawMode(false);

    setShowList(false);

    const c = centroid(geofence.points);

    mapRef.current?.setCameraPosition({
      coordinates: c,
      zoom: 15,
    });
  };

  /* =======================================================
     EMPLOYEE ASSIGNMENT
  ======================================================= */

  const openEmployeeModal = (geofence) => {
    setEmployeeModalGeofenceId(geofence.id);

    setSelectedEmployeeIds(geofence.employeeIds ?? []);

    setEmployeeSearch("");

    setShowEmployeeModal(true);
  };

  const toggleEmployeeSelected = (employeeId) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const selectAllEmployees = () => {
    if (selectedEmployeeIds.length === MOCK_EMPLOYEES.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(MOCK_EMPLOYEES.map((employee) => employee.id));
    }
  };

  const confirmEmployeeAssignment = () => {
    setSavedGeofences((prev) =>
      prev.map((geofence) =>
        geofence.id === employeeModalGeofenceId
          ? {
              ...geofence,
              employeeIds: selectedEmployeeIds,
            }
          : geofence,
      ),
    );

    setShowEmployeeModal(false);

    setEmployeeModalGeofenceId(null);
  };

  /* =======================================================
     EMPLOYEE SEARCH
  ======================================================= */

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();

    if (!q) return MOCK_EMPLOYEES;

    return MOCK_EMPLOYEES.filter(
      (employee) =>
        employee.name.toLowerCase().includes(q) ||
        employee.role.toLowerCase().includes(q),
    );
  }, [employeeSearch]);

  /* =======================================================
     ACTIVE EMPLOYEE MODAL GEOFENCE
  ======================================================= */

  const employeeModalGeofence = useMemo(
    () => savedGeofences.find((g) => g.id === employeeModalGeofenceId),
    [savedGeofences, employeeModalGeofenceId],
  );

  /* =======================================================
     MAP MARKERS
  ======================================================= */

  const markers = useMemo(
    () =>
      points.map((point, index) => ({
        id: `point-${index}`,
        coordinates: point,
        title: `Point ${index + 1}`,
      })),
    [points],
  );

  /* =======================================================
     POLYLINES
  ======================================================= */

  const polylines = useMemo(() => {
    if (points.length < 2) return [];

    return [
      {
        id: "draw-line",
        coordinates: points,
        color: "#3B82F6",
        width: 3,
      },
    ];
  }, [points]);

  /* =======================================================
     POLYGONS
  ======================================================= */

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

  /* =======================================================
     AREA
  ======================================================= */

  const area = points.length >= 3 ? polygonAreaMeters(points) : 0;

  const areaLabel = points.length >= 3 ? formatArea(area) : null;

  const canSave = points.length >= 3;

  /* =======================================================
     LOCATION DISPLAY
  ======================================================= */

  const locationText = loading
    ? "Fetching your location..."
    : errorMsg
      ? errorMsg
      : `${coordinates.latitude.toFixed(
          5,
        )}, ${coordinates.longitude.toFixed(5)}`;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <View className="flex-1 bg-[#0F1620]">
      {/* =================================================
          MAP
      ================================================= */}

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

            <Text className="mt-4 text-lg font-bold text-white">Maps</Text>

            <Text className="mt-1 text-sm text-gray-500">
              Maps are available on Android and iOS
            </Text>
          </View>
        )}
      </View>

      {/* =================================================
          TOP OVERLAY
      ================================================= */}

      <View className="absolute left-4 right-4 top-4 z-10">
        {/* =================================================
            LOCATION HEADER
        ================================================= */}

        <View className="flex-row items-center">
          {/* Location card */}

          <View className="flex-1 flex-row items-center rounded-2xl border border-white/10 bg-[#141B26]/95 px-4 py-3">
            <View
              className={`h-10 w-10 items-center justify-center rounded-xl ${
                errorMsg ? "bg-red-500/15" : "bg-blue-500/15"
              }`}>
              <FontAwesome6
                name="location-dot"
                size={16}
                color={errorMsg ? "#EF4444" : "#3B82F6"}
                iconStyle="solid"
              />
            </View>

            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="text-xs font-bold text-white">
                  Current Location
                </Text>

                {!errorMsg && !loading && (
                  <View className="ml-2 h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </View>

              <Text
                numberOfLines={1}
                className={`mt-1 text-[10px] ${
                  errorMsg ? "text-red-400" : "text-gray-400"
                }`}>
                {locationText}
              </Text>
            </View>
          </View>

          {/* Saved */}

          <Pressable
            onPress={() => setShowList((value) => !value)}
            className={`ml-2 h-12 w-12 items-center justify-center rounded-2xl border border-white/10 ${
              showList ? "bg-blue-500" : "bg-[#141B26]/95"
            }`}>
            <FontAwesome6
              name="layer-group"
              size={15}
              color={showList ? "#FFFFFF" : "#60A5FA"}
              iconStyle="solid"
            />

            {savedGeofences.length > 0 && (
              <View className="absolute -right-1 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1">
                <Text className="text-[9px] font-bold text-white">
                  {savedGeofences.length}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Recenter */}

          <Pressable
            onPress={recenter}
            className="ml-2 h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#141B26]/95">
            <FontAwesome6
              name="location-crosshairs"
              size={16}
              color="#60A5FA"
              iconStyle="solid"
            />
          </Pressable>
        </View>

        {/* =================================================
            DRAWING TOOLBAR
        ================================================= */}

        <View className="mt-3 rounded-2xl border border-white/10 bg-[#141B26]/95 p-3">
          {/* Toolbar top */}

          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center">
              <View
                className={`h-9 w-9 items-center justify-center rounded-xl ${
                  drawMode ? "bg-blue-500/20" : "bg-white/5"
                }`}>
                <FontAwesome6
                  name="draw-polygon"
                  size={14}
                  color={drawMode ? "#60A5FA" : "#9CA3AF"}
                  iconStyle="solid"
                />
              </View>

              <View className="ml-2">
                <Text className="text-xs font-bold text-white">
                  {drawMode ? "Drawing Geofence" : "Geofence Builder"}
                </Text>

                <Text className="mt-0.5 text-[10px] text-gray-500">
                  {drawMode
                    ? "Tap the map to add points"
                    : "Create a location boundary"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setDrawMode((value) => !value)}
              className={`rounded-xl px-3 py-2 ${
                drawMode ? "bg-blue-500" : "bg-white/5"
              }`}>
              <Text
                className={`text-[10px] font-bold ${
                  drawMode ? "text-white" : "text-gray-400"
                }`}>
                {drawMode ? "STOP" : "DRAW"}
              </Text>
            </Pressable>
          </View>

          {/* =================================================
              POINT STATUS
          ================================================= */}

          <View className="mt-3 flex-row items-center rounded-xl bg-[#0F1620] px-3 py-2.5">
            <View className="flex-1">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                Boundary
              </Text>

              <Text className="mt-1 text-xs font-semibold text-white">
                {points.length === 0
                  ? "No points added"
                  : `${points.length} point${points.length !== 1 ? "s" : ""}`}
              </Text>
            </View>

            <View className="mr-3 h-8 w-px bg-white/10" />

            <View className="mr-3">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                Area
              </Text>

              <Text className="mt-1 text-xs font-semibold text-blue-400">
                {areaLabel ?? "--"}
              </Text>
            </View>

            {/* Undo */}

            <Pressable
              onPress={undoPoint}
              disabled={points.length === 0}
              className={`h-8 w-8 items-center justify-center rounded-lg ${
                points.length ? "bg-white/10" : "bg-white/5"
              }`}>
              <FontAwesome6
                name="rotate-left"
                size={11}
                color={points.length ? "#D1D5DB" : "#4B5563"}
                iconStyle="solid"
              />
            </Pressable>

            {/* Clear */}

            <Pressable
              onPress={clearPoints}
              disabled={points.length === 0}
              className={`ml-1.5 h-8 w-8 items-center justify-center rounded-lg ${
                points.length ? "bg-red-500/15" : "bg-white/5"
              }`}>
              <FontAwesome6
                name="trash"
                size={11}
                color={points.length ? "#F87171" : "#4B5563"}
                iconStyle="solid"
              />
            </Pressable>

            {/* Save */}

            <Pressable
              onPress={openSaveModal}
              disabled={!canSave}
              className={`ml-1.5 h-8 w-8 items-center justify-center rounded-lg ${
                canSave ? "bg-green-500" : "bg-white/5"
              }`}>
              <FontAwesome6
                name="floppy-disk"
                size={11}
                color={canSave ? "#FFFFFF" : "#4B5563"}
                iconStyle="solid"
              />
            </Pressable>
          </View>

          {/* Hint */}

          {drawMode && (
            <View className="mt-2 flex-row items-center">
              <FontAwesome6
                name="circle-info"
                size={10}
                color="#60A5FA"
                iconStyle="solid"
              />

              <Text className="ml-2 text-[10px] text-blue-300">
                Add at least 3 points to create a geofence.
              </Text>
            </View>
          )}
        </View>

        {/* =================================================
            SAVED GEOFENCES
        ================================================= */}

        {showList && (
          <View className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#141B26]/95">
            {/* Header */}

            <View className="flex-row items-center border-b border-white/10 px-4 py-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-white">
                  Saved Geofences
                </Text>

                <Text className="mt-0.5 text-[10px] text-gray-500">
                  Manage your location boundaries
                </Text>
              </View>

              <View className="rounded-full bg-blue-500/15 px-2.5 py-1">
                <Text className="text-[10px] font-bold text-blue-400">
                  {savedGeofences.length}
                </Text>
              </View>
            </View>

            {savedGeofences.length === 0 ? (
              <View className="items-center px-5 py-8">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                  <FontAwesome6
                    name="draw-polygon"
                    size={18}
                    color="#4B5563"
                    iconStyle="solid"
                  />
                </View>

                <Text className="mt-3 text-xs font-semibold text-gray-400">
                  No saved geofences
                </Text>

                <Text className="mt-1 text-center text-[10px] text-gray-600">
                  Draw a boundary on the map and save it here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={savedGeofences}
                keyExtractor={(item) => item.id}
                style={{
                  maxHeight: 310,
                }}
                renderItem={({ item }) => {
                  const empCount = item.employeeIds?.length ?? 0;

                  const active = activeGeofenceId === item.id;

                  return (
                    <Pressable
                      onPress={() => loadGeofence(item)}
                      className={`border-b border-white/5 px-4 py-3 ${
                        active ? "bg-blue-500/10" : ""
                      }`}>
                      <View className="flex-row items-center">
                        {/* Icon */}

                        <View
                          className={`h-9 w-9 items-center justify-center rounded-xl ${
                            active ? "bg-blue-500/20" : "bg-white/5"
                          }`}>
                          <FontAwesome6
                            name="draw-polygon"
                            size={13}
                            color={active ? "#60A5FA" : "#6B7280"}
                            iconStyle="solid"
                          />
                        </View>

                        {/* Info */}

                        <View className="ml-3 flex-1">
                          <View className="flex-row items-center">
                            <Text
                              numberOfLines={1}
                              className="flex-1 text-xs font-bold text-white">
                              {item.name}
                            </Text>

                            {active && (
                              <View className="ml-2 rounded-full bg-blue-500/15 px-2 py-0.5">
                                <Text className="text-[8px] font-bold text-blue-400">
                                  ACTIVE
                                </Text>
                              </View>
                            )}
                          </View>

                          <Text className="mt-1 text-[10px] text-gray-500">
                            {item.points.length} points
                            {" • "}
                            {formatArea(item.area)}
                          </Text>
                        </View>

                        {/* Staff */}

                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation?.();

                            openEmployeeModal(item);
                          }}
                          hitSlop={8}
                          className={`mr-2 h-8 min-w-8 flex-row items-center justify-center rounded-lg px-2 ${
                            empCount ? "bg-blue-500/15" : "bg-white/5"
                          }`}>
                          <FontAwesome6
                            name={empCount ? "user-check" : "user-plus"}
                            size={10}
                            color={empCount ? "#60A5FA" : "#9CA3AF"}
                            iconStyle="solid"
                          />

                          {empCount > 0 && (
                            <Text className="ml-1 text-[9px] font-bold text-blue-400">
                              {empCount}
                            </Text>
                          )}
                        </Pressable>

                        {/* Delete */}

                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation?.();

                            deleteGeofence(item.id);
                          }}
                          hitSlop={8}
                          className="h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                          <FontAwesome6
                            name="trash"
                            size={10}
                            color="#F87171"
                            iconStyle="solid"
                          />
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>

      {/* =================================================
          SAVE GEOFENCE MODAL
      ================================================= */}

      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#141B26]">
            {/* Header */}

            <View className="border-b border-white/10 px-5 py-5">
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                  <FontAwesome6
                    name="draw-polygon"
                    size={15}
                    color="#60A5FA"
                    iconStyle="solid"
                  />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-white">
                    Save Geofence
                  </Text>

                  <Text className="mt-1 text-[10px] text-gray-500">
                    Create a reusable location boundary
                  </Text>
                </View>

                <Pressable
                  onPress={() => setShowSaveModal(false)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-white/5">
                  <FontAwesome6
                    name="xmark"
                    size={12}
                    color="#9CA3AF"
                    iconStyle="solid"
                  />
                </Pressable>
              </View>
            </View>

            {/* Body */}

            <View className="px-5 py-5">
              {/* Stats */}

              <View className="flex-row">
                <View className="flex-1 rounded-xl bg-[#0F1620] p-3">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                    Points
                  </Text>

                  <Text className="mt-1 text-sm font-bold text-white">
                    {points.length}
                  </Text>
                </View>

                <View className="ml-2 flex-1 rounded-xl bg-[#0F1620] p-3">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                    Area
                  </Text>

                  <Text className="mt-1 text-sm font-bold text-blue-400">
                    {formatArea(area)}
                  </Text>
                </View>
              </View>

              {/* Name */}

              <Text className="mt-5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Geofence Name
              </Text>

              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter geofence name"
                placeholderTextColor="#4B5563"
                autoFocus
                className="mt-2 rounded-xl border border-white/10 bg-[#0F1620] px-4 py-3.5 text-sm text-white"
              />
            </View>

            {/* Footer */}

            <View className="flex-row border-t border-white/10 px-5 py-4">
              <Pressable
                onPress={() => setShowSaveModal(false)}
                className="flex-1 items-center justify-center rounded-xl bg-white/5 py-3">
                <Text className="text-xs font-bold text-gray-400">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmSave}
                className="ml-2 flex-1 flex-row items-center justify-center rounded-xl bg-blue-500 py-3">
                <FontAwesome6
                  name="floppy-disk"
                  size={11}
                  color="#FFFFFF"
                  iconStyle="solid"
                />

                <Text className="ml-2 text-xs font-bold text-white">
                  Save Geofence
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* =================================================
          EMPLOYEE ASSIGNMENT MODAL
      ================================================= */}

      <Modal
        visible={showEmployeeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmployeeModal(false)}>
        <View className="flex-1 justify-end bg-black/70">
          <View className="max-h-[88%] rounded-t-[32px] border-t border-white/10 bg-[#141B26]">
            {/* Handle */}

            <View className="items-center pt-3">
              <View className="h-1 w-10 rounded-full bg-white/20" />
            </View>

            {/* Header */}

            <View className="flex-row items-center px-5 py-5">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15">
                <FontAwesome6
                  name="users"
                  size={16}
                  color="#60A5FA"
                  iconStyle="solid"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-white">
                  Assign Employees
                </Text>

                <Text
                  numberOfLines={1}
                  className="mt-1 text-[10px] text-gray-500">
                  {employeeModalGeofence?.name ?? "Geofence"}
                </Text>
              </View>

              <View className="rounded-full bg-blue-500/15 px-2.5 py-1">
                <Text className="text-[10px] font-bold text-blue-400">
                  {selectedEmployeeIds.length} selected
                </Text>
              </View>
            </View>

            {/* Search */}

            <View className="px-5">
              <View className="flex-row items-center rounded-xl border border-white/10 bg-[#0F1620] px-3">
                <FontAwesome6
                  name="magnifying-glass"
                  size={12}
                  color="#6B7280"
                  iconStyle="solid"
                />

                <TextInput
                  value={employeeSearch}
                  onChangeText={setEmployeeSearch}
                  placeholder="Search employees..."
                  placeholderTextColor="#4B5563"
                  className="ml-2 flex-1 py-3 text-xs text-white"
                />

                {employeeSearch.length > 0 && (
                  <Pressable onPress={() => setEmployeeSearch("")}>
                    <FontAwesome6
                      name="xmark"
                      size={11}
                      color="#6B7280"
                      iconStyle="solid"
                    />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Select all */}

            <View className="flex-row items-center justify-between px-5 py-3">
              <Text className="text-[10px] font-semibold text-gray-500">
                {filteredEmployees.length} employees
              </Text>

              <Pressable
                onPress={selectAllEmployees}
                className="rounded-lg bg-blue-500/10 px-3 py-1.5">
                <Text className="text-[10px] font-bold text-blue-400">
                  {selectedEmployeeIds.length === MOCK_EMPLOYEES.length
                    ? "Clear All"
                    : "Select All"}
                </Text>
              </Pressable>
            </View>

            {/* Employee List */}

            <FlatList
              data={filteredEmployees}
              keyExtractor={(item) => item.id}
              style={{
                maxHeight: 390,
              }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 15,
              }}
              ItemSeparatorComponent={() => (
                <View className="h-px bg-white/5" />
              )}
              ListEmptyComponent={
                <View className="items-center py-10">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                    <FontAwesome6
                      name="user-slash"
                      size={16}
                      color="#4B5563"
                      iconStyle="solid"
                    />
                  </View>

                  <Text className="mt-3 text-xs font-semibold text-gray-500">
                    No employees found
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const selected = selectedEmployeeIds.includes(item.id);

                return (
                  <Pressable
                    onPress={() => toggleEmployeeSelected(item.id)}
                    className="flex-row items-center py-3">
                    {/* Avatar */}

                    <View
                      className={`h-10 w-10 items-center justify-center rounded-full ${
                        selected ? "bg-blue-500" : "bg-blue-500/15"
                      }`}>
                      <Text
                        className={`text-xs font-bold ${
                          selected ? "text-white" : "text-blue-400"
                        }`}>
                        {initialsFor(item.name)}
                      </Text>
                    </View>

                    {/* Details */}

                    <View className="ml-3 flex-1">
                      <Text className="text-xs font-bold text-white">
                        {item.name}
                      </Text>

                      <Text className="mt-1 text-[10px] text-gray-500">
                        {item.role}
                      </Text>
                    </View>

                    {/* Checkbox */}

                    <View
                      className={`h-6 w-6 items-center justify-center rounded-lg border ${
                        selected
                          ? "border-blue-500 bg-blue-500"
                          : "border-white/15 bg-transparent"
                      }`}>
                      {selected && (
                        <FontAwesome6
                          name="check"
                          size={10}
                          color="#FFFFFF"
                          iconStyle="solid"
                        />
                      )}
                    </View>
                  </Pressable>
                );
              }}
            />

            {/* Footer */}

            <View className="flex-row border-t border-white/10 px-5 py-4">
              <Pressable
                onPress={() => setShowEmployeeModal(false)}
                className="flex-1 items-center justify-center rounded-xl bg-white/5 py-3.5">
                <Text className="text-xs font-bold text-gray-400">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmEmployeeAssignment}
                className="ml-2 flex-1 flex-row items-center justify-center rounded-xl bg-blue-500 py-3.5">
                <FontAwesome6
                  name="user-check"
                  size={11}
                  color="#FFFFFF"
                  iconStyle="solid"
                />

                <Text className="ml-2 text-xs font-bold text-white">
                  Save Assignment
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
