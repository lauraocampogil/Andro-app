import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

const ONBOARDING_KEY = "andro_onboarding_completed";

type AuthState = {
	session: Session | null;
	user: User | null;
	loading: boolean;
	initialized: boolean;
	onboardingCompleted: boolean;
	init: () => Promise<void>;
	signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
	signIn: (email: string, password: string) => Promise<{ error: string | null }>;
	signOut: () => Promise<void>;
	completeOnboarding: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
	session: null,
	user: null,
	loading: false,
	initialized: false,
	onboardingCompleted: false,

	init: async () => {
		const { data } = await supabase.auth.getSession();
		const flag = await AsyncStorage.getItem(ONBOARDING_KEY);
		set({
			session: data.session,
			user: data.session?.user ?? null,
			onboardingCompleted: flag === "true",
			initialized: true,
		});
		supabase.auth.onAuthStateChange((_event, session) => {
			set({ session, user: session?.user ?? null });
		});
	},

	signUp: async (email, password, displayName) => {
		set({ loading: true });
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { display_name: displayName } },
		});
		set({ loading: false });
		return { error: error?.message ?? null };
	},

	signIn: async (email, password) => {
		set({ loading: true });
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (!error) {
			await AsyncStorage.setItem(ONBOARDING_KEY, "true");
			set({ onboardingCompleted: true });
		}
		set({ loading: false });
		return { error: error?.message ?? null };
	},

	signOut: async () => {
		set({ loading: true });
		await supabase.auth.signOut();
		set({ loading: false, session: null, user: null });
	},

	completeOnboarding: async () => {
		await AsyncStorage.setItem(ONBOARDING_KEY, "true");
		set({ onboardingCompleted: true });
	},
}));
