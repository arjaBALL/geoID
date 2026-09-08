import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../_components/Buttons";
import Input from "../_components/Input";
import { supabase } from "../_lib/supabase";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);

      const { data: userRow, error: lookupError } = await supabase
        .from("login_lookup")
        .select("email")
        .eq("username", username.trim())
        .maybeSingle();

      console.log("lookup result:", {
        userRow,
        lookupError,
        searchedUsername: username.trim(),
      });

      if (lookupError) {
        Alert.alert("Error", lookupError.message);
        return;
      }

      if (!userRow?.email) {
        Alert.alert("Login failed", "No account found with that username.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: userRow.email,
        password: password,
      });

      if (error) {
        Alert.alert("Login failed", error.message);
        return;
      }

      router.replace("/tabs/home");
    } catch (err) {
      Alert.alert("Error", err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B111A]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center">
            {/* Brand */}
            <View className="items-center">
              <View className="h-[76px] w-[76px] items-center justify-center rounded-[24px] border border-[#38BDF8]/10 bg-[#38BDF8]/10">
                <View className="h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[#38BDF8]/10">
                  <FontAwesome6
                    name="fingerprint"
                    size={30}
                    color="#38BDF8"
                    iconStyle="solid"
                  />
                </View>
              </View>

              <Text className="mt-7 font-outfit-bold text-[30px] leading-9 text-white">
                Welcome back
              </Text>

              <Text className="mt-2 max-w-[280px] text-center text-[15px] leading-6 text-zinc-400">
                Sign in to your account and pick up where you left off.
              </Text>
            </View>

            {/* Form */}
            <View className="mt-10">
              {/* Username */}
              <View className="gap-2">
                <Text className="font-outfit-bold text-sm text-zinc-200">
                  Username or ID
                </Text>

                <Input
                  type="text"
                  placeholder="Enter your username or ID"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

              {/* Password */}
              <View className="mt-5">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="font-outfit-bold text-sm text-zinc-200">
                    Password
                  </Text>
                </View>

                <Input
                  type="password"
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Primary CTA */}
              <Button
                className="mt-8"
                title={loading ? "Signing in..." : "Sign In"}
                onPress={handleLogin}
                disabled={loading}
              />
            </View>
          </View>

          {/* Footer */}
          <View className="items-center pb-2 pt-8">
            <View className="mb-3 flex-row items-center">
              <FontAwesome6
                name="shield-halved"
                size={11}
                color="#71717A"
                iconStyle="solid"
              />

              <Text className="ml-2 text-xs text-zinc-500">
                Your information is secure and protected
              </Text>
            </View>

            <Text className="text-xs text-zinc-600">© 2026 Your App</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
