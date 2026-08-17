import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "../components/Buttons";
import Input from "../components/Input";

const Login = () => {
  return (
    <View>
      <View className="items-center mb-24">
        <FontAwesome6
          name="fingerprint"
          size={64}
          color="#38BDF8"
          iconStyle="solid"
        />
      </View>

      <View className="flex-1 justify-center">
        <Text className="mb-4 self-center font-outfit-bold text-2xl text-blue-400">
          Sign In
        </Text>

        <Text className="mb-2 font-outfit-bold text-zinc-400">
          Username/Email
        </Text>

        <Input type="email" placeholder="Email" />

        <Text className="mb-2 mt-4 font-outfit-bold text-zinc-400">
          Password
        </Text>

        <Input type="password" placeholder="Password" />
        <Button
          className="mt-8"
          title="Sign In"
          onPress={() => router.replace("/home")}
        />
      </View>
    </View>
  );
};

export default Login;
