export type ClassIconSpec = {
	fill: string;
	badgeGlyph: string;
};

export const CLASS_ICON_MAP: Record<string, ClassIconSpec> = {
	English: { fill: "#60a5fa", badgeGlyph: "A" },
	Calculus: { fill: "#a78bfa", badgeGlyph: "∫" },
	History: { fill: "#fb7185", badgeGlyph: "H" },
	Biology: { fill: "#34d399", badgeGlyph: "B" },
	Chemistry: { fill: "#f59e0b", badgeGlyph: "C" },
	Physics: { fill: "#6366f1", badgeGlyph: "P" }, // or "Φ"
	Psychology: { fill: "#14b8a6", badgeGlyph: "PS" }, // "Ψ" at 48 only if you want
	"Computer Science": { fill: "#9ca3af", badgeGlyph: "CS" }, // "{ }" is hard at 24
};