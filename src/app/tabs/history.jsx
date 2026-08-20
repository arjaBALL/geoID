import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function History() {
  const router = useRouter();
  const [filter, setFilter] = useState("week");

  const filters = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "custom", label: "Custom" },
  ];

  const attendance = [
    {
      date: "Aug 13",
      day: "Today",
      timeIn: "8:58 AM",
      timeOut: "—",
      location: "Cebu IT Park HQ",
      status: "IN PROGRESS",
    },
    {
      date: "Aug 12",
      day: "Tue",
      timeIn: "9:02 AM",
      timeOut: "6:05 PM",
      location: "Cebu IT Park HQ",
      status: "LATE",
    },
    {
      date: "Aug 11",
      day: "Mon",
      timeIn: "8:55 AM",
      timeOut: "6:00 PM",
      location: "Cebu IT Park HQ",
      status: "ON TIME",
    },
    {
      date: "Aug 10",
      day: "Sun",
      timeIn: "8:50 AM",
      timeOut: "5:58 PM",
      location: "Mandaue Warehouse",
      status: "ON TIME",
    },
    {
      date: "Aug 7",
      day: "Fri",
      timeIn: "—",
      timeOut: "—",
      location: "—",
      status: "MISSED",
    },
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

  return (
    <View className="flex-1 bg-[#0B111A]">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

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

            <Text className="mt-3 font-outfit-bold text-2xl text-white">3</Text>

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

            <Text className="mt-3 font-outfit-bold text-2xl text-white">1</Text>

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

            <Text className="mt-3 font-outfit-bold text-2xl text-white">1</Text>

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
        </View>

        {/* Attendance Records */}
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
              const config = statusConfig[item.status] || statusConfig["LATE"];

              const isLast = index === attendance.length - 1;

              return (
                <View
                  key={`${item.date}-${index}`}
                  className={`mb-3 rounded-3xl border border-white/[0.06] bg-white/[0.025] p-4 ${
                    isLast ? "mb-0" : ""
                  }`}>
                  {/* Top Row */}
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center">
                      {/* Date */}
                      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                        <Text className="font-outfit-bold text-sm text-white">
                          {item.date.split(" ")[1]}
                        </Text>

                        <Text className="font-inter-light text-[9px] uppercase text-slate-500">
                          AUG
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
                    {/* Time In */}
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

                    {/* Time Out */}
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

                  {/* Location */}
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
                      {item.location}
                    </Text>

                    {item.location !== "—" && (
                      <FontAwesome6
                        name="chevron-right"
                        size={9}
                        color="#475569"
                        iconStyle="solid"
                      />
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
