import { Button } from "@/components/Button";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";
import { Level, useFiltersStore } from "@/lib/filtersStore";
import { useRouter } from "expo-router";
import { Check, ChevronDown, X } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONTINENTS = ["Africa", "Asia", "Australia", "Europe", "North America", "South America"];
const DISTANCES = [5, 10, 24, 42];
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];
const SURFACES = ["Asphalt", "Mud", "Other", "Terrain", "Sand", "Trail", "Snow", "Grass", "Mixed"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2025, 2026, 2027];

function Checkbox({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
	return (
		<Pressable style={styles.checkboxRow} onPress={onPress}>
			<View style={[styles.checkbox, checked && styles.checkboxChecked]}>{checked && <Check size={14} color={Colors.white} strokeWidth={3} />}</View>
			<Text style={styles.checkboxLabel}>{label}</Text>
		</Pressable>
	);
}

function Pill({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
	return (
		<Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
			<Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
		</Pressable>
	);
}

function Dropdown({ label, value, options, onSelect }: { label: string; value: string; options: string[]; onSelect: (v: string) => void }) {
	const [open, setOpen] = useState(false);
	return (
		<View style={{ position: "relative" }}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<Pressable style={styles.dropdown} onPress={() => setOpen(!open)}>
				<Text style={styles.dropdownText}>{value}</Text>
				<ChevronDown size={16} color={Colors.white} strokeWidth={2.4} />
			</Pressable>
			{open && (
				<View style={styles.dropdownMenu}>
					{options.map((opt) => (
						<Pressable
							key={opt}
							style={styles.dropdownItem}
							onPress={() => {
								onSelect(opt);
								setOpen(false);
							}}
						>
							<Text style={styles.dropdownItemText}>{opt}</Text>
						</Pressable>
					))}
				</View>
			)}
		</View>
	);
}

export default function FilterScreen() {
	const router = useRouter();
	const { filters: stored, setFilters, resetFilters } = useFiltersStore();

	const [year, setYear] = useState<number | undefined>(stored.year);
	const [monthIndex, setMonthIndex] = useState<number | undefined>(stored.month);
	const [continents, setContinents] = useState<string[]>(stored.continents);
	const [distances, setDistances] = useState<number[]>(stored.distances);
	const [levels, setLevels] = useState<Level[]>(stored.levels);
	const [surfaces, setSurfaces] = useState<string[]>(stored.surfaces);
	const [superHalf, setSuperHalf] = useState(stored.superHalf);
	const [majors, setMajors] = useState(stored.majors);
	const [favoritesOnly, setFavoritesOnly] = useState(stored.favoritesOnly);

	const toggle = <T,>(arr: T[], val: T, set: (v: T[]) => void) => {
		if (arr.includes(val)) set(arr.filter((x) => x !== val));
		else set([...arr, val]);
	};

	const handleApply = () => {
		setFilters({
			year,
			month: monthIndex,
			continents,
			distances,
			levels,
			surfaces,
			superHalf,
			majors,
			favoritesOnly,
		});
		router.back();
	};

	const handleReset = () => {
		resetFilters();
		setYear(undefined);
		setMonthIndex(undefined);
		setContinents([]);
		setDistances([]);
		setLevels([]);
		setSurfaces([]);
		setSuperHalf(false);
		setMajors(false);
		setFavoritesOnly(false);
		router.back();
	};

	return (
		<CosmicBackground>
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>FILTER</Text>
						<Pressable style={styles.closeBtn} onPress={() => router.back()}>
							<X size={22} color={Colors.ink} strokeWidth={2.6} />
						</Pressable>
					</View>

					{/* Year + Month */}
					<View style={styles.row2}>
						<View style={{ flex: 1 }}>
							<Dropdown label="Year" value={year ? String(year) : "Any"} options={["Any", ...YEARS.map(String)]} onSelect={(v) => setYear(v === "Any" ? undefined : Number(v))} />
						</View>
						<View style={{ flex: 1 }}>
							<Dropdown label="Month" value={monthIndex ? MONTHS[monthIndex - 1] : "Any"} options={["Any", ...MONTHS]} onSelect={(v) => setMonthIndex(v === "Any" ? undefined : MONTHS.indexOf(v) + 1)} />
						</View>
					</View>

					{/* Continent */}
					<Text style={styles.section}>Continent</Text>
					<View style={styles.checkGrid}>
						{CONTINENTS.map((c) => (
							<View key={c} style={styles.checkCol}>
								<Checkbox checked={continents.includes(c)} label={c} onPress={() => toggle(continents, c, setContinents)} />
							</View>
						))}
					</View>

					{/* Career type */}
					<Text style={styles.section}>Career type</Text>
					<View style={styles.pillRow}>
						{DISTANCES.map((d) => (
							<Pill key={d} active={distances.includes(d)} label={`${d}km`} onPress={() => toggle(distances, d, setDistances)} />
						))}
					</View>

					{/* Career level */}
					<Text style={styles.section}>Career level</Text>
					<View style={styles.pillRow}>
						{LEVELS.map((l) => (
							<Pill key={l} active={levels.includes(l)} label={l[0].toUpperCase() + l.slice(1)} onPress={() => toggle(levels, l, setLevels)} />
						))}
					</View>

					{/* Race Surface */}
					<Text style={styles.section}>Race Surface</Text>
					<View style={styles.checkGrid}>
						{SURFACES.map((s) => (
							<View key={s} style={styles.checkCol}>
								<Checkbox checked={surfaces.includes(s)} label={s} onPress={() => toggle(surfaces, s, setSurfaces)} />
							</View>
						))}
					</View>

					{/* Type Marathon */}
					<Text style={styles.section}>Type Marathon</Text>
					<View style={styles.pillRow}>
						<Pill active={superHalf} label="SuperHalf" onPress={() => setSuperHalf(!superHalf)} />
						<Pill active={majors} label="Majors" onPress={() => setMajors(!majors)} />
					</View>

					{/* Favorites */}
					<Text style={styles.section}>Favorites</Text>
					<View style={styles.pillRow}>
						<Pill active={favoritesOnly} label="Favorites only" onPress={() => setFavoritesOnly(!favoritesOnly)} />
					</View>

					{/* Actions */}
					<View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
						<Button label="Apply filters" onPress={handleApply} />
						<Pressable onPress={handleReset} style={styles.resetBtn}>
							<Text style={styles.resetText}>Reset all</Text>
						</Pressable>
					</View>
				</ScrollView>
			</SafeAreaView>
		</CosmicBackground>
	);
}

const styles = StyleSheet.create({
	scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 80 },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: Spacing.sm,
		marginBottom: Spacing.xl,
	},
	title: { fontFamily: Fonts.display, fontSize: FontSizes.h2, fontStyle: "italic", color: Colors.white, letterSpacing: 1 },
	closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
	row2: { flexDirection: "row", gap: Spacing.lg, marginBottom: Spacing.lg },
	fieldLabel: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white, marginBottom: Spacing.sm },
	dropdown: { height: 38, paddingHorizontal: 14, borderRadius: Radius.pill, backgroundColor: Colors.secundaire, flexDirection: "row", alignItems: "center", justifyContent: "space-between", alignSelf: "flex-start", minWidth: 110 },
	dropdownText: { fontFamily: Fonts.bodyBold, fontSize: 13, fontWeight: "700", color: Colors.white, marginRight: 8 },
	dropdownMenu: {
		position: "absolute",
		top: 70,
		left: 0,
		backgroundColor: Colors.hoofdkleur,
		borderWidth: 1,
		borderColor: Colors.white15,
		borderRadius: Radius.md,
		paddingVertical: 4,
		zIndex: 100,
		minWidth: 140,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 8,
		elevation: 8,
	},
	dropdownItem: { paddingHorizontal: 14, paddingVertical: 10 },
	dropdownItemText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.white },
	section: { fontFamily: Fonts.bodyBold, fontSize: 20, fontWeight: "800", color: Colors.white, marginTop: Spacing.lg, marginBottom: Spacing.md },
	checkGrid: { flexDirection: "row", flexWrap: "wrap" },
	checkCol: { width: "50%", marginBottom: 10 },
	checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.white, alignItems: "center", justifyContent: "center" },
	checkboxChecked: { backgroundColor: Colors.secundaire, borderColor: Colors.secundaire },
	checkboxLabel: { fontFamily: Fonts.body, fontSize: 15, color: Colors.white },
	pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	pill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.secundaire, backgroundColor: "transparent" },
	pillActive: { backgroundColor: Colors.secundaire },
	pillText: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white },
	pillTextActive: { color: Colors.white },
	resetBtn: { alignItems: "center", paddingVertical: 14 },
	resetText: { fontFamily: Fonts.bodyBold, fontSize: 14, fontWeight: "700", color: Colors.white70, textDecorationLine: "underline" },
});
