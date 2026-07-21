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
      const emailLower = email.toLowerCase();
      const isSekretaris =
        emailLower.includes("sekretaris") ||
        emailLower.includes("admin") ||
        emailLower.includes("kordes") ||
        emailLower.includes("ketua");

      const role: "Sekretaris" | "Anggota" = isSekretaris ? "Sekretaris" : "Anggota";

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

      if (typeof window !== "undefined") {
        localStorage.setItem("kkn_session_mock", JSON.stringify(mockProfile));
        document.cookie = "kkn_sandbox_logged_in=true; path=/; max-age=86400; SameSite=Lax";
        try {
          const registered = JSON.parse(localStorage.getItem("kkn_users_registered") || "[]");
          if (!registered.includes(mockProfile.id)) {
            registered.push(mockProfile.id);
            localStorage.setItem("kkn_users_registered", JSON.stringify(registered));
          }
        } catch {}
      }
      set({ user: mockProfile, isLoading: false, initialized: true });
      return { success: true };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Tidak dapat memperoleh data pengguna.");

      let userProfile: UserProfile;

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!profileError && profile) {
        userProfile = profile as UserProfile;
      } else {
        const metadata = authData.user.user_metadata || {};
        const emailLower = (authData.user.email || "").toLowerCase();
        const isSekretaris =
          metadata.role === "Sekretaris" ||
          emailLower.includes("sekretaris") ||
          emailLower.includes("admin") ||
          emailLower.includes("kordes") ||
          emailLower.includes("ketua");

        const role: "Sekretaris" | "Anggota" = isSekretaris ? "Sekretaris" : "Anggota";

        userProfile = {
          id: authData.user.id,
          email: authData.user.email || email,
          full_name: metadata.full_name || (role === "Sekretaris" ? "Aliya Salsabila (Sekretaris)" : "Anggota KKN"),
          role,
          phone: metadata.phone || "",
          photo_url: metadata.photo_url || (role === "Sekretaris" ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" : undefined),
          created_at: new Date().toISOString(),
        };

        try {
          await supabase.from("users").upsert(userProfile);
        } catch {}
      }

      if (typeof window !== "undefined") {
        document.cookie = "sb-authenticated=true; path=/; max-age=86400; SameSite=Lax";
      }

      set({ user: userProfile, isLoading: false, initialized: true });
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
      if (typeof window !== "undefined") {
        localStorage.removeItem("kkn_session_mock");
        document.cookie = "kkn_sandbox_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }
      set({ user: null, isLoading: false });
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch {}

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
      if (typeof window !== "undefined") {
        localStorage.setItem("kkn_session_mock", JSON.stringify(updatedUser));
      }
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
      if (typeof window !== "undefined") {
        const savedMock = localStorage.getItem("kkn_session_mock");
        if (savedMock) {
          try {
            const userObj = JSON.parse(savedMock);
            document.cookie = "kkn_sandbox_logged_in=true; path=/; max-age=86400; SameSite=Lax";
            set({ user: userObj, isLoading: false, initialized: true });
            return;
          } catch {}
        }
      }
      set({ user: null, isLoading: false, initialized: true });
      return;
    }

    try {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 3000)
      );

      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

      if (session?.user) {
        let userProfile: UserProfile;

        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!error && profile) {
          userProfile = profile as UserProfile;
        } else {
          const metadata = session.user.user_metadata || {};
          const emailLower = (session.user.email || "").toLowerCase();
          const isSekretaris =
            metadata.role === "Sekretaris" ||
            emailLower.includes("sekretaris") ||
            emailLower.includes("admin") ||
            emailLower.includes("kordes") ||
            emailLower.includes("ketua");

          const role: "Sekretaris" | "Anggota" = isSekretaris ? "Sekretaris" : "Anggota";

          userProfile = {
            id: session.user.id,
            email: session.user.email || "",
            full_name: metadata.full_name || (role === "Sekretaris" ? "Aliya Salsabila (Sekretaris)" : "Anggota KKN"),
            role,
            phone: metadata.phone || "",
            photo_url: metadata.photo_url || (role === "Sekretaris" ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" : undefined),
            created_at: new Date().toISOString(),
          };

          try {
            await supabase.from("users").upsert(userProfile);
          } catch {}
        }

        set({ user: userProfile });
        if (typeof window !== "undefined") {
          document.cookie = "sb-authenticated=true; path=/; max-age=86400; SameSite=Lax";
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
