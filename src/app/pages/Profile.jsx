import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

// Replace with the authenticated user's real data (API / store / context).
const MOCK_USER = {
  username: "areyes",
  name: "Ana Reyes",
  position: "Field Technician",
  biometricNo: "BIO-004821",
  password: "••••••••", // never keep a real password in state as plaintext in a real app
};

// Replace with the schedules actually assigned to this user.
const MOCK_SCHEDULE = [
  { id: "s1", day: "Monday", time: "7:00 AM – 4:00 PM", site: "Geofence 1" },
  { id: "s2", day: "Tuesday", time: "7:00 AM – 4:00 PM", site: "Geofence 1" },
  {
    id: "s3",
    day: "Wednesday",
    time: "1:00 PM – 9:00 PM",
    site: "Geofence 2",
  },
  { id: "s4", day: "Thursday", time: "7:00 AM – 4:00 PM", site: "Geofence 1" },
  { id: "s5", day: "Friday", time: "7:00 AM – 4:00 PM", site: "Geofence 1" },
];

function initialsFor(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function InfoRow({ icon, label, value, editable, onEdit }) {
  return (
    <View className="flex-row items-center border-b border-white/5 px-4 py-3.5 last:border-b-0">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-blue-500/15">
        <FontAwesome6 name={icon} size={13} color="#3B82F6" iconStyle="solid" />
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-[11px] font-semibold uppercase text-gray-500">
          {label}
        </Text>
        <Text className="mt-0.5 text-sm font-medium text-white">{value}</Text>
      </View>

      {editable && (
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full bg-white/5">
          <FontAwesome6
            name="pen"
            size={12}
            color="#9CA3AF"
            iconStyle="solid"
          />
        </Pressable>
      )}
    </View>
  );
}

export default function Profile() {
  const [user, setUser] = useState(MOCK_USER);

  // Username edit
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user.username);

  // Password edit
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const initials = useMemo(() => initialsFor(user.name), [user.name]);

  const openUsernameModal = () => {
    setUsernameInput(user.username);
    setShowUsernameModal(true);
  };

  const confirmUsername = () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      Alert.alert("Username required", "Username cannot be empty.");
      return;
    }
    setUser((prev) => ({ ...prev, username: trimmed }));
    setShowUsernameModal(false);
  };

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordFields(false);
    setShowPasswordModal(true);
  };

  const confirmPasswordChange = () => {
    if (!currentPassword) {
      Alert.alert("Current password required", "Enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords don't match", "Re-enter the new password.");
      return;
    }
    // Wire this up to your real auth/update-password call.
    setUser((prev) => ({ ...prev, password: "••••••••" }));
    setShowPasswordModal(false);
  };

  return (
    <View className="flex-1 bg-[#0F1620]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View className="items-center rounded-2xl border border-white/5 bg-[#141B26]/95 px-5 py-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-blue-500/15">
            <Text className="text-2xl font-bold text-blue-400">{initials}</Text>
          </View>

          <Text className="mt-4 text-lg font-semibold text-white">
            {user.name}
          </Text>

          <View className="mt-2 flex-row items-center rounded-full bg-blue-500/15 px-3 py-1">
            <FontAwesome6
              name="id-badge"
              size={11}
              color="#3B82F6"
              iconStyle="solid"
            />
            <Text className="ml-1.5 text-xs font-semibold text-blue-400">
              {user.position}
            </Text>
          </View>
        </View>

        {/* Account info */}
        <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase text-gray-500">
          Account
        </Text>
        <View className="rounded-2xl border border-white/5 bg-[#141B26]/95 overflow-hidden">
          <InfoRow
            icon="user"
            label="Username"
            value={user.username}
            editable
            onEdit={openUsernameModal}
          />
          <InfoRow
            icon="lock"
            label="Password"
            value={user.password}
            editable
            onEdit={openPasswordModal}
          />
        </View>

        {/* Read-only info */}
        <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase text-gray-500">
          Details
        </Text>
        <View className="rounded-2xl border border-white/5 bg-[#141B26]/95 overflow-hidden">
          <InfoRow icon="id-card" label="Name" value={user.name} />
          <InfoRow icon="briefcase" label="Position" value={user.position} />
          <InfoRow
            icon="fingerprint"
            label="Biometric No."
            value={user.biometricNo}
          />
        </View>

        {/* Schedule */}
        <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase text-gray-500">
          Schedule Assigned
        </Text>
        <View className="rounded-2xl border border-white/5 bg-[#141B26]/95 overflow-hidden">
          {MOCK_SCHEDULE.length === 0 ? (
            <View className="items-center px-4 py-6">
              <Text className="text-xs text-gray-500">
                No schedule assigned yet
              </Text>
            </View>
          ) : (
            MOCK_SCHEDULE.map((item, i) => (
              <View
                key={item.id}
                className={`flex-row items-center px-4 py-3.5 ${
                  i < MOCK_SCHEDULE.length - 1 ? "border-b border-white/5" : ""
                }`}>
                <View className="h-9 w-9 items-center justify-center rounded-full bg-green-500/15">
                  <FontAwesome6
                    name="calendar-day"
                    size={12}
                    color="#22C55E"
                    iconStyle="solid"
                  />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-sm font-medium text-white">
                    {item.day}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-400">
                    {item.time} · {item.site}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit username modal */}
      <Modal
        visible={showUsernameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUsernameModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-8">
          <View className="w-full rounded-2xl border border-white/10 bg-[#141B26] p-5">
            <Text className="text-sm font-semibold text-white">
              Edit Username
            </Text>

            <TextInput
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="Username"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              autoFocus
              className="mt-4 rounded-xl border border-white/10 bg-[#0F1620] px-3 py-3 text-sm text-white"
            />

            <View className="mt-4 flex-row justify-end">
              <Pressable
                onPress={() => setShowUsernameModal(false)}
                className="rounded-xl px-4 py-2">
                <Text className="text-xs font-semibold text-gray-400">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmUsername}
                className="ml-2 rounded-xl bg-blue-500 px-4 py-2">
                <Text className="text-xs font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change password modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-8">
          <View className="w-full rounded-2xl border border-white/10 bg-[#141B26] p-5">
            <Text className="text-sm font-semibold text-white">
              Change Password
            </Text>

            <View className="mt-4 flex-row items-center rounded-xl border border-white/10 bg-[#0F1620] px-3">
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                placeholderTextColor="#6B7280"
                secureTextEntry={!showPasswordFields}
                autoCapitalize="none"
                autoFocus
                className="flex-1 py-3 text-sm text-white"
              />
            </View>

            <View className="mt-3 flex-row items-center rounded-xl border border-white/10 bg-[#0F1620] px-3">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor="#6B7280"
                secureTextEntry={!showPasswordFields}
                autoCapitalize="none"
                className="flex-1 py-3 text-sm text-white"
              />
            </View>

            <View className="mt-3 flex-row items-center rounded-xl border border-white/10 bg-[#0F1620] px-3">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#6B7280"
                secureTextEntry={!showPasswordFields}
                autoCapitalize="none"
                className="flex-1 py-3 text-sm text-white"
              />
            </View>

            <Pressable
              onPress={() => setShowPasswordFields((v) => !v)}
              className="mt-3 flex-row items-center self-start">
              <FontAwesome6
                name={showPasswordFields ? "eye-slash" : "eye"}
                size={11}
                color="#9CA3AF"
                iconStyle="solid"
              />
              <Text className="ml-2 text-xs text-gray-400">
                {showPasswordFields ? "Hide" : "Show"} passwords
              </Text>
            </Pressable>

            <View className="mt-4 flex-row justify-end">
              <Pressable
                onPress={() => setShowPasswordModal(false)}
                className="rounded-xl px-4 py-2">
                <Text className="text-xs font-semibold text-gray-400">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmPasswordChange}
                className="ml-2 rounded-xl bg-blue-500 px-4 py-2">
                <Text className="text-xs font-semibold text-white">Update</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
