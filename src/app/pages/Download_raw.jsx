import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Share, Text, View } from "react-native";

// ======================================================
// MOCK DATA
// ======================================================

const MOCK_LOGS = [
  {
    id: "l1",
    date: "2026-08-01",
    time: "07:02 AM",
    employee: "Ana Reyes",
    geofence: "Geofence 1",
    type: "Time In",
  },
  {
    id: "l2",
    date: "2026-08-01",
    time: "04:05 PM",
    employee: "Ana Reyes",
    geofence: "Geofence 1",
    type: "Time Out",
  },
  {
    id: "l3",
    date: "2026-08-01",
    time: "06:58 AM",
    employee: "Marco Cruz",
    geofence: "Geofence 1",
    type: "Time In",
  },
  {
    id: "l4",
    date: "2026-08-01",
    time: "04:10 PM",
    employee: "Marco Cruz",
    geofence: "Geofence 1",
    type: "Time Out",
  },
  {
    id: "l5",
    date: "2026-08-02",
    time: "12:58 PM",
    employee: "Liza Santos",
    geofence: "Geofence 2",
    type: "Time In",
  },
  {
    id: "l6",
    date: "2026-08-02",
    time: "09:03 PM",
    employee: "Liza Santos",
    geofence: "Geofence 2",
    type: "Time Out",
  },
  {
    id: "l7",
    date: "2026-08-05",
    time: "07:10 AM",
    employee: "Ana Reyes",
    geofence: "Geofence 1",
    type: "Time In",
  },
  {
    id: "l8",
    date: "2026-08-05",
    time: "04:02 PM",
    employee: "Ana Reyes",
    geofence: "Geofence 1",
    type: "Time Out",
  },
  {
    id: "l9",
    date: "2026-08-08",
    time: "07:01 AM",
    employee: "Kim Dela Torre",
    geofence: "Geofence 3",
    type: "Time In",
  },
  {
    id: "l10",
    date: "2026-08-08",
    time: "03:59 PM",
    employee: "Kim Dela Torre",
    geofence: "Geofence 3",
    type: "Time Out",
  },
  {
    id: "l11",
    date: "2026-08-12",
    time: "07:05 AM",
    employee: "Marco Cruz",
    geofence: "Geofence 1",
    type: "Time In",
  },
  {
    id: "l12",
    date: "2026-08-12",
    time: "04:00 PM",
    employee: "Marco Cruz",
    geofence: "Geofence 1",
    type: "Time Out",
  },
  {
    id: "l13",
    date: "2026-08-16",
    time: "01:02 PM",
    employee: "Liza Santos",
    geofence: "Geofence 2",
    type: "Time In",
  },
  {
    id: "l14",
    date: "2026-08-16",
    time: "09:00 PM",
    employee: "Liza Santos",
    geofence: "Geofence 2",
    type: "Time Out",
  },
  {
    id: "l15",
    date: "2026-08-19",
    time: "06:55 AM",
    employee: "Ana Reyes",
    geofence: "Geofence 1",
    type: "Time In",
  },
  {
    id: "l16",
    date: "2026-08-19",
    time: "04:07 PM",
    employee: "Ana Reyes",
    geofence: "Geofence 1",
    type: "Time Out",
  },
  {
    id: "l17",
    date: "2026-08-22",
    time: "07:03 AM",
    employee: "Kim Dela Torre",
    geofence: "Geofence 3",
    type: "Time In",
  },
  {
    id: "l18",
    date: "2026-08-22",
    time: "04:01 PM",
    employee: "Kim Dela Torre",
    geofence: "Geofence 3",
    type: "Time Out",
  },
  {
    id: "l19",
    date: "2026-08-27",
    time: "07:00 AM",
    employee: "Marco Cruz",
    geofence: "Geofence 1",
    type: "Time In",
  },
  {
    id: "l20",
    date: "2026-08-27",
    time: "04:04 PM",
    employee: "Marco Cruz",
    geofence: "Geofence 1",
    type: "Time Out",
  },
];

const GEOFENCE_OPTIONS = [
  "All Geofences",
  ...Array.from(new Set(MOCK_LOGS.map((l) => l.geofence))),
];

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

function toCSV(rows) {
  const header = ["Date", "Time", "Employee", "Geofence", "Type"];

  const lines = rows.map((r) =>
    [r.date, r.time, r.employee, r.geofence, r.type]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

// ======================================================
// SCREEN
// ======================================================

export default function Logs() {
  const [cursor, setCursor] = useState(new Date(2026, 7, 1));
  const [geofence, setGeofence] = useState("All Geofences");
  const [period, setPeriod] = useState("month");

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
  // FILTER
  // ====================================================

  const filteredLogs = useMemo(() => {
    const [start, end] = periodRange(year, monthIndex, period);

    return MOCK_LOGS.filter((log) => {
      const d = new Date(`${log.date}T00:00:00`);

      const sameMonth = d.getFullYear() === year && d.getMonth() === monthIndex;

      const dayNum = d.getDate();

      const inRange = dayNum >= start && dayNum <= end;

      const matchesGeofence =
        geofence === "All Geofences" || log.geofence === geofence;

      return sameMonth && inRange && matchesGeofence;
    }).sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );
  }, [year, monthIndex, period, geofence]);

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

  const handleDownload = async () => {
    if (filteredLogs.length === 0) {
      Alert.alert("Nothing to download", "No logs match the current filter.");
      return;
    }

    const csv = toCSV(filteredLogs);

    const filename = `logs_${year}-${String(monthIndex + 1).padStart(
      2,
      "0",
    )}_${period}.csv`;

    try {
      await Share.share({
        title: filename,
        message: csv,
      });
    } catch (err) {
      Alert.alert("Download failed", err?.message ?? "Please try again.");
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <View className="flex-1 bg-[#0B111A]">
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
          data={GEOFENCE_OPTIONS}
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

        {filteredLogs.length === 0 ? (
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
