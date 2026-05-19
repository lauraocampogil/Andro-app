import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";

export async function pickImageFromLibrary(): Promise<string | null> {
	const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (status !== "granted") return null;

	const result = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ImagePicker.MediaTypeOptions.Images,
		allowsEditing: true,
		aspect: [1, 1],
		quality: 0.8,
	});
	if (result.canceled) return null;
	return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
	const { status } = await ImagePicker.requestCameraPermissionsAsync();
	if (status !== "granted") return null;

	const result = await ImagePicker.launchCameraAsync({
		allowsEditing: true,
		aspect: [1, 1],
		quality: 0.8,
	});
	if (result.canceled) return null;
	return result.assets[0].uri;
}

export async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
	try {
		const response = await fetch(uri);
		const blob = await response.blob();
		const arrayBuffer = await new Response(blob).arrayBuffer();

		const fileExt = uri.split(".").pop()?.toLowerCase() ?? "jpg";
		const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

		const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, arrayBuffer, {
			contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
			upsert: true,
		});

		if (uploadError) {
			console.error("Avatar upload error:", uploadError);
			return null;
		}

		const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
		const publicUrl = data.publicUrl;

		const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);

		if (updateError) {
			console.error("Profile update error:", updateError);
			return null;
		}

		return publicUrl;
	} catch (err) {
		console.error("uploadAvatar error:", err);
		return null;
	}
}
