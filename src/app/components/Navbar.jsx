import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { usePathname, useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";

const TABS = [
  {
    key: "home",
    icon: "house",
    route: "/tabs/home",
  },
  {
    key: "history",
    icon: "clock-rotate-left",
    route: "/tabs/history",
  },
  {
    key: "profile",
    icon: "user",
    route: "/tabs/profile",
  },
  {
    key: "dashboard",
    icon: "chart-line",
    route: "/tabs/dashboard",
  },
  {
    key: "geo_location",
    icon: "location-dot",
    route: "/tabs/geo_location",
  },
  {
    key: "assign_biometric_id",
    icon: "fingerprint",
    route: "/tabs/assign_biometric_id",
  },
  {
    key: "download_raw_logs",
    icon: "download",
    route: "/tabs/download_raw_logs",
  },
];

export default function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="absolute bottom-12 left-5 right-5">
      <View
        className="flex-row bg-[#141B26] rounded-[28px] p-2 border border-white/5"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 12,
        }}>
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.route);

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => router.push(tab.route)}
              activeOpacity={0.75}
              className={`flex-1 items-center justify-center py-3 rounded-full ${
                isActive ? "bg-blue-500/15" : ""
              }`}>
              <FontAwesome6
                name={tab.icon}
                size={18}
                color={isActive ? "#3B82F6" : "#6B7280"}
                iconStyle="solid"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
