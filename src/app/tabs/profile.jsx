import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";

import Profile from "../../_pages/Profile";

export default function ProfilePage() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: "#0B111A",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "left",

          headerTitle: () => (
            <View>
              <Text
                style={{
                  fontFamily: "Outfit_700Bold",
                  fontSize: 20,
                  color: "#FFFFFF",
                }}>
                Profile
              </Text>

              <Text
                style={{
                  marginTop: 1,
                  fontFamily: "Inter_Light",
                  fontSize: 10,
                  color: "#64748B",
                }}>
                Your account
              </Text>
            </View>
          ),

          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginRight: 12,
              }}>
              {/* Notification */}
              <Pressable
                onPress={() => console.log("Notifications")}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed
                    ? "rgba(56,189,248,0.12)"
                    : "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  opacity: pressed ? 0.8 : 1,
                })}>
                <FontAwesome6
                  name="bell"
                  size={16}
                  color="#CBD5E1"
                  iconStyle="solid"
                />

                {/* Notification badge */}
                <View
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: "#38BDF8",
                    borderWidth: 1.5,
                    borderColor: "#0B111A",
                  }}
                />
              </Pressable>

              {/* User Avatar */}
              <Pressable
                onPress={() => console.log("Open profile")}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: "#38BDF8",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "rgba(56,189,248,0.25)",
                  transform: [
                    {
                      scale: pressed ? 0.94 : 1,
                    },
                  ],
                  opacity: pressed ? 0.85 : 1,
                })}>
                <Text
                  style={{
                    fontFamily: "Outfit_700Bold",
                    fontSize: 13,
                    color: "#0B111A",
                  }}>
                  JD
                </Text>
              </Pressable>
            </View>
          ),
        }}
      />

      <View className="flex-1 bg-[#0B111A]">
        <Profile />
      </View>
    </>
  );
}
