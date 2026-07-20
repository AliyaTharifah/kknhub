import { create } from "zustand";
import { supabase, isSandboxMode } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  photo_url?: string;
  role: "Anggota" | "Sekretaris";
  created_at?: string;
}

interface AuthStore {
  user: UserProfile | null;
  isLoading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  initialized: false,

  login: async (email, password) => {
    set({ isLoading: true });

    if (isSandboxMode) {
      // Mock login for Sandbox Mode
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

      const role = email.toLowerCase().includes("sekretaris") ? "Sekretaris" : "Anggota";
      const mockProfile: UserProfile = {
        id: role === "Sekretaris" ? "mock-uuid-sekretaris" : "mock-uuid-anggota",
        email,
        full_name: role === "Sekretaris" ? "Aliya Salsabila" : "Fathur Rahman",
        phone: "+62 812-3456-7890",
        photo_url: role === "Sekretaris"
          ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
          : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
        role,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem("kkn_session_mock", JSON.stringify(mockProfile));
      if (typeof window !== "undefined") {
        document.cookie = "kkn_sandbox_logged_in=true; path=/; max-age=86400; SameSite=Lax";
      }
      set({ user: mockProfile, isLoading: false });
      return { success: true };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user object returned.");

      // Fetch profile details from public.users table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (typeof window !== "undefined") {
        document.cookie = "sb-authenticated=true; path=/; max-age=86400; SameSite=Lax";
      }

      set({ user: profile as UserProfile, isLoading: false });
      return { success: true };
    } catch (err) {
      const error = err as Error;
      set({ isLoading: false });
      return { success: false, error: error.message || "Email atau password salah." };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    if (isSandboxMode) {
      localStorage.removeItem("kkn_session_mock");
      if (typeof window !== "undefined") {
        document.cookie = "kkn_sandbox_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }
      set({ user: null, isLoading: false });
      return;
    }

    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      document.cookie = "sb-authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
    set({ user: null, isLoading: false });
  },

  updateProfile: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return { success: false, error: "Not logged in" };

    set({ isLoading: true });

    if (isSandboxMode) {
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem("kkn_session_mock", JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", currentUser.id);

      if (error) throw error;

      set({ user: { ...currentUser, ...updates }, isLoading: false });
      return { success: true };
    } catch (err) {
      const error = err as Error;
      set({ isLoading: false });
      return { success: false, error: error.message || "Gagal memperbarui profil." };
    }
  },

  initializeAuth: async () => {
    if (get().initialized) return;

    if (isSandboxMode) {
      const savedMock = localStorage.getItem("kkn_session_mock");
      if (savedMock) {
        set({ user: JSON.parse(savedMock), isLoading: false, initialized: true });
      } else {
        set({ user: null, isLoading: false, initialized: true });
      }
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!error && profile) {
          set({ user: profile as UserProfile });
          if (typeof window !== "undefined") {
            document.cookie = "sb-authenticated=true; path=/; max-age=86400; SameSite=Lax";
          }
        } else {
          // If profile fetch fails, fallback to metadata or logout
          if (typeof window !== "undefined") {
            document.cookie = "sb-authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
          }
          set({ user: null });
        }
      } else {
        set({ user: null });
      }
    } catch {
      set({ user: null });
    } finally {
      set({ isLoading: false, initialized: true });
    }
  },
}));
