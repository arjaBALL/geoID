import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  Text,
  View,
} from "react-native";

import { supabase } from "../_lib/supabase";

// ======================================================
// STATIC OPTIONS
// ======================================================

const PERIODS = [
  { id: "month", label: "Whole Month" },
  { id: "first", label: "1–15" },
  { id: "second", label: "16–End" },
];

// ======================================================
// HELPERS
// ======================================================

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function periodRange(year, monthIndex, periodId) {
  const lastDay = daysInMonth(year, monthIndex);

  if (periodId === "first") return [1, 15];
  if (periodId === "second") return [16, lastDay];

  return [1, lastDay];
}

function formatDateLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
}

function formatDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);

  return d.toLocaleDateString(undefined, {
    weekday: "short",
  });
}

function formatTime(dateObj) {
  return dateObj.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toCSV(rows) {
  const header = ["Date", "Time", "Employee", "Geofence", "Type"];

  const lines = rows.map((r) =>
    [r.date, r.time, r.employee, r.geofence, r.type]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

// Raw device-style export: biometric_no <tab> punch_time <tab> status <tab> check_type <tab> verify_mode <tab> work_code
// Matches the .dat format the biometric device itself produces (e.g. AF6P200760015_attlog.dat)
function toRawAttlog(rows) {
  return rows
    .map((r) => {
      const checkType = r.type === "Time In" ? 0 : 1;
      // r.rawPunchTime is the original "YYYY-MM-DD HH:MM:SS" from the DB row
      return [
        r.biometricNo,
        r.rawPunchTime,
        r.status ?? 1,
        checkType,
        r.verifyMode ?? 1,
        r.workCode ?? 0,
      ].join("\t");
    })
    .join("\r\n");
}

// Maps a raw_logs row + looked-up name/geofence into the shape the UI uses
function mapRawLog(row, nameByBiometricNo, geofenceByBiometricNo) {
  const punchDate = new Date(row.punch_time);

  return {
    id: String(row.log_id),
    date: punchDate.toISOString().slice(0, 10),
    time: formatTime(punchDate),
    employee:
      nameByBiometricNo.get(row.biometric_no) ??
      `Biometric #${row.biometric_no}`,
    geofence: geofenceByBiometricNo.get(row.biometric_no) ?? "Unassigned",
    type: row.check_type === 0 ? "Time In" : "Time Out",
    // Raw fields kept around for the device-format (.dat) export
    biometricNo: row.biometric_no,
    rawPunchTime: row.punch_time,
    status: row.status,
    verifyMode: row.verify_mode,
    workCode: row.work_code,
  };
}

// ======================================================
// SCREEN
// ======================================================

export default function Logs() {
  const [cursor, setCursor] = useState(new Date(2026, 7, 1));
  const [geofence, setGeofence] = useState("All Geofences");
  const [period, setPeriod] = useState("month");

  const [logs, setLogs] = useState([]);
  const [geofenceOptions, setGeofenceOptions] = useState(["All Geofences"]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const goPrevMonth = () => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  };

  // ====================================================
  // FETCH RAW LOGS FOR THE SELECTED MONTH
  // ====================================================

  const fetchLogs = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        setError(null);

        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 1); // exclusive

        const PAGE_SIZE = 1000;
        let rows = [];
        let from = 0;

        while (true) {
          const { data, error: rawError } = await supabase
            .from("raw_logs")
            .select(
              "log_id, biometric_no, punch_time, status, check_type, verify_mode, work_code",
            )
            .gte("punch_time", monthStart.toISOString())
            .lt("punch_time", monthEnd.toISOString())
            .order("punch_time", { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

          if (rawError) throw rawError;
          rows = rows.concat(data ?? []);
          if (!data || data.length < PAGE_SIZE) break;
          from += PAGE_SIZE;
        }

        const biometricNos = Array.from(
          new Set(rows.map((r) => r.biometric_no)),
        );

        let nameByBiometricNo = new Map();
        let geofenceByBiometricNo = new Map();

        if (biometricNos.length > 0) {
          // 2) Employee names for those biometric numbers
          // NOTE: users.biometric_no should be integer to match raw_logs.
          const { data: userRows, error: userError } = await supabase
            .from("users")
            .select("id, biometric_no, first_name, last_name")
            .in("biometric_no", biometricNos);

          if (userError) throw userError;

          const userIdByBiometricNo = new Map();

          (userRows ?? []).forEach((u) => {
            const name = [u.first_name, u.last_name]
              .filter(Boolean)
              .join(" ")
              .trim();

            nameByBiometricNo.set(u.biometric_no, name || `User #${u.id}`);
            userIdByBiometricNo.set(u.biometric_no, u.id);
          });

          const userIds = Array.from(userIdByBiometricNo.values());

          if (userIds.length > 0) {
            // 3) Geofence assignment per employee (first assignment used if multiple)
            const { data: assignmentRows, error: assignmentError } =
              await supabase
                .from("geofence_employees")
                .select("user_id, geofences ( name )")
                .in("user_id", userIds);

            if (assignmentError) throw assignmentError;

            const geofenceByUserId = new Map();

            (assignmentRows ?? []).forEach((a) => {
              if (!geofenceByUserId.has(a.user_id)) {
                geofenceByUserId.set(a.user_id, a.geofences?.name ?? null);
              }
            });

            biometricNos.forEach((bn) => {
              const uid = userIdByBiometricNo.get(bn);
              const gName = uid != null ? geofenceByUserId.get(uid) : null;

              if (gName) geofenceByBiometricNo.set(bn, gName);
            });
          }
        }

        const mapped = rows.map((row) =>
          mapRawLog(row, nameByBiometricNo, geofenceByBiometricNo),
        );

        setLogs(mapped);

        // Build geofence filter chips from what's actually in this month's data
        const uniqueGeofences = Array.from(
          new Set(mapped.map((l) => l.geofence)),
        );

        setGeofenceOptions(["All Geofences", ...uniqueGeofences]);
      } catch (err) {
        setError(err?.message ?? "Failed to load attendance logs.");
        setLogs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [year, monthIndex],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs({ silent: true });
  };

  // ====================================================
  // OPTIONAL: live updates when a new punch comes in
  // ====================================================

  useEffect(() => {
    const channel = supabase
      .channel("raw_logs_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "raw_logs" },
        () => {
          // Re-fetch quietly so the list stays current without a full spinner
          fetchLogs({ silent: true });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  // ====================================================
  // FILTER (client-side, within the fetched month)
  // ====================================================

  const filteredLogs = useMemo(() => {
    const [start, end] = periodRange(year, monthIndex, period);

    return logs
      .filter((log) => {
        const d = new Date(`${log.date}T00:00:00`);
        const dayNum = d.getDate();
        const inRange = dayNum >= start && dayNum <= end;

        const matchesGeofence =
          geofence === "All Geofences" || log.geofence === geofence;

        return inRange && matchesGeofence;
      })
      .sort(
        (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
      );
  }, [logs, year, monthIndex, period, geofence]);

  const periodLabel =
    PERIODS.find((p) => p.id === period)?.label ?? "Whole Month";

  // ====================================================
  // STATS
  // ====================================================

  const totalLogs = filteredLogs.length;

  const timeIns = filteredLogs.filter((item) => item.type === "Time In").length;

  const timeOuts = filteredLogs.filter(
    (item) => item.type === "Time Out",
  ).length;

  const employees = new Set(filteredLogs.map((item) => item.employee)).size;

  // ====================================================
  // DOWNLOAD
  // ====================================================

  const shareContent = async (content, filename) => {
    try {
      await Share.share({
        title: filename,
        message: content,
      });
    } catch (err) {
      Alert.alert("Download failed", err?.message ?? "Please try again.");
    }
  };

  const handleDownload = () => {
    if (filteredLogs.length === 0) {
      Alert.alert("Nothing to download", "No logs match the current filter.");
      return;
    }

    const stamp = `${year}-${String(monthIndex + 1).padStart(2, "0")}_${period}`;

    Alert.alert("Download logs", "Choose a format", [
      {
        text: "Raw (.dat, device format)",
        onPress: () =>
          shareContent(toRawAttlog(filteredLogs), `attlog_${stamp}.dat`),
      },
      {
        text: "CSV (readable)",
        onPress: () => shareContent(toCSV(filteredLogs), `logs_${stamp}.csv`),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <View className="flex-1 bg-[#0B111A] mt-10">
      {/* =================================================
          HEADER
      ================================================= */}

      <View className="px-5 pt-6">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-outfit-bold text-2xl text-white">
              Attendance Logs
            </Text>

            <Text className="mt-1 font-inter-light text-xs leading-5 text-slate-500">
              Review employee check-in and check-out activity.
            </Text>
          </View>

          <Pressable
            onPress={handleDownload}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10">
            <FontAwesome6
              name="download"
              size={15}
              color="#38BDF8"
              iconStyle="solid"
            />
          </Pressable>
        </View>
      </View>

      {/* =================================================
          MONTH NAVIGATOR
      ================================================= */}

      <View className="mt-5 px-5">
        <View className="flex-row items-center justify-between rounded-2xl border border-white/[0.06] bg-[#141C27] p-2">
          <Pressable
            onPress={goPrevMonth}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
            <FontAwesome6
              name="chevron-left"
              size={12}
              color="#94A3B8"
              iconStyle="solid"
            />
          </Pressable>

          <View className="items-center">
            <Text className="font-outfit-semibold text-base text-white">
              {monthLabel}
            </Text>

            <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
              {geofence}
            </Text>
          </View>

          <Pressable
            onPress={goNextMonth}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
            <FontAwesome6
              name="chevron-right"
              size={12}
              color="#94A3B8"
              iconStyle="solid"
            />
          </Pressable>
        </View>
      </View>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <View className="mt-4 flex-row gap-3 px-5">
        {/* Total */}
        <View className="flex-1 rounded-2xl border border-white/[0.06] bg-[#141C27] p-3.5">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-sky-400/10">
            <FontAwesome6
              name="list"
              size={12}
              color="#38BDF8"
              iconStyle="solid"
            />
          </View>

          <Text className="mt-3 font-outfit-bold text-xl text-white">
            {totalLogs}
          </Text>

          <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
            Total Logs
          </Text>
        </View>

        {/* Employees */}
        <View className="flex-1 rounded-2xl border border-white/[0.06] bg-[#141C27] p-3.5">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-violet-400/10">
            <FontAwesome6
              name="users"
              size={12}
              color="#A78BFA"
              iconStyle="solid"
            />
          </View>

          <Text className="mt-3 font-outfit-bold text-xl text-white">
            {employees}
          </Text>

          <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
            Employees
          </Text>
        </View>

        {/* Time In */}
        <View className="flex-1 rounded-2xl border border-white/[0.06] bg-[#141C27] p-3.5">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10">
            <FontAwesome6
              name="arrow-right-to-bracket"
              size={12}
              color="#34D399"
              iconStyle="solid"
            />
          </View>

          <Text className="mt-3 font-outfit-bold text-xl text-white">
            {timeIns}
          </Text>

          <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
            Time In
          </Text>
        </View>

        {/* Time Out */}
        <View className="flex-1 rounded-2xl border border-white/[0.06] bg-[#141C27] p-3.5">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-rose-400/10">
            <FontAwesome6
              name="arrow-right-from-bracket"
              size={12}
              color="#FB7185"
              iconStyle="solid"
            />
          </View>

          <Text className="mt-3 font-outfit-bold text-xl text-white">
            {timeOuts}
          </Text>

          <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
            Time Out
          </Text>
        </View>
      </View>

      {/* =================================================
          FILTER SECTION
      ================================================= */}

      <View className="mt-5 px-5">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-outfit-semibold text-sm text-white">
            Filters
          </Text>

          <Text className="font-inter-light text-[10px] text-slate-500">
            {filteredLogs.length} records
          </Text>
        </View>

        {/* Geofence */}

        <FlatList
          horizontal
          data={geofenceOptions}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: g }) => {
            const active = geofence === g;

            return (
              <Pressable
                onPress={() => setGeofence(g)}
                className={`rounded-full border px-4 py-2 ${
                  active
                    ? "border-sky-400/30 bg-sky-400/10"
                    : "border-white/[0.06] bg-[#141C27]"
                }`}>
                <Text
                  className={`font-outfit-medium text-xs ${
                    active ? "text-sky-400" : "text-slate-400"
                  }`}>
                  {g}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Period */}

        <View className="mt-3 flex-row rounded-2xl border border-white/[0.06] bg-[#141C27] p-1">
          {PERIODS.map((p) => {
            const active = period === p.id;

            return (
              <Pressable
                key={p.id}
                onPress={() => setPeriod(p.id)}
                className={`flex-1 items-center rounded-xl py-2.5 ${
                  active ? "bg-sky-400" : "bg-transparent"
                }`}>
                <Text
                  className={`font-outfit-medium text-xs ${
                    active ? "text-[#0B111A]" : "text-slate-500"
                  }`}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* =================================================
          LOG LIST
      ================================================= */}

      <View className="mt-5 flex-1 overflow-hidden rounded-t-[28px] border-t border-white/[0.06] bg-[#111923]">
        {/* List Header */}

        <View className="flex-row items-center justify-between px-5 pb-3 pt-5">
          <View>
            <Text className="font-outfit-semibold text-base text-white">
              Activity
            </Text>

            <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
              {periodLabel} · {geofence}
            </Text>
          </View>

          <View className="flex-row items-center rounded-full border border-emerald-400/10 bg-emerald-400/5 px-3 py-1.5">
            <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <Text className="font-outfit-medium text-[10px] text-emerald-400">
              LIVE LOGS
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center px-5 pb-20">
            <ActivityIndicator size="small" color="#38BDF8" />

            <Text className="mt-3 font-inter-light text-xs text-slate-500">
              Loading attendance logs…
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-5 pb-20">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-rose-400/10">
              <FontAwesome6
                name="triangle-exclamation"
                size={22}
                color="#FB7185"
                iconStyle="solid"
              />
            </View>

            <Text className="mt-4 font-outfit-semibold text-base text-white">
              Couldn't load logs
            </Text>

            <Text className="mt-1 text-center font-inter-light text-xs leading-5 text-slate-500">
              {error}
            </Text>

            <Pressable
              onPress={() => fetchLogs()}
              className="mt-4 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2">
              <Text className="font-outfit-medium text-xs text-sky-400">
                Try again
              </Text>
            </Pressable>
          </View>
        ) : filteredLogs.length === 0 ? (
          <View className="flex-1 items-center justify-center px-5 pb-20">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
              <FontAwesome6
                name="clipboard-list"
                size={22}
                color="#475569"
                iconStyle="solid"
              />
            </View>

            <Text className="mt-4 font-outfit-semibold text-base text-white">
              No logs found
            </Text>

            <Text className="mt-1 text-center font-inter-light text-xs leading-5 text-slate-500">
              There are no attendance records matching your current filters.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredLogs}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#38BDF8"
              />
            }
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 120,
            }}
            renderItem={({ item, index }) => {
              const isTimeIn = item.type === "Time In";

              return (
                <View
                  className={`flex-row items-center py-4 ${
                    index !== filteredLogs.length - 1
                      ? "border-b border-white/[0.05]"
                      : ""
                  }`}>
                  {/* Icon */}

                  <View
                    className={`h-10 w-10 items-center justify-center rounded-xl ${
                      isTimeIn ? "bg-emerald-400/10" : "bg-rose-400/10"
                    }`}>
                    <FontAwesome6
                      name={
                        isTimeIn
                          ? "arrow-right-to-bracket"
                          : "arrow-right-from-bracket"
                      }
                      size={13}
                      color={isTimeIn ? "#34D399" : "#FB7185"}
                      iconStyle="solid"
                    />
                  </View>

                  {/* Date */}

                  <View className="ml-3 w-[52px]">
                    <Text className="font-outfit-semibold text-xs text-white">
                      {formatDateLabel(item.date)}
                    </Text>

                    <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
                      {formatDay(item.date)}
                    </Text>
                  </View>

                  {/* Employee */}

                  <View className="ml-3 flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-outfit-medium text-sm text-white">
                      {item.employee}
                    </Text>

                    <View className="mt-1 flex-row items-center">
                      <FontAwesome6
                        name="location-dot"
                        size={8}
                        color="#64748B"
                        iconStyle="solid"
                      />

                      <Text
                        numberOfLines={1}
                        className="ml-1 font-inter-light text-[10px] text-slate-500">
                        {item.geofence}
                      </Text>
                    </View>
                  </View>

                  {/* Time + Type */}

                  <View className="items-end">
                    <Text className="font-outfit-semibold text-xs text-white">
                      {item.time}
                    </Text>

                    <View
                      className={`mt-1 rounded-full px-2 py-0.5 ${
                        isTimeIn ? "bg-emerald-400/10" : "bg-rose-400/10"
                      }`}>
                      <Text
                        className={`font-outfit-medium text-[9px] ${
                          isTimeIn ? "text-emerald-400" : "text-rose-400"
                        }`}>
                        {item.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}
