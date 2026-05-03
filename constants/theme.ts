export const Colors = {
	// Backgrounds
	deepNight: "#04081A",
	hoofdkleur: "#0A2353",
	primaireVive: "#112C71",
	cosmicEdge: "#1A3B9C",

	// Accents
	secundaire: "#5B58EB",
	violetLight: "#8A87FF",
	accentRose: "#F7D2F4",
	legendary: "#FFD15C",

	// System
	liveRed: "#FF5757",

	// Neutrals
	white: "#FFFFFF",
	white90: "rgba(255,255,255,0.9)",
	white70: "rgba(255,255,255,0.7)",
	white50: "rgba(255,255,255,0.5)",
	white30: "rgba(255,255,255,0.3)",
	white15: "rgba(255,255,255,0.15)",
	white08: "rgba(255,255,255,0.08)",

	// Ink
	ink: "#0A0F2C",
	ink70: "rgba(10,15,44,0.7)",
	ink50: "rgba(10,15,44,0.5)",
	ink08: "rgba(10,15,44,0.08)",
} as const;

export const Fonts = {
	display: "Tanker",
	body: "Fustat",
	bodyBold: "Fustat-Bold",
	bodySemi: "Fustat-SemiBold",
} as const;

export const FontSizes = {
	hero: 78,
	h1: 36,
	h2: 28,
	h3: 22,
	h4: 18,
	body: 14,
	small: 12,
	micro: 10,
} as const;

export const Spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	base: 16,
	lg: 24,
	xl: 32,
	xxl: 48,
} as const;

export const Radius = {
	sm: 8,
	md: 14,
	lg: 18,
	xl: 24,
	pill: 28,
	round: 999,
} as const;
