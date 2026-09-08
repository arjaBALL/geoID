import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { Alert } from "react-native";
import { supabase } from "../_lib/supabase";

export default function Assign_biometric_id() {
  const [employees, setEmployees] = useState([]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [biometricNo, setBiometricNo] = useState("");

  const [addVisible, setAddVisible] = useState(false);

  // Add Employee form fields — matches the `users` table columns
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================
  // ROLES
  // =========================================

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleDropdownVisible, setRoleDropdownVisible] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  // =========================================
  // FETCH ROLES FROM SUPABASE
  // =========================================

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setRolesLoading(true);

    const { data, error } = await supabase
      .from("roles")
      .select("id, name, description")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    } else {
      console.log("Roles fetched:", data);
      setRoles(data || []);
    }

    setRolesLoading(false);
  };

  // =========================================
  // SECTIONS
  // =========================================

  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionDropdownVisible, setSectionDropdownVisible] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // =========================================
  // FETCH SECTIONS FROM SUPABASE
  // =========================================

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setSectionsLoading(true);

    const { data, error } = await supabase
      .from("sections")
      .select("id, section_name, abbreviation")
      .order("section_name", { ascending: true });

    if (error) {
      console.error("Error fetching sections:", error);
      setSections([]);
    } else {
      console.log("Sections fetched:", data);
      setSections(data || []);
    }

    setSectionsLoading(false);
  };

  // =========================================
  // FETCH EMPLOYEES (users) FROM SUPABASE
  // =========================================

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, biometric_no, username, email, role_id, section, is_active, roles(name)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
    } else {
      const mapped = (data || []).map((user) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        role: user.roles?.name ?? "No role assigned",
        biometricNo: user.biometric_no ?? null,
      }));

      setEmployees(mapped);
    }

    setLoading(false);
  };

  // =========================================
  // ADD EMPLOYEE (insert into `users`)
  // =========================================

  const isAddFormValid =
    newFirstName.trim() &&
    newLastName.trim() &&
    newUsername.trim() &&
    newEmail.trim() &&
    newPassword.trim() &&
    selectedRole;

  const handleAddEmployee = async () => {
    if (!isAddFormValid) {
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .insert({
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword, // NOTE: hash this before insert — see note below
          role_id: selectedRole.id,
          section: selectedSection?.id ?? null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding employee:", error);
        Alert.alert("Error", error.message);
        return;
      }

      console.log("Employee added:", data);

      closeAddModal();

      await fetchEmployees();

      Alert.alert("Success", "Employee added successfully.");
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "Something went wrong while adding the employee.");
    } finally {
      setLoading(false);
    }
  };

  const closeAddModal = () => {
    setAddVisible(false);
    setNewFirstName("");
    setNewLastName("");
    setNewUsername("");
    setNewEmail("");
    setNewPassword("");
    setSelectedSection(null);
    setSelectedRole(null);
    setRoleDropdownVisible(false);
    setSectionDropdownVisible(false);
  };

  // =========================================
  // ASSIGN BIOMETRIC
  // =========================================

  const openAssignDrawer = (employee) => {
    setSelectedEmployee(employee);
    setBiometricNo(employee.biometricNo || "");
    setDrawerVisible(true);
  };

  const closeAssignDrawer = () => {
    setDrawerVisible(false);
    setSelectedEmployee(null);
    setBiometricNo("");
  };

  const handleAssign = async () => {
    if (!selectedEmployee || !biometricNo.trim()) {
      return;
    }

    try {
      setLoading(true);

      // NOTE: your `users` table screenshot doesn't show a biometric_no
      // column yet — add one (e.g. `biometric_no varchar`) before this
      // update will succeed against Supabase.
      const { error } = await supabase
        .from("users")
        .update({ biometric_no: biometricNo.trim() })
        .eq("id", selectedEmployee.id);

      if (error) {
        console.error("Error assigning biometric:", error);
        Alert.alert("Error", error.message);
        return;
      }

      setEmployees((prev) =>
        prev.map((employee) =>
          employee.id === selectedEmployee.id
            ? { ...employee, biometricNo: biometricNo.trim() }
            : employee,
        ),
      );

      closeAssignDrawer();
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "Something went wrong while assigning the ID.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // SEARCH
  // =========================================

  const filteredEmployees = employees.filter((employee) => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return (
      employee.name.toLowerCase().includes(query) ||
      employee.role?.toLowerCase().includes(query) ||
      employee.biometricNo?.toString().includes(query)
    );
  });

  // =========================================
  // COUNTS
  // =========================================

  const assignedCount = employees.filter(
    (employee) => employee.biometricNo,
  ).length;

  const unassignedCount = employees.length - assignedCount;

  // =========================================
  // RENDER
  // =========================================

  return (
    <View className="flex-1 bg-[#0B111A]">
      {/* =========================================
          HEADER
      ========================================= */}

      <View className="px-5 pb-4 pt-6 mt-10">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-inter-light text-[11px] tracking-[1.5px] text-slate-500">
              EMPLOYEE MANAGEMENT
            </Text>

            <Text className="mt-1 font-outfit-bold text-2xl text-white">
              Biometric IDs
            </Text>

            <Text className="mt-1 font-inter-light text-xs leading-5 text-slate-400">
              Assign and manage employee biometric numbers.
            </Text>
          </View>

          {/* Add Employee */}
          <Pressable
            onPress={() => setAddVisible(true)}
            hitSlop={8}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.94 : 1 }],
              opacity: pressed ? 0.8 : 1,
            })}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10">
            <FontAwesome6
              name="user-plus"
              size={15}
              color="#38BDF8"
              iconStyle="solid"
            />
          </Pressable>
        </View>
      </View>

      {/* =========================================
          SUMMARY
      ========================================= */}

      <View className="px-5">
        <View className="flex-row gap-3">
          {/* Total */}
          <View className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-sky-400/10">
              <FontAwesome6
                name="users"
                size={13}
                color="#38BDF8"
                iconStyle="solid"
              />
            </View>

            <Text className="mt-3 font-outfit-bold text-2xl text-white">
              {employees.length}
            </Text>

            <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
              Employees
            </Text>
          </View>

          {/* Assigned */}
          <View className="flex-1 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10">
              <FontAwesome6
                name="fingerprint"
                size={13}
                color="#34D399"
                iconStyle="solid"
              />
            </View>

            <Text className="mt-3 font-outfit-bold text-2xl text-white">
              {assignedCount}
            </Text>

            <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
              Assigned
            </Text>
          </View>

          {/* Unassigned */}
          <View className="flex-1 rounded-2xl border border-amber-400/10 bg-amber-400/[0.04] p-4">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10">
              <FontAwesome6
                name="fingerprint-slash"
                size={13}
                color="#FBBF24"
                iconStyle="solid"
              />
            </View>

            <Text className="mt-3 font-outfit-bold text-2xl text-white">
              {unassignedCount}
            </Text>

            <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
              Pending
            </Text>
          </View>
        </View>
      </View>

      {/* =========================================
          SEARCH
      ========================================= */}

      <View className="px-5 pt-6">
        <View className="flex-row items-center rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4">
          <FontAwesome6
            name="magnifying-glass"
            size={13}
            color="#64748B"
            iconStyle="solid"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search employee..."
            placeholderTextColor="#64748B"
            className="ml-3 flex-1 py-3.5 font-inter-light text-sm text-white"
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <FontAwesome6
                name="xmark"
                size={13}
                color="#64748B"
                iconStyle="solid"
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* =========================================
          SECTION HEADER
      ========================================= */}

      <View className="flex-row items-center justify-between px-5 pb-3 pt-6">
        <Text className="font-outfit-semibold text-base text-white">
          Employees
        </Text>

        <Text className="font-inter-light text-[11px] text-slate-500">
          {filteredEmployees.length} records
        </Text>
      </View>

      {/* =========================================
          EMPLOYEE LIST
      ========================================= */}

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const hasBiometric = Boolean(item.biometricNo);

          return (
            <View className="mb-3 rounded-3xl border border-white/[0.06] bg-white/[0.025] p-4">
              {/* Employee Header */}
              <View className="flex-row items-center">
                {/* Avatar */}
                <View className="h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/10 bg-sky-400/10">
                  <FontAwesome6
                    name="user"
                    size={17}
                    color="#38BDF8"
                    iconStyle="solid"
                  />
                </View>

                {/* Employee Info */}
                <View className="ml-3 flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-outfit-semibold text-[15px] text-white">
                    {item.name}
                  </Text>

                  <Text
                    numberOfLines={1}
                    className="mt-0.5 font-inter-light text-[11px] text-slate-500">
                    {item.role}
                  </Text>
                </View>

                {/* Status */}
                <View
                  className={`flex-row items-center rounded-full border px-2.5 py-1.5 ${
                    hasBiometric
                      ? "border-emerald-400/20 bg-emerald-400/10"
                      : "border-amber-400/20 bg-amber-400/10"
                  }`}>
                  <View
                    className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                      hasBiometric ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />

                  <Text
                    className={`font-outfit-semibold text-[8px] ${
                      hasBiometric ? "text-emerald-400" : "text-amber-400"
                    }`}>
                    {hasBiometric ? "ASSIGNED" : "PENDING"}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View className="my-4 h-px bg-white/[0.05]" />

              {/* Biometric Information */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-xl ${
                      hasBiometric ? "bg-emerald-400/10" : "bg-white/[0.04]"
                    }`}>
                    <FontAwesome6
                      name="fingerprint"
                      size={12}
                      color={hasBiometric ? "#34D399" : "#64748B"}
                      iconStyle="solid"
                    />
                  </View>

                  <View className="ml-2.5">
                    <Text className="font-inter-light text-[9px] uppercase tracking-wide text-slate-500">
                      Biometric Number
                    </Text>

                    <Text className="mt-0.5 font-outfit-medium text-xs text-white">
                      {hasBiometric ? `ID ${item.biometricNo}` : "Not assigned"}
                    </Text>
                  </View>
                </View>

                {/* Assign Button */}
                <Pressable
                  onPress={() => openAssignDrawer(item)}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: pressed ? 0.8 : 1,
                  })}
                  className={`flex-row items-center rounded-xl px-3.5 py-2.5 ${
                    hasBiometric
                      ? "border border-white/[0.08] bg-white/[0.04]"
                      : "bg-sky-400"
                  }`}>
                  <FontAwesome6
                    name={hasBiometric ? "pen" : "fingerprint"}
                    size={10}
                    color={hasBiometric ? "#94A3B8" : "#0B111A"}
                    iconStyle="solid"
                  />

                  <Text
                    className={`ml-2 font-outfit-semibold text-[10px] ${
                      hasBiometric ? "text-slate-300" : "text-[#0B111A]"
                    }`}>
                    {hasBiometric ? "EDIT" : "ASSIGN"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center rounded-3xl border border-white/[0.06] bg-white/[0.025] px-6 py-12">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
              <FontAwesome6
                name="users-slash"
                size={20}
                color="#64748B"
                iconStyle="solid"
              />
            </View>

            <Text className="mt-4 font-outfit-semibold text-base text-white">
              No employees found
            </Text>

            <Text className="mt-1 text-center font-inter-light text-xs text-slate-500">
              Try a different search term or add a new employee.
            </Text>
          </View>
        }
      />

      {/* =========================================
          ASSIGN BIOMETRIC MODAL
      ========================================= */}

      <Modal
        visible={drawerVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAssignDrawer}>
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <Pressable
            onPress={closeAssignDrawer}
            className="absolute inset-0 bg-black/70"
          />

          {/* Bottom Sheet */}
          <View className="rounded-t-[32px] border-t border-white/[0.06] bg-[#101923] px-5 pb-10 pt-3">
            {/* Handle */}
            <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-slate-700" />

            {/* Header */}
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10">
                <FontAwesome6
                  name="fingerprint"
                  size={20}
                  color="#38BDF8"
                  iconStyle="solid"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="font-outfit-bold text-xl text-white">
                  {selectedEmployee?.biometricNo
                    ? "Update Biometric ID"
                    : "Assign Biometric ID"}
                </Text>

                <Text className="mt-0.5 font-inter-light text-xs text-slate-500">
                  Register the employee's biometric number.
                </Text>
              </View>

              <Pressable
                onPress={closeAssignDrawer}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/[0.04]">
                <FontAwesome6
                  name="xmark"
                  size={14}
                  color="#64748B"
                  iconStyle="solid"
                />
              </Pressable>
            </View>

            {/* Selected Employee */}
            <View className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <Text className="font-inter-light text-[9px] uppercase tracking-wide text-slate-500">
                Employee
              </Text>

              <View className="mt-3 flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10">
                  <FontAwesome6
                    name="user"
                    size={14}
                    color="#38BDF8"
                    iconStyle="solid"
                  />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="font-outfit-semibold text-sm text-white">
                    {selectedEmployee?.name}
                  </Text>

                  <Text className="mt-0.5 font-inter-light text-[11px] text-slate-500">
                    {selectedEmployee?.role}
                  </Text>
                </View>
              </View>
            </View>

            {/* Biometric Number */}
            <View className="mt-5">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-outfit-medium text-xs text-slate-300">
                  Biometric Number
                </Text>

                <Text className="font-inter-light text-[10px] text-slate-600">
                  Numeric only
                </Text>
              </View>

              <View
                className={`flex-row items-center rounded-2xl border px-4 ${
                  biometricNo.length > 0
                    ? "border-sky-400/30 bg-sky-400/[0.04]"
                    : "border-white/[0.08] bg-white/[0.025]"
                }`}>
                <FontAwesome6
                  name="hashtag"
                  size={12}
                  color={biometricNo.length > 0 ? "#38BDF8" : "#64748B"}
                  iconStyle="solid"
                />

                <TextInput
                  value={biometricNo}
                  onChangeText={setBiometricNo}
                  placeholder="Enter biometric number"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                  maxLength={20}
                  className="ml-3 flex-1 py-4 font-outfit-medium text-base text-white"
                />
              </View>
            </View>

            {/* Action */}
            <Pressable
              disabled={!biometricNo.trim() || loading}
              onPress={handleAssign}
              className={`mt-6 flex-row items-center justify-center rounded-2xl py-4 ${
                biometricNo.trim() ? "bg-sky-400" : "bg-white/[0.06]"
              }`}>
              <FontAwesome6
                name={selectedEmployee?.biometricNo ? "pen" : "fingerprint"}
                size={14}
                color={biometricNo.trim() ? "#0B111A" : "#475569"}
                iconStyle="solid"
              />

              <Text
                className={`ml-2 font-outfit-bold text-sm ${
                  biometricNo.trim() ? "text-[#0B111A]" : "text-slate-600"
                }`}>
                {selectedEmployee?.biometricNo
                  ? "Update Biometric ID"
                  : "Assign Biometric ID"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* =========================================
          ADD EMPLOYEE MODAL
      ========================================= */}

      <Modal
        visible={addVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAddModal}>
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <Pressable
            onPress={closeAddModal}
            className="absolute inset-0 bg-black/70"
          />

          {/* Bottom Sheet */}
          <View className="rounded-t-[32px] border-t border-white/[0.06] bg-[#101923] px-5 pb-10 pt-3">
            {/* Handle */}
            <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-slate-700" />

            {/* Header */}
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10">
                <FontAwesome6
                  name="user-plus"
                  size={18}
                  color="#38BDF8"
                  iconStyle="solid"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="font-outfit-bold text-xl text-white">
                  Add Employee
                </Text>

                <Text className="mt-0.5 font-inter-light text-xs text-slate-500">
                  Create a new employee record.
                </Text>
              </View>

              <Pressable
                onPress={closeAddModal}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/[0.04]">
                <FontAwesome6
                  name="xmark"
                  size={14}
                  color="#64748B"
                  iconStyle="solid"
                />
              </Pressable>
            </View>

            {/* =====================================
                FIRST NAME
            ===================================== */}

            <View className="mt-6">
              <Text className="mb-2 font-outfit-medium text-xs text-slate-300">
                First Name
              </Text>

              <View className="flex-row items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4">
                <FontAwesome6
                  name="user"
                  size={12}
                  color="#64748B"
                  iconStyle="solid"
                />

                <TextInput
                  value={newFirstName}
                  onChangeText={setNewFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor="#475569"
                  autoCapitalize="words"
                  className="ml-3 flex-1 py-4 font-inter-light text-sm text-white"
                />
              </View>
            </View>

            {/* =====================================
                LAST NAME
            ===================================== */}

            <View className="mt-4">
              <Text className="mb-2 font-outfit-medium text-xs text-slate-300">
                Last Name
              </Text>

              <View className="flex-row items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4">
                <FontAwesome6
                  name="user"
                  size={12}
                  color="#64748B"
                  iconStyle="solid"
                />

                <TextInput
                  value={newLastName}
                  onChangeText={setNewLastName}
                  placeholder="Enter last name"
                  placeholderTextColor="#475569"
                  autoCapitalize="words"
                  className="ml-3 flex-1 py-4 font-inter-light text-sm text-white"
                />
              </View>
            </View>

            {/* =====================================
                USERNAME
            ===================================== */}

            <View className="mt-4">
              <Text className="mb-2 font-outfit-medium text-xs text-slate-300">
                Username
              </Text>

              <View className="flex-row items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4">
                <FontAwesome6
                  name="at"
                  size={12}
                  color="#64748B"
                  iconStyle="solid"
                />

                <TextInput
                  value={newUsername}
                  onChangeText={setNewUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  className="ml-3 flex-1 py-4 font-inter-light text-sm text-white"
                />
              </View>
            </View>

            {/* =====================================
                EMAIL
            ===================================== */}

            <View className="mt-4">
              <Text className="mb-2 font-outfit-medium text-xs text-slate-300">
                Email
              </Text>

              <View className="flex-row items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4">
                <FontAwesome6
                  name="envelope"
                  size={12}
                  color="#64748B"
                  iconStyle="solid"
                />

                <TextInput
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Enter email"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="ml-3 flex-1 py-4 font-inter-light text-sm text-white"
                />
              </View>
            </View>

            {/* =====================================
                PASSWORD
            ===================================== */}

            <View className="mt-4">
              <Text className="mb-2 font-outfit-medium text-xs text-slate-300">
                Temporary Password
              </Text>

              <View className="flex-row items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4">
                <FontAwesome6
                  name="lock"
                  size={12}
                  color="#64748B"
                  iconStyle="solid"
                />

                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter temporary password"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  secureTextEntry
                  className="ml-3 flex-1 py-4 font-inter-light text-sm text-white"
                />
              </View>
            </View>

            {/* =====================================
                SECTION DROPDOWN
            ===================================== */}

            <View className="mt-4">
              <Text className="mb-2 font-outfit-medium text-xs text-slate-300">
                Section
              </Text>

              <Pressable
                onPress={() =>
                  setSectionDropdownVisible(!sectionDropdownVisible)
                }
                className={`flex-row items-center rounded-2xl border px-4 ${
                  sectionDropdownVisible
                    ? "border-sky-400/30 bg-sky-400/[0.04]"
                    : "border-white/[0.08] bg-white/[0.025]"
                }`}>
                <FontAwesome6
                  name="people-roof"
                  size={12}
                  color={selectedSection ? "#38BDF8" : "#64748B"}
                  iconStyle="solid"
                />

                <Text
                  className={`ml-3 flex-1 py-4 font-inter-light text-sm ${
                    selectedSection ? "text-white" : "text-slate-600"
                  }`}>
                  {sectionsLoading
                    ? "Loading sections..."
                    : selectedSection
                      ? selectedSection.section_name
                      : "Select section"}
                </Text>

                <FontAwesome6
                  name={sectionDropdownVisible ? "chevron-up" : "chevron-down"}
                  size={10}
                  color="#64748B"
                  iconStyle="solid"
                />
              </Pressable>

              {/* Dropdown */}
              {sectionDropdownVisible && (
                <View className="mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#17212D]">
                  {sections.length === 0 ? (
                    <View className="px-4 py-5">
                      <Text className="text-center font-inter-light text-sm text-slate-500">
                        {sectionsLoading
                          ? "Loading sections..."
                          : "No sections available"}
                      </Text>
                    </View>
                  ) : (
                    sections.map((section, index) => (
                      <Pressable
                        key={section.id}
                        onPress={() => {
                          setSelectedSection(section);
                          setSectionDropdownVisible(false);
                        }}
                        className={`flex-row items-center px-4 py-4 ${
                          index < sections.length - 1
                            ? "border-b border-white/[0.05]"
                            : ""
                        }`}>
                        <View className="h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10">
                          <FontAwesome6
                            name="people-roof"
                            size={12}
                            color="#38BDF8"
                            iconStyle="solid"
                          />
                        </View>

                        <View className="ml-3 flex-1">
                          <Text className="font-outfit-medium text-sm capitalize text-white">
                            {section.section_name}
                          </Text>
                        </View>

                        {selectedSection?.id === section.id && (
                          <FontAwesome6
                            name="check"
                            size={13}
                            color="#38BDF8"
                            iconStyle="solid"
                          />
                        )}
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* =====================================
                ROLE DROPDOWN
            ===================================== */}

            <View className="mt-4">
              <Text className="mb-2 font-outfit-medium text-xs text-slate-300">
                Role
              </Text>

              <Pressable
                onPress={() => setRoleDropdownVisible(!roleDropdownVisible)}
                className={`flex-row items-center rounded-2xl border px-4 ${
                  roleDropdownVisible
                    ? "border-sky-400/30 bg-sky-400/[0.04]"
                    : "border-white/[0.08] bg-white/[0.025]"
                }`}>
                <FontAwesome6
                  name="shield-halved"
                  size={12}
                  color={selectedRole ? "#38BDF8" : "#64748B"}
                  iconStyle="solid"
                />

                <Text
                  className={`ml-3 flex-1 py-4 font-inter-light text-sm ${
                    selectedRole ? "text-white" : "text-slate-600"
                  }`}>
                  {rolesLoading
                    ? "Loading roles..."
                    : selectedRole
                      ? selectedRole.name
                      : "Select role"}
                </Text>

                <FontAwesome6
                  name={roleDropdownVisible ? "chevron-up" : "chevron-down"}
                  size={10}
                  color="#64748B"
                  iconStyle="solid"
                />
              </Pressable>

              {/* Dropdown */}
              {roleDropdownVisible && (
                <View className="mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#17212D]">
                  {roles.length === 0 ? (
                    <View className="px-4 py-5">
                      <Text className="text-center font-inter-light text-sm text-slate-500">
                        {rolesLoading
                          ? "Loading roles..."
                          : "No roles available"}
                      </Text>
                    </View>
                  ) : (
                    roles.map((role, index) => (
                      <Pressable
                        key={role.id}
                        onPress={() => {
                          setSelectedRole(role);
                          setRoleDropdownVisible(false);
                        }}
                        className={`flex-row items-center px-4 py-4 ${
                          index < roles.length - 1
                            ? "border-b border-white/[0.05]"
                            : ""
                        }`}>
                        <View className="h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10">
                          <FontAwesome6
                            name="shield-halved"
                            size={12}
                            color="#38BDF8"
                            iconStyle="solid"
                          />
                        </View>

                        <View className="ml-3 flex-1">
                          <Text className="font-outfit-medium text-sm capitalize text-white">
                            {role.name}
                          </Text>

                          {role.description && (
                            <Text className="mt-0.5 font-inter-light text-[10px] text-slate-500">
                              {role.description}
                            </Text>
                          )}
                        </View>

                        {selectedRole?.id === role.id && (
                          <FontAwesome6
                            name="check"
                            size={13}
                            color="#38BDF8"
                            iconStyle="solid"
                          />
                        )}
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* =====================================
                ADD BUTTON
            ===================================== */}

            <Pressable
              disabled={!isAddFormValid || loading}
              onPress={handleAddEmployee}
              className={`mt-6 flex-row items-center justify-center rounded-2xl py-4 ${
                isAddFormValid ? "bg-sky-400" : "bg-white/[0.06]"
              }`}>
              <FontAwesome6
                name="user-plus"
                size={14}
                color={isAddFormValid ? "#0B111A" : "#475569"}
                iconStyle="solid"
              />

              <Text
                className={`ml-2 font-outfit-bold text-sm ${
                  isAddFormValid ? "text-[#0B111A]" : "text-slate-600"
                }`}>
                {loading ? "Adding..." : "Add Employee"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
