// app/tabs/_layout.jsx

import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";

import BottomNavbar from "../components/Navbar";

export default function TabsLayout() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0F1620",
      }}>
      <Stack
        screenOptions={{
          headerShown: true,

          headerStyle: {
            backgroundColor: "#0F1620",
          },

          headerShadowVisible: false,

          headerTintColor: "#FFFFFF",

          animation: "fade",

          animationDuration: 200,

          contentStyle: {
            backgroundColor: "#0F1620",
          },

          headerTitle: () => (
            <View
              style={{
                justifyContent: "center",
              }}>
              <Text
                style={{
                  fontFamily: "Outfit_700Bold",
                  fontSize: 20,
                  color: "#FFFFFF",
                }}>
                Welcome back
              </Text>

              <Text
                style={{
                  marginTop: 1,
                  fontFamily: "Outfit_400Regular",
                  fontSize: 11,
                  color: "#6B7280",
                }}>
                Manage your attendance
              </Text>
            </View>
          ),

          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginRight: 4,
              }}>
              {/* Notification */}
              <Pressable
                onPress={() => console.log("Notifications")}
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(255,255,255,0.05)",
                  transform: [
                    {
                      scale: pressed ? 0.94 : 1,
                    },
                  ],
                })}>
                <FontAwesome6
                  name="bell"
                  size={18}
                  color="#E5E7EB"
                  iconStyle="solid"
                />

                {/* Notification badge */}
                <View
                  style={{
                    position: "absolute",
                    top: 7,
                    right: 7,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "#38BDF8",
                    borderWidth: 1.5,
                    borderColor: "#0F1620",
                  }}
                />
              </Pressable>

              {/* User Avatar */}
              <Pressable
                onPress={() => console.log("Open profile")}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#38BDF8",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [
                    {
                      scale: pressed ? 0.94 : 1,
                    },
                  ],
                })}>
                <Text
                  style={{
                    fontFamily: "Outfit_700Bold",
                    fontSize: 13,
                    color: "#0F1620",
                  }}>
                  JD
                </Text>
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Floating Bottom Navigation */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}>
        <BottomNavbar />
      </View>
    </View>
  );
}
