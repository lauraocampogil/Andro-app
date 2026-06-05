import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

const ONBOARDING_KEY = "andro_onboarding_completed";

function friendlyAuthError(message: string | undefined): string {
	if (!message) return "Something went wrong. Please try again.";
	const m = message.toLowerCase();
	if (m.includes("invalid login")) return "Email or password is incorrect.";
	if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
	if (m.includes("user already registered") || m.includes("already been registered")) return "An account with this email already exists.";
	if (m.includes("password")) return "Password must be at least 6 characters.";
	if (m.includes("network") || m.includes("fetch")) return "No connection. Check your internet and try again.";
	return message;
}

type AuthState = {
	session: Session | null;
	user: User | null;
	loading: boolean;
	initialized: boolean;
	onboardingCompleted: boolean;
	init: () => Promise<void>;
	signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
	signIn: (email: string, password: string) => Promise<{ error: string | null }>;
	resetPassword: (email: string) => Promise<{ error: string | null }>;
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
		return { error: error ? friendlyAuthError(error.message) : null };
	},

	signIn: async (email, password) => {
		set({ loading: true });
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (!error) {
			await AsyncStorage.setItem(ONBOARDING_KEY, "true");
			set({ onboardingCompleted: true });
		}
		set({ loading: false });
		return { error: error ? friendlyAuthError(error.message) : null };
	},

	resetPassword: async (email) => {
		set({ loading: true });
		const { error } = await supabase.auth.resetPasswordForEmail(email);
		set({ loading: false });
		return { error: error ? friendlyAuthError(error.message) : null };
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
