import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fgqvhvvoaoyebxtlnshb.supabase.co";
const supabaseAnonKey = "sb_publishable_J03KAjhkZguHRhB_-yxpCg_FY5NYSK4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
