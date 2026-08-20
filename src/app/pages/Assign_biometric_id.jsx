import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const INITIAL_EMPLOYEES = [
  {
    id: "1",
    name: "Juan Dela Cruz",
    role: "Administrative Officer",
    biometricNo: "1024",
  },
  {
    id: "2",
    name: "Maria Santos",
    role: "HR Officer",
    biometricNo: "1025",
  },
  {
    id: "3",
    name: "Pedro Reyes",
    role: "IT Officer",
    biometricNo: null,
  },
];

export default function Assign_biometric_id() {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [biometricNo, setBiometricNo] = useState("");

  const [addVisible, setAddVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");

  const [search, setSearch] = useState("");

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

  const handleAssign = () => {
    if (!selectedEmployee || !biometricNo.trim()) {
      return;
    }

    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === selectedEmployee.id
          ? {
              ...employee,
              biometricNo: biometricNo.trim(),
            }
          : employee,
      ),
    );

    closeAssignDrawer();
  };

  const handleAddEmployee = () => {
    if (!newName.trim() || !newRole.trim()) {
      return;
    }

    setEmployees((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newName.trim(),
        role: newRole.trim(),
        biometricNo: null,
      },
    ]);

    setNewName("");
    setNewRole("");
    setAddVisible(false);
  };

  const filteredEmployees = employees.filter((employee) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      employee.name.toLowerCase().includes(query) ||
      employee.role.toLowerCase().includes(query) ||
      employee.biometricNo?.includes(query)
    );
  });

  const assignedCount = employees.filter(
    (employee) => employee.biometricNo,
  ).length;

  const unassignedCount = employees.length - assignedCount;

  return (
    <View className="flex-1 bg-[#0B111A]">
      {/* Header */}
      <View className="px-5 pb-4 pt-6">
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
              transform: [
                {
                  scale: pressed ? 0.94 : 1,
                },
              ],
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

      {/* Summary */}
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

      {/* Search */}
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

      {/* Section Header */}
      <View className="flex-row items-center justify-between px-5 pb-3 pt-6">
        <Text className="font-outfit-semibold text-base text-white">
          Employees
        </Text>

        <Text className="font-inter-light text-[11px] text-slate-500">
          {filteredEmployees.length} records
        </Text>
      </View>

      {/* Employee List */}
      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.id}
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
                    transform: [
                      {
                        scale: pressed ? 0.95 : 1,
                      },
                    ],
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

      {/* Assign Biometric Modal */}
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
              disabled={!biometricNo.trim()}
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

      {/* Add Employee Modal */}
      <Modal
        visible={addVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddVisible(false)}>
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <Pressable
            onPress={() => setAddVisible(false)}
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
                onPress={() => setAddVisible(false)}
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

            {/* Full Name */}
            <View className="mt-6">
              <Text className="mb-2 font-outfit-medium text-xs text-slate-300">
                Full Name
              </Text>

              <View className="flex-row items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4">
                <FontAwesome6
                  name="user"
                  size={12}
                  color="#64748B"
                  iconStyle="solid"
                />

                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter full name"
                  placeholderTextColor="#475569"
                  autoCapitalize="words"
                  className="ml-3 flex-1 py-4 font-inter-light text-sm text-white"
                />
              </View>
            </View>

            {/* Role */}
            <View className="mt-4">
              <Text className="mb-2 font-outfit-medium text-xs text-slate-300">
                Role / Position
              </Text>

              <View className="flex-row items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4">
                <FontAwesome6
                  name="briefcase"
                  size={12}
                  color="#64748B"
                  iconStyle="solid"
                />

                <TextInput
                  value={newRole}
                  onChangeText={setNewRole}
                  placeholder="Enter role or position"
                  placeholderTextColor="#475569"
                  autoCapitalize="words"
                  className="ml-3 flex-1 py-4 font-inter-light text-sm text-white"
                />
              </View>
            </View>

            {/* Add Button */}
            <Pressable
              disabled={!newName.trim() || !newRole.trim()}
              onPress={handleAddEmployee}
              className={`mt-6 flex-row items-center justify-center rounded-2xl py-4 ${
                newName.trim() && newRole.trim()
                  ? "bg-sky-400"
                  : "bg-white/[0.06]"
              }`}>
              <FontAwesome6
                name="user-plus"
                size={14}
                color={newName.trim() && newRole.trim() ? "#0B111A" : "#475569"}
                iconStyle="solid"
              />

              <Text
                className={`ml-2 font-outfit-bold text-sm ${
                  newName.trim() && newRole.trim()
                    ? "text-[#0B111A]"
                    : "text-slate-600"
                }`}>
                Add Employee
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
