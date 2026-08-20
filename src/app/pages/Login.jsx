import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Buttons";
import Input from "../components/Input";

const Login = () => {
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
              <View className="h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-[#38BDF8]/10 border border-[#38BDF8]/10">
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
              {/* Email */}
              <View>
                <Text className="mb-2 font-outfit-bold text-sm text-zinc-200">
                  Email address
                </Text>

                <Input type="email" placeholder="you@example.com" />
              </View>

              {/* Password */}
              <View className="mt-5">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="font-outfit-bold text-sm text-zinc-200">
                    Password
                  </Text>

                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      // Navigate to forgot password screen
                      // router.push("/forgot-password");
                    }}>
                    <Text className="font-outfit-bold text-sm text-[#38BDF8]">
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>

                <Input type="password" placeholder="Enter your password" />
              </View>

              {/* Primary CTA */}
              <Button
                className="mt-8"
                title="Sign In"
                onPress={() => router.replace("/tabs/home")}
              />

              {/* Divider */}
              <View className="my-7 flex-row items-center">
                <View className="h-px flex-1 bg-white/10" />

                <Text className="mx-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  or
                </Text>

                <View className="h-px flex-1 bg-white/10" />
              </View>

              {/* Secondary action */}
              <View className="flex-row items-center justify-center">
                <Text className="text-sm text-zinc-400">
                  Don't have an account?
                </Text>

                <Pressable
                  className="ml-1.5 min-h-[44px] justify-center px-1"
                  onPress={() => router.push("/register")}>
                  <Text className="font-outfit-bold text-sm text-[#38BDF8]">
                    Create account
                  </Text>
                </Pressable>
              </View>
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
