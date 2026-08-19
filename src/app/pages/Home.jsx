import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import GlassCard from "../components/GlassCard";

export default function Home() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <ScrollView
      className="flex-1 bg-[#0F1620]"
      contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}>
      {/* Geofence status */}
      <GlassCard radius={24}>
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

        <Text className="text-white mt-3 font-outfit-semibold text-xl">
          Tacloban City
        </Text>

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
      </GlassCard>

      {/* Punch In / Punch Out summary */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <GlassCard radius={24}>
            <View className="flex-row items-center self-start bg-emerald-400/10 border border-emerald-400/20 rounded-full pl-1.5 pr-3 py-1">
              <View className="w-5 h-5 rounded-full bg-emerald-400/20 items-center justify-center">
                <FontAwesome6
                  name="arrow-right-to-bracket"
                  size={10}
                  color="#34D399"
                  iconStyle="solid"
                />
              </View>
              <Text className="text-emerald-400 ml-1.5 font-outfit-medium text-xs tracking-wide">
                Punch In
              </Text>
            </View>

            <Text className="mt-3 font-outfit-semibold text-2xl text-white">
              08:00{" "}
              <Text className="text-base text-slate-400 font-outfit-medium">
                AM
              </Text>
            </Text>

            <Text className="mt-1 font-inter-light text-xs text-slate-500">
              Today, on time
            </Text>
          </GlassCard>
        </View>

        <View style={{ flex: 1 }}>
          <GlassCard radius={24}>
            <View className="flex-row items-center self-start bg-rose-400/10 border border-rose-400/20 rounded-full pl-1.5 pr-3 py-1">
              <View className="w-5 h-5 rounded-full bg-rose-400/20 items-center justify-center">
                <FontAwesome6
                  name="arrow-right-from-bracket"
                  size={10}
                  color="#FB7185"
                  iconStyle="solid"
                />
              </View>
              <Text className="text-rose-400 ml-1.5 font-outfit-medium text-xs tracking-wide">
                Punch Out
              </Text>
            </View>

            <Text className="mt-3 font-outfit-semibold text-2xl text-white">
              05:00{" "}
              <Text className="text-base text-slate-400 font-outfit-medium">
                PM
              </Text>
            </Text>

            <Text className="mt-1 font-inter-light text-xs text-slate-500">
              Estimated
            </Text>
          </GlassCard>
        </View>
      </View>

      {/* Fingerprint action */}
      <View className="items-center pt-36 pb-2">
        <Pressable
          onPress={() => console.log("Fingerprint pressed")}
          hitSlop={16}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
          })}>
          <Animated.View
            className="w-28 h-28 rounded-full bg-sky-400/10 border border-sky-400/20 items-center justify-center"
            style={{
              transform: [{ scale: pulseAnim }],
            }}>
            <FontAwesome6
              name="fingerprint"
              size={48}
              color="#38BDF8"
              iconStyle="solid"
            />
          </Animated.View>
        </Pressable>

        <Text className="text-white mt-4 font-outfit-semibold text-base">
          Tap to Punch In
        </Text>
        <Text className="text-slate-500 mt-1 font-inter-light text-xs">
          Verify with your fingerprint
        </Text>
      </View>
    </ScrollView>
  );
}
