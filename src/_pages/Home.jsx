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

const EARLY_MIN = 30; // minutes before an IN time that punching opens

function toMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

// 540 -> { time: "09:00", period: "AM" }
function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return {
    time: `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    period: h >= 12 ? "PM" : "AM",
  };
}

function getSlotWindows(g) {
  const amIn = toMinutes(g?.am_in);
  const amOut = toMinutes(g?.am_out);
  const pmIn = toMinutes(g?.pm_in);
  const pmOut = toMinutes(g?.pm_out);

  if ([amIn, amOut, pmIn, pmOut].some((v) => v == null)) return null;

  const pmInOpen = Math.max(amOut, pmIn - EARLY_MIN);

  return [
    {
      key: "amIn",
      label: "AM In",
      checkType: 0,
      start: Math.max(0, amIn - EARLY_MIN),
      end: amOut,
    },
    {
      key: "amOut",
      label: "AM Out",
      checkType: 1,
      start: amOut,
      end: pmInOpen,
    },
    { key: "pmIn", label: "PM In", checkType: 0, start: pmInOpen, end: pmOut },
    { key: "pmOut", label: "PM Out", checkType: 1, start: pmOut, end: 24 * 60 },
  ];
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
   TODAY'S PUNCHES
======================================================= */

  const [todayLogs, setTodayLogs] = useState([]);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState(null);
  const [punching, setPunching] = useState(false);

  // Ticks every 30s so the button opens/closes on time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchTodayLogs = useCallback(async () => {
    if (!biometricNo) {
      setTodayLoading(false);
      return;
    }

    try {
      setTodayLoading(true);
      setTodayError(null);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("raw_logs")
        .select("check_type, punch_time")
        .eq("biometric_no", biometricNo)
        .gte("punch_time", startOfDay.toISOString())
        .order("punch_time", { ascending: true });

      if (error) throw error;

      setTodayLogs(data ?? []);
    } catch (err) {
      setTodayError(err?.message ?? "Failed to load today's punches.");
    } finally {
      setTodayLoading(false);
    }
  }, [biometricNo]);

  useEffect(() => {
    fetchTodayLogs();
  }, [fetchTodayLogs]);

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
        .select("id, name, points, is_active, am_in, am_out, pm_in, pm_out")
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
   SCHEDULE / CURRENT PUNCH SLOT
======================================================= */

  const slotInfo = useMemo(() => {
    const windows = getSlotWindows(status.geofence);
    if (!windows) {
      const last = todayLogs[todayLogs.length - 1];
      const checkType = last?.check_type === 0 ? 1 : 0; // last was IN -> next is OUT
      return {
        state: "open",
        slot: {
          key: "free",
          label: checkType === 0 ? "Punch In" : "Punch Out",
          checkType,
        },
      };
    }

    const nowMin = minutesOfDay(now);
    const current = windows.find((w) => nowMin >= w.start && nowMin < w.end);

    // Before the first window of the day
    if (!current) {
      return { state: "waiting", next: windows.find((w) => w.start > nowMin) };
    }

    const done = todayLogs.some((l) => {
      const t = minutesOfDay(new Date(l.punch_time));
      return (
        l.check_type === current.checkType &&
        t >= current.start &&
        t < current.end
      );
    });

    return {
      state: done ? "done" : "open",
      slot: current,
      next: windows.find((w) => w.start >= current.end),
    };
  }, [status.geofence, todayLogs, now]);

  // Schedule shown in the "Today's attendance" cards
  const shownSchedule = status.geofence ?? status.nearest;
  const schedIn = shownSchedule?.am_in
    ? formatMinutes(toMinutes(shownSchedule.am_in))
    : null;
  const schedOut = shownSchedule?.pm_out
    ? formatMinutes(toMinutes(shownSchedule.pm_out))
    : null;

  /* =======================================================
     PUNCH ELIGIBILITY
  ======================================================= */

  const isBusy =
    locationLoading || geofencesLoading || biometricLoading || todayLoading;

  const blockReason = locationError
    ? locationError
    : geofencesError
      ? geofencesError
      : biometricError
        ? biometricError
        : todayError
          ? todayError
          : geofences.length === 0
            ? "You're not assigned to any geofence yet."
            : !status.inside
              ? "You're outside your assigned attendance area."
              : slotInfo.state === "waiting"
                ? `${slotInfo.next.label} opens at ${formatMinutes(slotInfo.next.start).time} ${formatMinutes(slotInfo.next.start).period}.`
                : slotInfo.state === "done"
                  ? `${slotInfo.slot.label} already recorded.${
                      slotInfo.next
                        ? ` Next: ${slotInfo.next.label} at ${formatMinutes(slotInfo.next.start).time} ${formatMinutes(slotInfo.next.start).period}.`
                        : " You're done for today."
                    }`
                  : null;

  const canPunch =
    !isBusy &&
    !blockReason &&
    !!biometricNo &&
    !punching &&
    slotInfo.state === "open";

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
      if (punching) return;
      Alert.alert(
        "Can't Punch",
        blockReason ?? "You need to be inside your assigned area.",
      );
      return;
    }

    setPunching(true);

    try {
      const slot = slotInfo.slot;
      const punchTime = new Date().toISOString();

      const { error } = await supabase.from("raw_logs").insert({
        biometric_no: biometricNo,
        punch_time: punchTime,
        status: 1,
        check_type: slot.checkType, // 0=IN, 1=OUT, fixed by the schedule slot
        verify_mode: 1,
        work_code: 0,
      });

      if (error) throw error;

      setTodayLogs((prev) => [
        ...prev,
        { check_type: slot.checkType, punch_time: punchTime },
      ]);

      Alert.alert("Success", `${slot.label} recorded!`);
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
                {schedIn?.time ?? "--:--"}
                <Text className="font-outfit-medium text-sm text-slate-400">
                  {" "}
                  {schedIn?.period ?? ""}
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
                {schedOut?.time ?? "--:--"}
                <Text className="font-outfit-medium text-sm text-slate-400">
                  {" "}
                  {schedOut?.period ?? ""}
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
              ? `Ready for ${slotInfo.slot.label}?`
              : "Punch unavailable"}
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
              ? `Tap fingerprint for ${slotInfo.slot.label}`
              : "Punch disabled right now"}
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
