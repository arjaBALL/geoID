import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { usePathname, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const TABS = [
  { key: "home", label: "Home", icon: "house", route: "/home" },
  {
    key: "history",
    label: "History",
    icon: "clock-rotate-left",
    route: "/history",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "user",
    route: "/profile",
  },
];

export default function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="absolute bottom-6 left-5 right-5">
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
          const isActive =
            tab.route === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.route);

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => router.push(tab.route)}
              activeOpacity={0.75}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-full ${
                isActive ? "bg-blue-500/15" : ""
              }`}>
              <FontAwesome6
                name={tab.icon}
                size={16}
                color={isActive ? "#3B82F6" : "#6B7280"}
                iconStyle="solid"
              />

              {isActive && (
                <Text className="text-xs text-blue-500 font-semibold ml-2">
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
