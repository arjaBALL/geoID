import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Text, View } from "react-native";
import GlassCard from "../components/GlassCard";
import BottomNavbar from "../components/Navbar";

export default function Home() {
  return (
    <View className="flex-1 bg-[#0F1620] p-5">
      <GlassCard radius={24}>
        <View className="">
          {/* Status badge */}
          <View className="flex-row items-center self-start bg-sky-400/10 border border-sky-400/20 rounded-full pl-1.5 pr-3 py-1">
            <View className="w-5 h-5 rounded-full bg-sky-400/20 items-center justify-center">
              <FontAwesome6
                name="location-pin"
                size={10}
                color="#38BDF8"
                iconStyle="solid"
              />
            </View>
            <Text className="text-sky-400 ml-1.5 font-outfit-medium text-xs tracking-wide">
              INSIDE GEOFENCE
            </Text>
          </View>

          {/* Title */}
          <Text className="text-white mt-3 font-outfit-semibold text-xl">
            Tacloban City
          </Text>

          {/* Meta row */}
          <View className="flex-row items-center mt-1.5">
            <FontAwesome6
              name="ruler"
              size={11}
              color="#64748B"
              iconStyle="solid"
            />
            <Text className="text-slate-400 ml-1.5 font-inter-light text-sm">
              42m from center
            </Text>
            <View className="w-1 h-1 rounded-full bg-slate-600 mx-2" />
            <Text className="text-slate-400 font-inter-light text-sm">
              ±6m accuracy
            </Text>
          </View>
        </View>
      </GlassCard>
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavbar />
      </View>
    </View>
  );
}
