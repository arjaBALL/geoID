import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../_context/AuthContext";
import { supabase } from "../_lib/supabase";

/* =========================================================
   CONFIG
========================================================= */

// Shift start used only to flag "LATE" vs "ON TIME". Adjust to match
// your actual expected start time, or replace with a per-user schedule
// once that table exists.
const EXPECTED_START_HOUR = 9;
const EXPECTED_START_MINUTE = 0;

const filters = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

const statusConfig = {
  "ON TIME": {
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    text: "text-emerald-400",
    icon: "circle-check",
    iconColor: "#34D399",
  },
  LATE: {
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    text: "text-amber-400",
    icon: "clock",
    iconColor: "#FBBF24",
  },
  MISSED: {
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    text: "text-rose-400",
    icon: "circle-xmark",
    iconColor: "#FB7185",
  },
  "IN PROGRESS": {
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    text: "text-sky-400",
    icon: "spinner",
    iconColor: "#38BDF8",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function toDateKey(isoString) {
  // Local calendar day (YYYY-MM-DD) for grouping punches.
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function formatTime(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayLabel(dateKey) {
  const todayKey = toDateKey(new Date().toISOString());
  if (dateKey === todayKey) return "Today";
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function isTodayKey(dateKey) {
  return dateKey === toDateKey(new Date().toISOString());
}

function computeStatus({ timeInIso, timeOutIso, dateKey, lastPunchType }) {
  if (!timeInIso) return "MISSED";

  const stillClockedIn = isTodayKey(dateKey) && lastPunchType === 0;
  if (!timeOutIso || stillClockedIn) {
    return isTodayKey(dateKey) ? "IN PROGRESS" : "MISSED";
  }

  const inDate = new Date(timeInIso);
  const cutoff = new Date(inDate);
  cutoff.setHours(EXPECTED_START_HOUR, EXPECTED_START_MINUTE, 0, 0);

  return inDate > cutoff ? "LATE" : "ON TIME";
}

function getRangeForFilter(filter, customStart, customEnd) {
  const now = new Date();

  if (filter === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;

    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (filter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // custom
  if (!customStart || !customEnd) return null;

  const start = new Date(`${customStart}T00:00:00`);
  const end = new Date(`${customEnd}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return { start, end };
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function History() {
  const router = useRouter();

  // Session-derived identity. We no longer hardcode a biometric_no —
  // it's resolved from the signed-in user's row in `users`.
  const { user: authUser, loading: authLoading } = useAuth();

  const [filter, setFilter] = useState("week");
  const [customStart, setCustomStart] = useState(""); // "YYYY-MM-DD"
  const [customEnd, setCustomEnd] = useState(""); // "YYYY-MM-DD"

  const [biometricNo, setBiometricNo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* -------------------------------------------------------
     Reset cached biometric_no whenever the signed-in user
     changes (covers logout -> login as a different user
     without a full remount).
  ------------------------------------------------------- */

  useEffect(() => {
    setBiometricNo(null);
  }, [authUser?.id]);

  /* -------------------------------------------------------
     Resolve the logged-in user's biometric_no
  ------------------------------------------------------- */

  const fetchBiometricNo = useCallback(async () => {
    if (!authUser?.id) {
      throw new Error("Not signed in yet.");
    }

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("biometric_no")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!data?.biometric_no) {
      throw new Error("No biometric number is linked to your account.");
    }

    const parsed = Number(data.biometric_no); // cast varchar -> integer to match raw_logs
    if (Number.isNaN(parsed)) {
      throw new Error("Invalid biometric number linked to your account.");
    }

    return parsed;
  }, [authUser?.id]);

  /* -------------------------------------------------------
     Fetch punch logs for the current filter/date range
  ------------------------------------------------------- */

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const bio = biometricNo ?? (await fetchBiometricNo());
      if (!biometricNo) setBiometricNo(bio);

      const range = getRangeForFilter(filter, customStart, customEnd);

      if (filter === "custom" && !range) {
        setLogs([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("raw_logs")
        .select("log_id, punch_time, check_type")
        .eq("biometric_no", bio)
        .order("punch_time", { ascending: true });

      if (range) {
        query = query
          .gte("punch_time", range.start.toISOString())
          .lte("punch_time", range.end.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLogs(data ?? []);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      setError(err?.message ?? "Failed to load attendance history.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [biometricNo, fetchBiometricNo, filter, customStart, customEnd]);

  /* -------------------------------------------------------
     Fetch when the filter changes, but ONLY once auth has
     finished resolving and we actually have a signed-in user.
     Fetching before AuthContext resolves the session would
     otherwise silently match nothing.
  ------------------------------------------------------- */

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!authUser?.id) {
      setLogs([]);
      setError(null);
      setLoading(false);
      return;
    }

    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, authUser?.id, authLoading]);

  const applyCustomRange = () => {
    fetchLogs();
  };

  /* -------------------------------------------------------
     Group raw punches into one row per day (first IN, last OUT)
  ------------------------------------------------------- */

  const attendance = useMemo(() => {
    const byDay = new Map();

    for (const log of logs) {
      const key = toDateKey(log.punch_time);

      if (!byDay.has(key)) {
        byDay.set(key, {
          dateKey: key,
          timeInIso: null,
          timeOutIso: null,
          lastPunchIso: null,
          lastPunchType: null,
        });
      }

      const entry = byDay.get(key);

      if (log.check_type === 0) {
        if (
          !entry.timeInIso ||
          new Date(log.punch_time) < new Date(entry.timeInIso)
        ) {
          entry.timeInIso = log.punch_time;
        }
      } else {
        if (
          !entry.timeOutIso ||
          new Date(log.punch_time) > new Date(entry.timeOutIso)
        ) {
          entry.timeOutIso = log.punch_time;
        }
      }

      if (
        !entry.lastPunchIso ||
        new Date(log.punch_time) > new Date(entry.lastPunchIso)
      ) {
        entry.lastPunchIso = log.punch_time;
        entry.lastPunchType = log.check_type;
      }
    }

    return Array.from(byDay.values())
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)) // newest first
      .map((entry) => ({
        ...entry,
        date: formatDateLabel(entry.dateKey),
        day: formatDayLabel(entry.dateKey),
        timeIn: formatTime(entry.timeInIso),
        timeOut: formatTime(entry.timeOutIso),
        status: computeStatus(entry),
      }));
  }, [logs]);

  const summary = useMemo(() => {
    return {
      onTime: attendance.filter((item) => item.status === "ON TIME").length,
      late: attendance.filter((item) => item.status === "LATE").length,
      missed: attendance.filter((item) => item.status === "MISSED").length,
    };
  }, [attendance]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <View className="flex-1 bg-[#0B111A] mt-10">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="font-inter-light text-xs tracking-wide text-slate-500">
              ATTENDANCE
            </Text>

            <Text className="mt-1 font-outfit-bold text-2xl text-white">
              History
            </Text>

            <Text className="mt-1 font-inter-light text-xs text-slate-400">
              Review your attendance records
            </Text>
          </View>

          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
            <FontAwesome6
              name="arrow-left"
              size={15}
              color="#CBD5E1"
              iconStyle="solid"
            />
          </Pressable>
        </View>

        {/* Summary */}
        <View className="mb-6 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.05] p-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10">
              <FontAwesome6
                name="circle-check"
                size={13}
                color="#34D399"
                iconStyle="solid"
              />
            </View>
            <Text className="mt-3 font-outfit-bold text-2xl text-white">
              {summary.onTime}
            </Text>
            <Text className="mt-0.5 font-inter-light text-[11px] text-slate-500">
              On time
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-amber-400/10 bg-amber-400/[0.05] p-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10">
              <FontAwesome6
                name="clock"
                size={13}
                color="#FBBF24"
                iconStyle="solid"
              />
            </View>
            <Text className="mt-3 font-outfit-bold text-2xl text-white">
              {summary.late}
            </Text>
            <Text className="mt-0.5 font-inter-light text-[11px] text-slate-500">
              Late
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-rose-400/10 bg-rose-400/[0.05] p-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-rose-400/10">
              <FontAwesome6
                name="circle-xmark"
                size={13}
                color="#FB7185"
                iconStyle="solid"
              />
            </View>
            <Text className="mt-3 font-outfit-bold text-2xl text-white">
              {summary.missed}
            </Text>
            <Text className="mt-0.5 font-inter-light text-[11px] text-slate-500">
              Missed
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-outfit-semibold text-base text-white">
              Records
            </Text>

            <View className="flex-row items-center">
              <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <Text className="font-inter-light text-[11px] text-slate-500">
                {attendance.length} entries
              </Text>
            </View>
          </View>

          <View className="flex-row rounded-2xl border border-white/[0.06] bg-white/[0.03] p-1">
            {filters.map((item) => {
              const active = filter === item.key;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
                    active ? "bg-sky-400" : "bg-transparent"
                  }`}>
                  <Text
                    className={`font-outfit-medium text-xs ${
                      active ? "text-[#0B111A]" : "text-slate-400"
                    }`}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom range inputs */}
          {filter === "custom" && (
            <View className="mt-3 flex-row items-center gap-2">
              <TextInput
                value={customStart}
                onChangeText={setCustomStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white"
              />
              <Text className="font-inter-light text-xs text-slate-500">
                to
              </Text>
              <TextInput
                value={customEnd}
                onChangeText={setCustomEnd}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white"
              />
              <Pressable
                onPress={applyCustomRange}
                className="rounded-xl bg-sky-400 px-4 py-2.5">
                <Text className="font-outfit-semibold text-xs text-[#0B111A]">
                  Go
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Loading */}
        {loading && (
          <View className="items-center rounded-3xl border border-white/[0.06] bg-white/[0.03] px-6 py-12">
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text className="mt-4 font-inter-light text-xs text-slate-500">
              Loading attendance records...
            </Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View className="items-center rounded-3xl border border-rose-400/10 bg-rose-400/[0.04] px-6 py-10">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-rose-400/10">
              <FontAwesome6
                name="triangle-exclamation"
                size={20}
                color="#FB7185"
                iconStyle="solid"
              />
            </View>
            <Text className="mt-4 font-outfit-semibold text-base text-white">
              Unable to load records
            </Text>
            <Text className="mt-1 text-center font-inter-light text-xs text-slate-500">
              {error}
            </Text>
            <Pressable
              onPress={fetchLogs}
              className="mt-5 rounded-xl bg-sky-400 px-5 py-2.5">
              <Text className="font-outfit-semibold text-xs text-[#0B111A]">
                Try Again
              </Text>
            </Pressable>
          </View>
        )}

        {/* Records */}
        {!loading && !error && (
          <View>
            {attendance.length === 0 ? (
              <View className="items-center rounded-3xl border border-white/[0.06] bg-white/[0.03] px-6 py-12">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
                  <FontAwesome6
                    name="calendar-xmark"
                    size={20}
                    color="#64748B"
                    iconStyle="solid"
                  />
                </View>
                <Text className="mt-4 font-outfit-semibold text-base text-white">
                  No attendance records
                </Text>
                <Text className="mt-1 text-center font-inter-light text-xs text-slate-500">
                  Your attendance records will appear here.
                </Text>
              </View>
            ) : (
              attendance.map((item, index) => {
                const config =
                  statusConfig[item.status] || statusConfig["LATE"];

                const isLast = index === attendance.length - 1;

                return (
                  <View
                    key={item.dateKey}
                    className={`mb-3 rounded-3xl border border-white/[0.06] bg-white/[0.025] p-4 ${
                      isLast ? "mb-0" : ""
                    }`}>
                    {/* Top Row */}
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-center">
                        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                          <Text className="font-outfit-bold text-sm text-white">
                            {item.date.split(" ")[1]}
                          </Text>
                          <Text className="font-inter-light text-[9px] uppercase text-slate-500">
                            {item.date.split(" ")[0]}
                          </Text>
                        </View>

                        <View className="ml-3">
                          <Text className="font-outfit-semibold text-sm text-white">
                            {item.day}
                          </Text>
                          <Text className="mt-0.5 font-inter-light text-[11px] text-slate-500">
                            Attendance record
                          </Text>
                        </View>
                      </View>

                      {/* Status */}
                      <View
                        className={`flex-row items-center rounded-full border px-2.5 py-1.5 ${config.bg} ${config.border}`}>
                        <FontAwesome6
                          name={config.icon}
                          size={9}
                          color={config.iconColor}
                          iconStyle="solid"
                        />
                        <Text
                          className={`ml-1.5 font-outfit-semibold text-[9px] ${config.text}`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View className="my-4 h-px bg-white/[0.05]" />

                    {/* Time */}
                    <View className="flex-row">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <View className="h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10">
                            <FontAwesome6
                              name="arrow-right-to-bracket"
                              size={10}
                              color="#34D399"
                              iconStyle="solid"
                            />
                          </View>
                          <View className="ml-2">
                            <Text className="font-inter-light text-[9px] uppercase tracking-wide text-slate-500">
                              Time In
                            </Text>
                            <Text className="mt-0.5 font-outfit-semibold text-sm text-white">
                              {item.timeIn}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <View className="h-7 w-7 items-center justify-center rounded-lg bg-rose-400/10">
                            <FontAwesome6
                              name="arrow-right-from-bracket"
                              size={10}
                              color="#FB7185"
                              iconStyle="solid"
                            />
                          </View>
                          <View className="ml-2">
                            <Text className="font-inter-light text-[9px] uppercase tracking-wide text-slate-500">
                              Time Out
                            </Text>
                            <Text className="mt-0.5 font-outfit-semibold text-sm text-white">
                              {item.timeOut}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Identity */}
                    <View className="mt-4 flex-row items-center">
                      <FontAwesome6
                        name="location-dot"
                        size={10}
                        color="#64748B"
                        iconStyle="solid"
                      />
                      <Text
                        numberOfLines={1}
                        className="ml-2 flex-1 font-inter-light text-[11px] text-slate-500">
                        Biometric #{biometricNo ?? "—"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
