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
  const glowAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.75,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.45,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [pulseAnim, glowAnim]);

  return (
    <ScrollView
      className="flex-1 bg-[#0B111A]"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="font-inter-light text-sm text-slate-400">
            Good morning,
          </Text>

          <Text className="mt-1 font-outfit-bold text-2xl text-white">
            Welcome back 👋
          </Text>
        </View>

        <Pressable
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"
          onPress={() => console.log("Profile pressed")}>
          <FontAwesome6
            name="user"
            size={16}
            color="#CBD5E1"
            iconStyle="solid"
          />
        </Pressable>
      </View>

      {/* Location / Geofence */}
      <GlassCard radius={24}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center self-start rounded-full border border-sky-400/20 bg-sky-400/10 py-1 pl-1.5 pr-3">
              <View className="h-5 w-5 items-center justify-center rounded-full bg-sky-400/20">
                <FontAwesome6
                  name="location-dot"
                  size={10}
                  color="#38BDF8"
                  iconStyle="solid"
                />
              </View>

              <Text className="ml-1.5 font-outfit-medium text-xs tracking-wide text-sky-400">
                INSIDE GEOFENCE
              </Text>
            </View>

            <Text className="mt-3 font-outfit-semibold text-xl text-white">
              Tacloban City
            </Text>

            <Text className="mt-1 font-inter-light text-xs leading-5 text-slate-400">
              You're within the allowed attendance area.
            </Text>
          </View>

          <View className="ml-4 h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10">
            <FontAwesome6
              name="check"
              size={15}
              color="#34D399"
              iconStyle="solid"
            />
          </View>
        </View>

        <View className="mt-5 h-px bg-white/[0.06]" />

        <View className="mt-4 flex-row items-center">
          <FontAwesome6
            name="location-arrow"
            size={11}
            color="#64748B"
            iconStyle="solid"
          />

          <Text className="ml-2 font-inter-light text-xs text-slate-400">
            42m from center
          </Text>

          <View className="mx-3 h-1 w-1 rounded-full bg-slate-600" />

          <FontAwesome6
            name="crosshairs"
            size={11}
            color="#64748B"
            iconStyle="solid"
          />

          <Text className="ml-2 font-inter-light text-xs text-slate-400">
            ±6m accuracy
          </Text>
        </View>
      </GlassCard>

      {/* Today's Attendance */}
      <View className="mt-7">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-outfit-semibold text-lg text-white">
            Today's attendance
          </Text>

          <View className="flex-row items-center">
            <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <Text className="font-inter-light text-xs text-slate-400">
              On schedule
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          {/* Punch In */}
          <View className="flex-1">
            <GlassCard radius={22}>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10">
                <FontAwesome6
                  name="arrow-right-to-bracket"
                  size={13}
                  color="#34D399"
                  iconStyle="solid"
                />
              </View>

              <Text className="mt-4 font-outfit-medium text-xs text-slate-400">
                PUNCH IN
              </Text>

              <Text className="mt-1 font-outfit-bold text-[26px] text-white">
                08:00
                <Text className="font-outfit-medium text-sm text-slate-400">
                  {" "}
                  AM
                </Text>
              </Text>

              <View className="mt-2 flex-row items-center">
                <FontAwesome6
                  name="circle-check"
                  size={10}
                  color="#34D399"
                  iconStyle="solid"
                />

                <Text className="ml-1.5 font-inter-light text-xs text-emerald-400">
                  On time
                </Text>
              </View>
            </GlassCard>
          </View>

          {/* Punch Out */}
          <View className="flex-1">
            <GlassCard radius={22}>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-rose-400/10">
                <FontAwesome6
                  name="arrow-right-from-bracket"
                  size={13}
                  color="#FB7185"
                  iconStyle="solid"
                />
              </View>

              <Text className="mt-4 font-outfit-medium text-xs text-slate-400">
                PUNCH OUT
              </Text>

              <Text className="mt-1 font-outfit-bold text-[24px] text-white">
                05:00
                <Text className="font-outfit-medium text-sm text-slate-400">
                  {" "}
                  PM
                </Text>
              </Text>

              <View className="mt-2 flex-row items-center">
                <FontAwesome6
                  name="clock"
                  size={10}
                  color="#94A3B8"
                  iconStyle="solid"
                />

                <Text className="ml-1.5 font-inter-light text-xs text-slate-400">
                  Estimated
                </Text>
              </View>
            </GlassCard>
          </View>
        </View>
      </View>

      {/* Main Punch Action */}
      <View className="mt-9 items-center">
        <Text className="font-outfit-semibold text-lg text-white">
          Ready to check in?
        </Text>

        <Text className="mt-1 text-center font-inter-light text-xs leading-5 text-slate-500">
          Verify your identity using your fingerprint
        </Text>

        <View className="mt-7 items-center justify-center">
          {/* Outer animated glow */}
          <Animated.View
            className="absolute h-40 w-40 rounded-full bg-sky-400/10"
            style={{
              opacity: glowAnim,
              transform: [{ scale: pulseAnim }],
            }}
          />

          {/* Action button */}
          <Pressable
            onPress={() => console.log("Fingerprint pressed")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Punch in using fingerprint"
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.94 : 1 }],
              opacity: pressed ? 0.85 : 1,
            })}>
            <View className="h-32 w-32 items-center justify-center rounded-full border border-sky-400/30 bg-[#101C29]">
              <View className="h-[108px] w-[108px] items-center justify-center rounded-full bg-sky-400/10">
                <FontAwesome6
                  name="fingerprint"
                  size={50}
                  color="#38BDF8"
                  iconStyle="solid"
                />
              </View>
            </View>
          </Pressable>
        </View>

        <View className="mt-6 flex-row items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
          <FontAwesome6
            name="hand-pointer"
            size={11}
            color="#64748B"
            iconStyle="solid"
          />

          <Text className="ml-2 font-outfit-medium text-xs text-slate-400">
            Tap fingerprint to punch in
          </Text>
        </View>
      </View>

      {/* Security reassurance */}
      <View className="mt-10 flex-row items-center justify-center">
        <FontAwesome6
          name="shield-halved"
          size={11}
          color="#475569"
          iconStyle="solid"
        />

        <Text className="ml-2 font-inter-light text-[11px] text-slate-600">
          Your biometric data stays secure on your device
        </Text>
      </View>
    </ScrollView>
  );
}
