import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import GlassCard from "../_components/GlassCard";
import { useAuth } from "../_context/AuthContext";
import { supabase } from "../_lib/supabase";

/* =========================================================
   HELPERS
========================================================= */

// Ray-casting point-in-polygon check
function pointInPolygon(point, polygon) {
  const { latitude: y, longitude: x } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function centroid(points) {
  const lat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;

  return { latitude: lat, longitude: lng };
}

function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function MenuItem({ icon, label, onPress, danger }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:bg-white/[0.06]">
      <FontAwesome6
        name={icon}
        size={14}
        color={danger ? "#F87171" : "#CBD5E1"}
        iconStyle="solid"
      />
      <Text
        className={
          danger
            ? "font-outfit-medium text-sm text-red-400"
            : "font-outfit-medium text-sm text-slate-200"
        }>
        {label}
      </Text>
    </Pressable>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Home() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [visible, setVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.45)).current;

  /* =======================================================
     LOGGED-IN EMPLOYEE'S BIOMETRIC NUMBER
  ======================================================= */

  const [biometricNo, setBiometricNo] = useState(null);
  const [biometricLoading, setBiometricLoading] = useState(true);
  const [biometricError, setBiometricError] = useState(null);

  const fetchBiometricNo = useCallback(async () => {
    if (!authUser?.id) {
      setBiometricLoading(false);
      return;
    }

    try {
      setBiometricLoading(true);
      setBiometricError(null);

      const { data, error } = await supabase
        .from("users")
        .select("biometric_no")
        .eq("auth_id", authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!data?.biometric_no) {
        setBiometricError("No biometric number is linked to your account.");
        setBiometricNo(null);
        return;
      }

      setBiometricNo(data.biometric_no);
    } catch (err) {
      setBiometricError(err?.message ?? "Failed to load your profile.");
      setBiometricNo(null);
    } finally {
      setBiometricLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchBiometricNo();
  }, [fetchBiometricNo]);

  /* =======================================================
     LAST PUNCH STATUS (IN / OUT) — prevents duplicate punches
  ======================================================= */

  // null = unknown yet, 0 = currently punched IN, 1 = currently punched OUT
  const [lastCheckType, setLastCheckType] = useState(null);
  const [lastCheckLoading, setLastCheckLoading] = useState(true);
  const [lastCheckError, setLastCheckError] = useState(null);
  const [punching, setPunching] = useState(false); // guards against double-taps

  const fetchLastCheckType = useCallback(async () => {
    if (!biometricNo) {
      setLastCheckLoading(false);
      return;
    }

    try {
      setLastCheckLoading(true);
      setLastCheckError(null);

      const { data, error } = await supabase
        .from("raw_logs")
        .select("check_type")
        .eq("biometric_no", biometricNo)
        .order("punch_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // No prior log at all means the employee has never punched in,
      // so treat them as "OUT" (eligible to punch IN next).
      setLastCheckType(data?.check_type ?? 1);
    } catch (err) {
      setLastCheckError(err?.message ?? "Failed to load punch status.");
    } finally {
      setLastCheckLoading(false);
    }
  }, [biometricNo]);

  useEffect(() => {
    fetchLastCheckType();
  }, [fetchLastCheckType]);

  const isPunchedIn = lastCheckType === 0;

  /* =======================================================
     GEOFENCES ASSIGNED TO THIS EMPLOYEE
  ======================================================= */

  const [geofences, setGeofences] = useState([]);
  const [geofencesLoading, setGeofencesLoading] = useState(true);
  const [geofencesError, setGeofencesError] = useState(null);

  const fetchAssignedGeofences = useCallback(async () => {
    try {
      setGeofencesLoading(true);
      setGeofencesError(null);

      // TESTING MODE: no auth — just pull every active geofence
      const { data, error } = await supabase
        .from("geofences")
        .select("id, name, points, is_active")
        .eq("is_active", true);

      if (error) throw error;

      const mapped = (data ?? []).filter((g) => g.points?.length >= 3);

      setGeofences(mapped);
    } catch (err) {
      setGeofencesError(err?.message ?? "Failed to load geofences.");
      setGeofences([]);
    } finally {
      setGeofencesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedGeofences();
  }, [fetchAssignedGeofences]);

  /* =======================================================
     LIVE LOCATION
  ======================================================= */

  const [coords, setCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    let subscription;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLocationError("Location permission was denied.");
          setLocationLoading(false);
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 4000,
            distanceInterval: 5,
          },
          (position) => {
            setCoords(position.coords);
            setLocationError(null);
            setLocationLoading(false);
          },
        );
      } catch (err) {
        setLocationError(err?.message ?? "Failed to get your location.");
        setLocationLoading(false);
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  /* =======================================================
     GEOFENCE STATUS
  ======================================================= */

  const status = useMemo(() => {
    if (!coords || geofences.length === 0) {
      return {
        inside: false,
        geofence: null,
        nearest: null,
        distance: null,
      };
    }

    const point = { latitude: coords.latitude, longitude: coords.longitude };

    const matched = geofences.find((g) => pointInPolygon(point, g.points));

    if (matched) {
      return {
        inside: true,
        geofence: matched,
        nearest: null,
        distance: distanceMeters(point, centroid(matched.points)),
      };
    }

    let nearest = null;
    let nearestDistance = Infinity;

    geofences.forEach((g) => {
      const d = distanceMeters(point, centroid(g.points));

      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = g;
      }
    });

    return {
      inside: false,
      geofence: null,
      nearest,
      distance: nearest ? nearestDistance : null,
    };
  }, [coords, geofences]);

  /* =======================================================
     PUNCH ELIGIBILITY
  ======================================================= */

  const isBusy =
    locationLoading || geofencesLoading || biometricLoading || lastCheckLoading;

  const blockReason = locationError
    ? locationError
    : geofencesError
      ? geofencesError
      : biometricError
        ? biometricError
        : lastCheckError
          ? lastCheckError
          : geofences.length === 0
            ? "You're not assigned to any geofence yet."
            : !status.inside
              ? "You're outside your assigned attendance area."
              : null;

  // Blocked entirely while a punch request is in flight — this is what
  // stops a double-tap (or slow network) from firing two inserts in a row.
  const canPunch = !isBusy && !blockReason && !!biometricNo && !punching;

  /* =======================================================
     PULSE ANIMATION (only runs while eligible)
  ======================================================= */

  useEffect(() => {
    if (!canPunch) {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.45);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.75,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.45,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [canPunch, pulseAnim, glowAnim]);

  /* =======================================================
     PUNCH HANDLER
  ======================================================= */

  const handlePunch = async () => {
    if (!canPunch) {
      // If the button was tappable a moment ago and this fires anyway
      // (e.g. a second tap landed while the first request was in flight),
      // punching is the reason — everything else already disables the button.
      if (punching) return;

      Alert.alert(
        "Can't Punch In",
        blockReason ?? "You need to be inside your assigned area.",
      );
      return;
    }

    // Lock the button immediately so a fast double-tap can't slip a second
    // insert through before this request finishes.
    setPunching(true);

    try {
      const nextCheckType = isPunchedIn ? 1 : 0; // 0=IN, 1=OUT — flips current state

      const { error } = await supabase.from("raw_logs").insert({
        biometric_no: biometricNo,
        punch_time: new Date().toISOString(),
        status: 1,
        check_type: nextCheckType,
        verify_mode: 1,
        work_code: 0,
      });

      if (error) throw error;

      // Update local status immediately — no need to re-fetch, and this
      // is what actually prevents "punch IN" from being tappable twice
      // in a row: the button now reflects "currently IN" right away.
      setLastCheckType(nextCheckType);

      Alert.alert(
        "Success",
        nextCheckType === 0 ? "Punched in!" : "Punched out!",
      );
    } catch (err) {
      Alert.alert("Error", err?.message ?? "Failed to record punch.");
    } finally {
      setPunching(false);
    }
  };

  /* =======================================================
     PROFILE MENU HANDLER
  ======================================================= */

  const handleLogout = async () => {
    setVisible(false);
    await supabase.auth.signOut();
    router.replace("/");
  };

  /* =======================================================
     DISPLAY TEXT
  ======================================================= */

  const badgeLabel = isBusy
    ? "CHECKING…"
    : status.inside
      ? "INSIDE GEOFENCE"
      : "OUTSIDE GEOFENCE";

  const badgeColor = isBusy ? "#94A3B8" : status.inside ? "#38BDF8" : "#F87171";

  const areaName = isBusy
    ? "Checking your location…"
    : status.inside
      ? status.geofence?.name
      : geofences.length === 0
        ? "No geofence assigned"
        : "Outside allowed area";

  const areaCaption = isBusy
    ? "Please wait a moment."
    : status.inside
      ? "You're within the allowed attendance area."
      : geofences.length === 0
        ? "Ask your admin to assign you to a geofence."
        : "Move inside your assigned area to punch in.";

  const distanceLabel =
    status.distance != null
      ? `${Math.round(status.distance)}m ${
          status.inside
            ? "from center"
            : `from ${status.nearest?.name ?? "area"}`
        }`
      : "--";

  const accuracyLabel =
    coords?.accuracy != null
      ? `±${Math.round(coords.accuracy)}m accuracy`
      : "--";

  return (
    <ScrollView
      className="flex-1 bg-[#0B111A]"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="mb-6 flex-row items-center justify-between mt-10">
        <View>
          <Text className="font-inter-light text-sm text-slate-400">
            Good morning,
          </Text>

          <Text className="mt-1 font-outfit-bold text-2xl text-white">
            Welcome back 👋
          </Text>
        </View>

        <Pressable
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"
          onPress={() => setVisible(true)}>
          <FontAwesome6
            name="user"
            size={16}
            color="#CBD5E1"
            iconStyle="solid"
          />
        </Pressable>

        <Modal
          visible={visible}
          transparent
          animationType="fade"
          onRequestClose={() => setVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setVisible(false)}>
            <View className="flex-1 bg-black/40">
              <View className="absolute right-4 top-16 w-48 rounded-2xl border border-white/10 bg-[#141B26] p-1.5">
                <MenuItem
                  icon="user"
                  label="Profile"
                  onPress={() => {
                    setVisible(false);
                    router.push("/profile");
                  }}
                />
                <MenuItem
                  icon="gear"
                  label="Settings"
                  onPress={() => {
                    setVisible(false);
                    router.push("/settings");
                  }}
                />
                <View className="my-1 h-px bg-white/10" />
                <MenuItem
                  icon="right-from-bracket"
                  label="Logout"
                  danger
                  onPress={handleLogout}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>

      {/* Location / Geofence */}
      <GlassCard radius={24}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View
              className="flex-row items-center self-start rounded-full border py-1 pl-1.5 pr-3"
              style={{
                borderColor: `${badgeColor}33`,
                backgroundColor: `${badgeColor}1A`,
              }}>
              <View
                className="h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: `${badgeColor}33` }}>
                <FontAwesome6
                  name="location-dot"
                  size={10}
                  color={badgeColor}
                  iconStyle="solid"
                />
              </View>

              <Text
                className="ml-1.5 font-outfit-medium text-xs tracking-wide"
                style={{ color: badgeColor }}>
                {badgeLabel}
              </Text>
            </View>

            <Text className="mt-3 font-outfit-semibold text-xl text-white">
              {areaName}
            </Text>

            <Text className="mt-1 font-inter-light text-xs leading-5 text-slate-400">
              {areaCaption}
            </Text>
          </View>

          <View
            className="ml-4 h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${badgeColor}1A` }}>
            <FontAwesome6
              name={status.inside ? "check" : "xmark"}
              size={15}
              color={badgeColor}
              iconStyle="solid"
            />
          </View>
        </View>

        <View className="mt-5 h-px bg-white/[0.06]" />

        <View className="mt-4 flex-row items-center">
          <FontAwesome6
            name="location-arrow"
            size={11}
            color="#64748B"
            iconStyle="solid"
          />

          <Text className="ml-2 font-inter-light text-xs text-slate-400">
            {distanceLabel}
          </Text>

          <View className="mx-3 h-1 w-1 rounded-full bg-slate-600" />

          <FontAwesome6
            name="crosshairs"
            size={11}
            color="#64748B"
            iconStyle="solid"
          />

          <Text className="ml-2 font-inter-light text-xs text-slate-400">
            {accuracyLabel}
          </Text>
        </View>
      </GlassCard>

      {/* Today's Attendance */}
      <View className="mt-7">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-outfit-semibold text-lg text-white">
            Today's attendance
          </Text>

          <View className="flex-row items-center">
            <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <Text className="font-inter-light text-xs text-slate-400">
              On schedule
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          {/* Punch In */}
          <View className="flex-1">
            <GlassCard radius={22}>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10">
                <FontAwesome6
                  name="arrow-right-to-bracket"
                  size={13}
                  color="#34D399"
                  iconStyle="solid"
                />
              </View>

              <Text className="mt-4 font-outfit-medium text-xs text-slate-400">
                PUNCH IN
              </Text>

              <Text className="mt-1 font-outfit-bold text-[26px] text-white">
                08:00
                <Text className="font-outfit-medium text-sm text-slate-400">
                  {" "}
                  AM
                </Text>
              </Text>

              <View className="mt-2 flex-row items-center">
                <FontAwesome6
                  name="circle-check"
                  size={10}
                  color="#34D399"
                  iconStyle="solid"
                />

                <Text className="ml-1.5 font-inter-light text-xs text-emerald-400">
                  On time
                </Text>
              </View>
            </GlassCard>
          </View>

          {/* Punch Out */}
          <View className="flex-1">
            <GlassCard radius={22}>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-rose-400/10">
                <FontAwesome6
                  name="arrow-right-from-bracket"
                  size={13}
                  color="#FB7185"
                  iconStyle="solid"
                />
              </View>

              <Text className="mt-4 font-outfit-medium text-xs text-slate-400">
                PUNCH OUT
              </Text>

              <Text className="mt-1 font-outfit-bold text-[24px] text-white">
                05:00
                <Text className="font-outfit-medium text-sm text-slate-400">
                  {" "}
                  PM
                </Text>
              </Text>

              <View className="mt-2 flex-row items-center">
                <FontAwesome6
                  name="clock"
                  size={10}
                  color="#94A3B8"
                  iconStyle="solid"
                />

                <Text className="ml-1.5 font-inter-light text-xs text-slate-400">
                  Estimated
                </Text>
              </View>
            </GlassCard>
          </View>
        </View>
      </View>

      {/* Main Punch Action */}
      <View className="mt-9 items-center">
        <Text className="font-outfit-semibold text-lg text-white">
          {punching
            ? "Recording…"
            : canPunch
              ? isPunchedIn
                ? "Ready to check out?"
                : "Ready to check in?"
              : "Not in range"}
        </Text>

        <Text className="mt-1 text-center font-inter-light text-xs leading-5 text-slate-500">
          {punching
            ? "Please wait, saving your punch…"
            : canPunch
              ? "Verify your identity using your fingerprint"
              : (blockReason ?? "Checking your location…")}
        </Text>

        <View className="mt-7 items-center justify-center">
          {/* Outer animated glow */}
          <Animated.View
            className="absolute h-40 w-40 rounded-full"
            style={{
              backgroundColor: canPunch
                ? "rgba(56, 189, 248, 0.1)"
                : "rgba(148, 163, 184, 0.08)",
              opacity: canPunch ? glowAnim : 0.4,
              transform: [{ scale: canPunch ? pulseAnim : 1 }],
            }}
          />

          {/* Action button */}
          <Pressable
            onPress={handlePunch}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canPunch }}
            accessibilityLabel={
              canPunch
                ? "Punch in using fingerprint"
                : "Punch in unavailable — outside geofence"
            }
            style={({ pressed }) => ({
              transform: [{ scale: pressed && canPunch ? 0.94 : 1 }],
              opacity: canPunch ? (pressed ? 0.85 : 1) : 0.5,
            })}>
            <View
              className="h-32 w-32 items-center justify-center rounded-full border"
              style={{
                borderColor: canPunch
                  ? "rgba(56, 189, 248, 0.3)"
                  : "rgba(148, 163, 184, 0.2)",
                backgroundColor: "#101C29",
              }}>
              <View
                className="h-[108px] w-[108px] items-center justify-center rounded-full"
                style={{
                  backgroundColor: canPunch
                    ? "rgba(56, 189, 248, 0.1)"
                    : "rgba(148, 163, 184, 0.08)",
                }}>
                <FontAwesome6
                  name={canPunch ? "fingerprint" : "lock"}
                  size={50}
                  color={canPunch ? "#38BDF8" : "#64748B"}
                  iconStyle="solid"
                />
              </View>
            </View>
          </Pressable>
        </View>

        <View className="mt-6 flex-row items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
          <FontAwesome6
            name={canPunch ? "hand-pointer" : "triangle-exclamation"}
            size={11}
            color={canPunch ? "#64748B" : "#F87171"}
            iconStyle="solid"
          />

          <Text
            className="ml-2 font-outfit-medium text-xs"
            style={{ color: canPunch ? "#94A3B8" : "#F87171" }}>
            {canPunch
              ? "Tap fingerprint to punch in"
              : "Punch in disabled until you're inside your area"}
          </Text>
        </View>
      </View>

      {/* Security reassurance */}
      <View className="mt-10 flex-row items-center justify-center">
        <FontAwesome6
          name="shield-halved"
          size={11}
          color="#475569"
          iconStyle="solid"
        />

        <Text className="ml-2 font-inter-light text-[11px] text-slate-600">
          Your biometric data stays secure on your device
        </Text>
      </View>
    </ScrollView>
  );
}
