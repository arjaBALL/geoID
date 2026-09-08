import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";

const TABS = [
  {
    key: "home",
    label: "Home",
    icon: "house",
    route: "/tabs/home",
  },
  {
    key: "history",
    label: "History",
    icon: "clock-rotate-left",
    route: "/tabs/history",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "user",
    route: "/tabs/profile",
  },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "chart-line",
    route: "/tabs/dashboard",
  },
  {
    key: "geo_location",
    label: "Location",
    icon: "location-dot",
    route: "/tabs/geo_location",
  },
  {
    key: "assign_biometric_id",
    label: "Biometric",
    icon: "fingerprint",
    route: "/tabs/assign_biometric_id",
  },
  {
    key: "download_raw_logs",
    label: "Logs",
    icon: "download",
    route: "/tabs/download_raw",
  },
];

function AnimatedTab({ tab, isActive, onPress }) {
  const scale = useRef(new Animated.Value(isActive ? 1 : 0.9)).current;
  const opacity = useRef(new Animated.Value(isActive ? 1 : 0.65)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1 : 0.9,
        useNativeDriver: true,
        damping: 14,
        stiffness: 180,
        mass: 0.7,
      }),

      Animated.timing(opacity, {
        toValue: isActive ? 1 : 0.65,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center">
      <Animated.View
        style={{
          transform: [{ scale }],
          opacity,
        }}
        className={`h-12 w-12 items-center justify-center rounded-full ${
          isActive ? "bg-blue-500/15" : "bg-transparent"
        }`}>
        <FontAwesome6
          name={tab.icon}
          size={18}
          color={isActive ? "#3B82F6" : "#6B7280"}
          iconStyle="solid"
        />
      </Animated.View>

      {isActive && (
        <Text className="mt-1 text-[9px] font-semibold text-blue-400">
          {tab.label}
        </Text>
      )}
    </Pressable>
  );
}

export default function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabPress = (route) => {
    if (pathname === route) {
      return;
    }

    router.replace(route);
  };

  return (
    <View className="absolute bottom-7 left-5 right-5">
      <View
        className="
          flex-row
          items-center
          rounded-[30px]
          border
          border-white/10
          bg-[#141B26]/95
          px-2
          py-2
        "
        style={{
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 10,
        }}>
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.route || pathname.startsWith(`${tab.route}/`);

          return (
            <AnimatedTab
              key={tab.key}
              tab={tab}
              isActive={isActive}
              onPress={() => handleTabPress(tab.route)}
            />
          );
        })}
      </View>
    </View>
  );
}
