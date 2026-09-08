import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../_context/AuthContext";
import { supabase } from "../_lib/supabase";

// Dummy schedule — replace once you have a real schedules table.
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
  if (!name) return "?";
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
        <Text className="mt-0.5 text-sm font-medium text-white">
          {value ?? "—"}
        </Text>
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
  const { session, user: authUser } = useAuth();

  /* =======================================================
     REAL PROFILE DATA (users + roles + sections)
  ======================================================= */

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!authUser?.id) {
      setProfileLoading(false);
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError(null);

      // Match public.users to the logged-in auth user via the real
      // auth_id foreign key (public.users.auth_id -> auth.users.id).
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          username,
          email,
          first_name,
          last_name,
          biometric_no,
          is_active,
          roles ( name ),
          sections ( section_name, abbreviation )
        `,
        )
        .eq("auth_id", authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setProfileError(
          "No matching profile found for this account. Ask an admin to link your auth_id.",
        );
      }

      setProfile(data);
    } catch (err) {
      setProfileError(err?.message ?? "Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fullName = useMemo(() => {
    if (!profile) return authUser?.email ?? "";
    return [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  }, [profile, authUser]);

  const initials = useMemo(() => initialsFor(fullName), [fullName]);

  /* =======================================================
     USERNAME EDIT
  ======================================================= */

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const openUsernameModal = () => {
    setUsernameInput(profile?.username ?? "");
    setShowUsernameModal(true);
  };

  const confirmUsername = async () => {
    const trimmed = usernameInput.trim();

    if (!trimmed) {
      Alert.alert("Username required", "Username cannot be empty.");
      return;
    }

    if (!profile?.id) {
      Alert.alert("Error", "Profile not loaded yet.");
      return;
    }

    try {
      setSavingUsername(true);

      const { error } = await supabase
        .from("users")
        .update({ username: trimmed, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, username: trimmed }));
      setShowUsernameModal(false);
    } catch (err) {
      Alert.alert("Error", err?.message ?? "Failed to update username.");
    } finally {
      setSavingUsername(false);
    }
  };

  /* =======================================================
     PASSWORD EDIT
  ======================================================= */

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordFields(false);
    setShowPasswordModal(true);
  };

  const confirmPasswordChange = async () => {
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

    try {
      setSavingPassword(true);

      // Re-verify identity with the current password before allowing a change.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      });

      if (reauthError) {
        Alert.alert("Incorrect password", "Your current password is wrong.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert("Success", "Password updated.");
      setShowPasswordModal(false);
    } catch (err) {
      Alert.alert("Error", err?.message ?? "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  if (profileLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F1620]">
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

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
            {fullName || "—"}
          </Text>

          {profile?.roles?.name && (
            <View className="mt-2 flex-row items-center rounded-full bg-blue-500/15 px-3 py-1">
              <FontAwesome6
                name="id-badge"
                size={11}
                color="#3B82F6"
                iconStyle="solid"
              />
              <Text className="ml-1.5 text-xs font-semibold text-blue-400">
                {profile.roles.name}
              </Text>
            </View>
          )}

          {profileError && (
            <Text className="mt-3 text-xs text-red-400">{profileError}</Text>
          )}
        </View>

        {/* Account info */}
        <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase text-gray-500">
          Account
        </Text>
        <View className="overflow-hidden rounded-2xl border border-white/5 bg-[#141B26]/95">
          <InfoRow
            icon="user"
            label="Username"
            value={profile?.username}
            editable
            onEdit={openUsernameModal}
          />
          <InfoRow
            icon="envelope"
            label="Email"
            value={profile?.email ?? authUser?.email}
          />
          <InfoRow
            icon="lock"
            label="Password"
            value="••••••••"
            editable
            onEdit={openPasswordModal}
          />
        </View>

        {/* Read-only info */}
        <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase text-gray-500">
          Details
        </Text>
        <View className="overflow-hidden rounded-2xl border border-white/5 bg-[#141B26]/95">
          <InfoRow icon="id-card" label="Name" value={fullName} />
          <InfoRow
            icon="briefcase"
            label="Position"
            value={profile?.roles?.name}
          />
          <InfoRow
            icon="building"
            label="Section"
            value={
              profile?.sections
                ? `${profile.sections.section_name} (${profile.sections.abbreviation})`
                : null
            }
          />
          <InfoRow
            icon="fingerprint"
            label="Biometric No."
            value={profile?.biometric_no}
          />
        </View>

        {/* Schedule (dummy for now) */}
        <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase text-gray-500">
          Schedule Assigned
        </Text>
        <View className="overflow-hidden rounded-2xl border border-white/5 bg-[#141B26]/95">
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
              editable={!savingUsername}
              className="mt-4 rounded-xl border border-white/10 bg-[#0F1620] px-3 py-3 text-sm text-white"
            />

            <View className="mt-4 flex-row justify-end">
              <Pressable
                onPress={() => setShowUsernameModal(false)}
                disabled={savingUsername}
                className="rounded-xl px-4 py-2">
                <Text className="text-xs font-semibold text-gray-400">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmUsername}
                disabled={savingUsername}
                className="ml-2 rounded-xl bg-blue-500 px-4 py-2">
                <Text className="text-xs font-semibold text-white">
                  {savingUsername ? "Saving..." : "Save"}
                </Text>
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
                editable={!savingPassword}
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
                editable={!savingPassword}
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
                editable={!savingPassword}
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
                disabled={savingPassword}
                className="rounded-xl px-4 py-2">
                <Text className="text-xs font-semibold text-gray-400">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmPasswordChange}
                disabled={savingPassword}
                className="ml-2 rounded-xl bg-blue-500 px-4 py-2">
                <Text className="text-xs font-semibold text-white">
                  {savingPassword ? "Updating..." : "Update"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
