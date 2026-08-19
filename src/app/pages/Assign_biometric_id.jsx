import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const INITIAL_EMPLOYEES = [
  {
    id: "1",
    name: "Juan Dela Cruz",
    role: "Administrative Officer",
  },
  {
    id: "2",
    name: "Maria Santos",
    role: "HR Officer",
  },
  {
    id: "3",
    name: "Pedro Reyes",
    role: "IT Officer",
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

  const openAssignDrawer = (employee) => {
    setSelectedEmployee(employee);
    setBiometricNo("");
    setDrawerVisible(true);
  };

  const handleAssign = () => {
    // UI only — wire up your actual assign logic here
    setDrawerVisible(false);
  };

  const handleAddEmployee = () => {
    if (!newName.trim() || !newRole.trim()) return;

    setEmployees((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newName.trim(), role: newRole.trim() },
    ]);

    setNewName("");
    setNewRole("");
    setAddVisible(false);
  };

  return (
    <View className="flex-1 bg-[#0F1620]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-5">
        <View className="flex-1 pr-3">
          <Text className="text-2xl font-bold text-white">
            Assign Biometric ID
          </Text>

          <Text className="mt-1 text-sm text-gray-400">
            Select an employee to assign a biometric number.
          </Text>
        </View>

        {/* Add Employee */}
        <TouchableOpacity
          onPress={() => setAddVisible(true)}
          activeOpacity={0.8}
          className="h-11 w-11 items-center justify-center rounded-xl bg-blue-500">
          <FontAwesome6
            name="user-plus"
            size={16}
            color="#FFFFFF"
            iconStyle="solid"
          />
        </TouchableOpacity>
      </View>

      {/* Employee List */}
      <FlatList
        data={employees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-white/5 bg-[#141B26] p-4">
            <View className="flex-row items-center">
              {/* Avatar */}
              <View className="h-11 w-11 items-center justify-center rounded-full bg-blue-500/15">
                <FontAwesome6
                  name="user"
                  size={18}
                  color="#3B82F6"
                  iconStyle="solid"
                />
              </View>

              {/* Employee */}
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-white">
                  {item.name}
                </Text>

                <Text className="mt-1 text-sm text-gray-400">{item.role}</Text>
              </View>

              {/* Assign */}
              <TouchableOpacity
                onPress={() => openAssignDrawer(item)}
                activeOpacity={0.8}
                className="h-11 w-11 items-center justify-center rounded-xl bg-blue-500">
                <FontAwesome6
                  name="fingerprint"
                  size={17}
                  color="#FFFFFF"
                  iconStyle="solid"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Assign Biometric Drawer */}
      <Modal
        visible={drawerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDrawerVisible(false)}>
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <Pressable
            onPress={() => setDrawerVisible(false)}
            className="absolute inset-0 bg-black/60"
          />

          {/* Drawer */}
          <View className="rounded-t-[30px] bg-[#141B26] px-5 pb-10 pt-3">
            {/* Handle */}
            <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-gray-600" />

            {/* Header */}
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-500/15">
                <FontAwesome6
                  name="fingerprint"
                  size={21}
                  color="#3B82F6"
                  iconStyle="solid"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-xl font-bold text-white">
                  Assign Biometric ID
                </Text>

                <Text className="mt-1 text-sm text-gray-400">
                  Enter the biometric number.
                </Text>
              </View>

              {/* Close */}
              <Pressable
                onPress={() => setDrawerVisible(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/5">
                <FontAwesome6
                  name="xmark"
                  size={16}
                  color="#9CA3AF"
                  iconStyle="solid"
                />
              </Pressable>
            </View>

            {/* Employee */}
            <View className="mt-6 rounded-2xl border border-white/5 bg-[#0F1620] p-4">
              <Text className="text-xs font-medium uppercase text-gray-500">
                Employee
              </Text>

              <View className="mt-2 flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
                  <FontAwesome6
                    name="user"
                    size={16}
                    color="#3B82F6"
                    iconStyle="solid"
                  />
                </View>

                <View className="ml-3">
                  <Text className="text-base font-semibold text-white">
                    {selectedEmployee?.name}
                  </Text>

                  <Text className="mt-1 text-sm text-gray-400">
                    {selectedEmployee?.role}
                  </Text>
                </View>
              </View>
            </View>

            {/* Biometric Number */}
            <View className="mt-5">
              <Text className="mb-2 text-sm font-medium text-gray-300">
                Biometric Number
              </Text>

              <TextInput
                value={biometricNo}
                onChangeText={setBiometricNo}
                placeholder="Enter biometric number"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                className="rounded-2xl border border-white/10 bg-[#0F1620] px-4 py-4 text-base text-white"
              />
            </View>

            {/* Assign */}
            <Pressable
              onPress={handleAssign}
              className="mt-6 flex-row items-center justify-center rounded-2xl bg-blue-500 py-4">
              <FontAwesome6
                name="fingerprint"
                size={17}
                color="#FFFFFF"
                iconStyle="solid"
              />

              <Text className="ml-2 text-base font-bold text-white">
                Assign Biometric ID
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Employee Drawer */}
      <Modal
        visible={addVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddVisible(false)}>
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <Pressable
            onPress={() => setAddVisible(false)}
            className="absolute inset-0 bg-black/60"
          />

          {/* Drawer */}
          <View className="rounded-t-[30px] bg-[#141B26] px-5 pb-10 pt-3">
            {/* Handle */}
            <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-gray-600" />

            {/* Header */}
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-500/15">
                <FontAwesome6
                  name="user-plus"
                  size={19}
                  color="#3B82F6"
                  iconStyle="solid"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-xl font-bold text-white">
                  Add Employee
                </Text>

                <Text className="mt-1 text-sm text-gray-400">
                  Enter the employee's details.
                </Text>
              </View>

              {/* Close */}
              <Pressable
                onPress={() => setAddVisible(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/5">
                <FontAwesome6
                  name="xmark"
                  size={16}
                  color="#9CA3AF"
                  iconStyle="solid"
                />
              </Pressable>
            </View>

            {/* Name */}
            <View className="mt-6">
              <Text className="mb-2 text-sm font-medium text-gray-300">
                Full Name
              </Text>

              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter full name"
                placeholderTextColor="#6B7280"
                className="rounded-2xl border border-white/10 bg-[#0F1620] px-4 py-4 text-base text-white"
              />
            </View>

            {/* Role */}
            <View className="mt-4">
              <Text className="mb-2 text-sm font-medium text-gray-300">
                Role / Position
              </Text>

              <TextInput
                value={newRole}
                onChangeText={setNewRole}
                placeholder="Enter role or position"
                placeholderTextColor="#6B7280"
                className="rounded-2xl border border-white/10 bg-[#0F1620] px-4 py-4 text-base text-white"
              />
            </View>

            {/* Add */}
            <Pressable
              onPress={handleAddEmployee}
              className="mt-6 flex-row items-center justify-center rounded-2xl bg-blue-500 py-4">
              <FontAwesome6
                name="user-plus"
                size={17}
                color="#FFFFFF"
                iconStyle="solid"
              />

              <Text className="ml-2 text-base font-bold text-white">
                Add Employee
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
