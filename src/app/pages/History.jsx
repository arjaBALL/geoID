import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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

  return (
    <View className="flex-1 bg-[#0F1620] p-5">
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text
              style={{
                fontFamily: "Outfit_700Bold",
                fontSize: 20,
                color: "#FFFFFF",
              }}>
              Attendance History
            </Text>
          ),
        }}
      />

      {/* Filters */}
      <View className="flex-row gap-2 mt-2 mb-4">
        {filters.map((f) => (
          <View key={f.key} className="flex-1">
            <Pressable
              onPress={() => setFilter(f.key)}
              className={`items-center justify-center rounded-3xl py-3 ${
                filter === f.key ? "bg-[#38BDF8]" : "bg-[#1A2430]"
              }`}>
              <Text
                className={
                  filter === f.key
                    ? "text-[#0F1620] font-semibold"
                    : "text-white font-semibold"
                }>
                {f.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Attendance List */}
      <View>
        {attendance.map((item, index) => (
          <View key={index} className="py-4 border-b border-[#27313D]">
            {/* Top Row */}
            <View className="flex-row items-center">
              {/* Date */}
              <View className="w-14">
                <Text className="text-white font-bold text-sm">
                  {item.date}
                </Text>

                <Text className="text-[#7D8997] text-xs mt-1">{item.day}</Text>
              </View>

              {/* Time */}
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-white font-bold text-xs">
                    {item.timeIn}
                  </Text>

                  <Text className="text-[#38BDF8] mx-1">→</Text>

                  <Text className="text-white font-bold text-xs">
                    {item.timeOut}
                  </Text>
                </View>

                {/* Location */}
                <Text className="text-[#7D8997] text-xs mt-1">
                  ◉ {item.location}
                </Text>
              </View>

              {/* Status */}
              <View
                className={`px-3 py-1 rounded-full ${
                  item.status === "ON TIME"
                    ? "bg-[#063D2B]"
                    : item.status === "LATE"
                      ? "bg-[#4A3505]"
                      : item.status === "MISSED"
                        ? "bg-[#4A1717]"
                        : "bg-[#4A3505]"
                }`}>
                <Text
                  className={`text-[9px] font-bold ${
                    item.status === "ON TIME"
                      ? "text-[#00D084]"
                      : item.status === "LATE"
                        ? "text-[#FFB800]"
                        : item.status === "MISSED"
                          ? "text-[#FF4D4D]"
                          : "text-[#FFB800]"
                  }`}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
