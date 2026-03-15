"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const USER_ID_KEY = "cortex:userId";

function requireUserId(router: ReturnType<typeof useRouter>) {
	const userId = localStorage.getItem(USER_ID_KEY);
	if (!userId) {
		router.push("/login");
		throw new Error("Missing local user id");
	}
	return userId;
}

type Step = "education" | "classes";
type EducationLevel = "highSchool" | "college";
type GradeLevel = 9 | 10 | 11 | 12;

type ClassCatalog = Record<string, string[]>;

type OnboardingPayload =
	| {
			educationLevel: "highSchool";
			grade: GradeLevel;
			highSchoolName?: string;
			classes: string[];
			savedAt: string;
	  }
	| {
			educationLevel: "college";
			collegeName: string;
			major?: string;
			classes: string[];
			savedAt: string;
	  };

const CLASSES_BY_GRADE: Record<GradeLevel, ClassCatalog> = {
	9: {
		Core: [
			"English 9",
			"Honors English 9",
			"Algebra I",
			"Geometry",
			"Biology",
			"Earth Science",
			"World History",
			"Geography",
			"Physical Education",
			"Health",
		],
		"World languages": [
			"Spanish I",
			"Spanish II",
			"French I",
			"French II",
			"German I",
			"Chinese I",
			"Latin I",
		],
		Arts: ["Art I", "Drawing", "Painting", "Ceramics", "Graphic Design", "Photography"],
		"Music & performance": ["Band", "Orchestra", "Choir", "Theater"],
		"Speech & writing": ["Debate", "Journalism", "Creative Writing"],
		"STEM electives": ["Computer Science Explorations", "Intro to Programming", "Robotics", "Engineering Design"],
		Business: ["Business / Entrepreneurship", "Personal Finance"],
	},
	10: {
		Core: [
			"English 10",
			"Honors English 10",
			"Geometry",
			"Algebra II",
			"Chemistry",
			"Biology",
			"U.S. History",
			"World History",
			"Physical Education",
			"Health",
		],
		"World languages": ["Spanish II", "Spanish III", "French II", "French III", "German II", "Chinese II", "Latin II"],
		Arts: ["Art II", "Graphic Design", "Photography"],
		"Music & performance": ["Band", "Orchestra", "Choir", "Theater"],
		"Speech & writing": ["Debate", "Journalism", "Yearbook", "Speech"],
		"STEM electives": ["Computer Science Principles", "Intro to Web Development", "Robotics", "Engineering Design"],
		Business: ["Marketing", "Accounting"],
		AP: ["AP World History", "AP Computer Science Principles"],
	},
	11: {
		Core: [
			"English 11",
			"Honors English 11",
			"Algebra II",
			"Precalculus",
			"Statistics",
			"Physics",
			"Chemistry",
			"U.S. Government",
			"Economics",
		],
		"World languages": ["Spanish III", "Spanish IV", "French III", "French IV", "German III", "Chinese III", "Latin III"],
		"STEM electives": [
			"Computer Science A",
			"Data Science",
			"Cybersecurity",
			"Engineering",
			"Anatomy & Physiology",
			"Environmental Science",
			"Forensics",
		],
		Humanities: ["Psychology", "Sociology", "Philosophy"],
		Arts: ["Art III", "AP Studio Art"],
		"Music & performance": ["Band", "Orchestra", "Choir", "Theater"],
		"Speech & writing": ["Debate", "Journalism"],
		AP: [
			"AP U.S. History",
			"AP Language & Composition",
			"AP Calculus AB",
			"AP Statistics",
			"AP Biology",
			"AP Chemistry",
			"AP Physics 1",
			"AP Computer Science A",
			"AP Psychology",
			"AP Environmental Science",
		],
	},
	12: {
		Core: [
			"English 12",
			"Honors English 12",
			"AP Literature & Composition",
			"Precalculus",
			"Calculus",
			"Statistics",
			"Physics",
			"Government",
			"Economics",
		],
		"World languages": [
			"Spanish IV",
			"Spanish V",
			"AP Spanish Language",
			"French IV",
			"AP French Language",
			"German IV",
			"Chinese IV",
			"Latin IV",
		],
		"STEM electives": [
			"Computer Science A",
			"AP Computer Science A",
			"Data Science",
			"Web Development",
			"Mobile App Development",
			"Robotics",
			"Engineering Capstone",
			"Anatomy & Physiology",
			"Environmental Science",
		],
		Humanities: ["Psychology", "Sociology"],
		Business: ["Business Law", "Entrepreneurship", "Personal Finance"],
		Arts: ["Art IV", "AP Studio Art", "Yearbook", "Independent Study"],
		"Music & performance": ["Band", "Orchestra", "Choir", "Theater"],
		AP: [
			"AP Calculus AB",
			"AP Calculus BC",
			"AP Statistics",
			"AP U.S. Government",
			"AP Macroeconomics",
			"AP Microeconomics",
			"AP Biology",
			"AP Chemistry",
			"AP Physics 1",
			"AP Physics C",
			"AP Environmental Science",
			"AP Psychology",
		],
	},
};

export default function OnboardingPage() {
	const router = useRouter();

	const [step, setStep] = useState<Step>("education");
	const [educationLevel, setEducationLevel] = useState<EducationLevel>("highSchool");

	// HS fields
	const [grade, setGrade] = useState<GradeLevel | null>(null);
	const [highSchoolName, setHighSchoolName] = useState("");

	// College fields
	const [collegeName, setCollegeName] = useState("");
	const [major, setMajor] = useState("");
	const [collegeQuery, setCollegeQuery] = useState("");
	const [collegeSuggestions, setCollegeSuggestions] = useState<Array<{ id: string; label: string; name: string }>>([]);
	const [collegeLoading, setCollegeLoading] = useState(false);
	const [majorQuery, setMajorQuery] = useState("");
	const [majorSuggestions, setMajorSuggestions] = useState<string[]>([]);

	// Classes
	const [classes, setClasses] = useState<string[]>([]);
	const [classInput, setClassInput] = useState("");
	const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (educationLevel !== "college") {
				setCollegeSuggestions([]);
				setCollegeLoading(false);
				return;
			}

			const q = collegeQuery.trim();
			if (q.length < 2) {
				setCollegeSuggestions([]);
				setCollegeLoading(false);
				return;
			}

			setCollegeLoading(true);
			try {
				const res = await fetch(`/api/colleges?q=${encodeURIComponent(q)}`);
				const json = await res.json();
				if (cancelled) return;
				const results = Array.isArray(json?.results) ? json.results : [];
				setCollegeSuggestions(results);
			} catch {
				if (cancelled) return;
				setCollegeSuggestions([]);
			} finally {
				if (cancelled) return;
				setCollegeLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [collegeQuery, educationLevel]);

	const COMMON_MAJORS = useMemo(
		() => [
			"Computer Science",
			"Data Science",
			"Software Engineering",
			"Electrical Engineering",
			"Mechanical Engineering",
			"Civil Engineering",
			"Chemical Engineering",
			"Biomedical Engineering",
			"Industrial Engineering",
			"Mathematics",
			"Statistics",
			"Physics",
			"Chemistry",
			"Biology",
			"Neuroscience",
			"Psychology",
			"Economics",
			"Finance",
			"Accounting",
			"Business Administration",
			"Marketing",
			"Political Science",
			"International Relations",
			"History",
			"English",
			"Communications",
			"Journalism",
			"Philosophy",
			"Sociology",
			"Public Health",
			"Nursing",
			"Pre-Med",
			"Education",
			"Architecture",
			"Graphic Design",
			"Art",
			"Music",
			"Theater",
		],
		[],
	);

	useEffect(() => {
		if (educationLevel !== "college") {
			setMajorSuggestions([]);
			return;
		}

		const q = majorQuery.trim().toLowerCase();
		if (q.length < 2) {
			setMajorSuggestions([]);
			return;
		}

		const matches = COMMON_MAJORS.filter((m) => m.toLowerCase().includes(q) && m !== major)
			.slice(0, 6);
		setMajorSuggestions(matches);
	}, [COMMON_MAJORS, educationLevel, major, majorQuery]);

	const theme = useMemo(
		() => ({
			bg: "#070a0a",
			panel: "rgba(255,255,255,0.06)",
			border: "rgba(255,255,255,0.12)",
			text: "#ecfeff",
			muted: "rgba(236,254,255,0.72)",
			accent: "#16a34a",
			shadow: "rgba(0,0,0,0.65)",
		}),
		[],
	);

	const styles = useMemo(() => {
		const stage: React.CSSProperties = {
			minHeight: "100vh",
			display: "grid",
			placeItems: "center",
			padding: "28px 18px",
			backgroundColor: theme.bg,
			color: theme.text,
			fontFamily:
				"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
		};

		const shell: React.CSSProperties = {
			width: "min(680px, 100%)",
			borderRadius: 20,
			border: `1px solid ${theme.border}`,
			background: theme.panel,
			boxShadow: `0 34px 90px ${theme.shadow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
			padding: 18,
		};

		const header: React.CSSProperties = {
			display: "flex",
			flexDirection: "column",
			gap: 6,
			padding: "6px 6px 12px",
		};

		const title: React.CSSProperties = {
			fontSize: 22,
			fontWeight: 800,
			letterSpacing: 0.2,
		};

		const subtitle: React.CSSProperties = {
			fontSize: 13,
			color: theme.muted,
			lineHeight: 1.4,
		};

		const body: React.CSSProperties = {
			display: "flex",
			flexDirection: "column",
			gap: 12,
			padding: 6,
		};

		const label: React.CSSProperties = {
			fontSize: 12,
			color: theme.muted,
			marginBottom: 6,
		};

		const input: React.CSSProperties = {
			width: "100%",
			borderRadius: 14,
			border: `1px solid ${theme.border}`,
			background: "rgba(0,0,0,0.20)",
			color: theme.text,
			padding: "12px 12px",
			outline: "none",
			fontSize: 14,
		};

		const select: React.CSSProperties = {
			...input,
			appearance: "none",
		};

		const row: React.CSSProperties = {
			display: "flex",
			gap: 10,
			alignItems: "center",
		};

		const suggestionList: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 14,
			background: "rgba(0,0,0,0.22)",
			overflow: "hidden",
			maxHeight: 180,
			overflowY: "auto",
		};

		const suggestionItem: React.CSSProperties = {
			width: "100%",
			textAlign: "left",
			border: "none",
			borderBottom: `1px solid ${theme.border}`,
			background: "transparent",
			color: theme.text,
			padding: "8px 10px",
			cursor: "pointer",
			fontSize: 12,
			lineHeight: 1.3,
		};

		const hint: React.CSSProperties = {
			fontSize: 12,
			color: theme.muted,
			lineHeight: 1.35,
		};

		const hintTight: React.CSSProperties = {
			fontSize: 11,
			color: theme.muted,
			lineHeight: 1.25,
		};

		const btn: React.CSSProperties = {
			width: "100%",
			marginTop: 4,
			border: `1px solid ${theme.border}`,
			cursor: "pointer",
			padding: "12px 14px",
			borderRadius: 14,
			background: theme.accent,
			color: "#07110d",
			fontWeight: 800,
			fontSize: 13,
		};

		const btnSecondary: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			cursor: "pointer",
			padding: "10px 12px",
			borderRadius: 14,
			background: "transparent",
			color: theme.text,
			fontWeight: 700,
			fontSize: 13,
			whiteSpace: "nowrap",
		};

		const chipRow: React.CSSProperties = {
			display: "flex",
			flexWrap: "wrap",
			gap: 8,
		};

		const chip: React.CSSProperties = {
			display: "inline-flex",
			alignItems: "center",
			gap: 8,
			border: `1px solid ${theme.border}`,
			borderRadius: 999,
			padding: "8px 10px",
			background: "rgba(0,0,0,0.18)",
			color: theme.text,
			fontSize: 13,
		};

		const chipX: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 999,
			width: 22,
			height: 22,
			display: "grid",
			placeItems: "center",
			background: "transparent",
			color: theme.text,
			cursor: "pointer",
			lineHeight: 1,
		};

		const suggestionWrap: React.CSSProperties = {
			display: "flex",
			flexWrap: "wrap",
			gap: 8,
		};

		const suggestion: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 999,
			padding: "8px 10px",
			background: "transparent",
			color: theme.muted,
			cursor: "pointer",
			fontSize: 13,
		};

		const categoryGroup: React.CSSProperties = {
			display: "flex",
			flexDirection: "column",
			gap: 8,
		};

		const categoryHeader: React.CSSProperties = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: 10,
		};

		const categoryTitle: React.CSSProperties = {
			fontSize: 12,
			color: theme.muted,
			letterSpacing: 0.2,
			fontWeight: 700,
		};

		const caret: React.CSSProperties = {
			width: 24,
			height: 24,
			borderRadius: 999,
			border: `1px solid ${theme.border}`,
			background: "transparent",
			color: theme.text,
			cursor: "pointer",
			lineHeight: 1,
			display: "grid",
			placeItems: "center",
		};

		const segmented: React.CSSProperties = {
			display: "grid",
			gridTemplateColumns: "1fr 1fr",
			gap: 8,
			border: `1px solid ${theme.border}`,
			borderRadius: 14,
			padding: 4,
			background: "rgba(0,0,0,0.18)",
		};

		const segment: React.CSSProperties = {
			border: `1px solid ${theme.border}`,
			borderRadius: 12,
			padding: "10px 12px",
			background: "transparent",
			color: theme.text,
			cursor: "pointer",
			fontWeight: 800,
			fontSize: 13,
		};

		const foot: React.CSSProperties = {
			padding: "12px 6px 4px",
			fontSize: 12,
			color: theme.muted,
			display: "flex",
			justifyContent: "space-between",
			gap: 12,
			flexWrap: "wrap",
		};

		const link: React.CSSProperties = {
			color: theme.text,
			textDecoration: "none",
			borderBottom: `1px solid ${theme.border}`,
			paddingBottom: 1,
		};

		return {
			stage,
			shell,
			header,
			title,
			subtitle,
			body,
			label,
			input,
			select,
			row,
			suggestionList,
			suggestionItem,
			hint,
			hintTight,
			btn,
			btnSecondary,
			chipRow,
			chip,
			chipX,
			suggestionWrap,
			suggestion,
			categoryGroup,
			categoryHeader,
			categoryTitle,
			caret,
			segmented,
			segment,
			foot,
			link,
		};
	}, [theme]);

	const educationNextDisabled =
		educationLevel === "highSchool" ? grade === null : collegeName.trim().length < 2;
	const educationNextStyle: React.CSSProperties = Object.assign({}, styles.btn, {
		opacity: educationNextDisabled ? 0.55 : 1,
	});

	const classesDisabled = classes.length === 0;
	const classesNextStyle: React.CSSProperties = Object.assign({}, styles.btn, {
		opacity: classesDisabled ? 0.55 : 1,
	});

	const suggestionGroups = useMemo(() => {
		if (educationLevel !== "highSchool" || !grade) return [] as Array<{ category: string; items: string[] }>;
		const catalog = CLASSES_BY_GRADE[grade];
		return Object.entries(catalog)
			.map(([category, items]) => ({ category, items: items.filter((c) => !classes.includes(c)) }))
			.filter((g) => g.items.length > 0);
	}, [classes, educationLevel, grade]);

	const isCategoryOpen = (category: string) => openCategories[category] ?? true;
	const toggleCategory = (category: string) => {
		setOpenCategories((prev) => ({ ...prev, [category]: !(prev[category] ?? true) }));
	};

	const addClass = (nameRaw: string) => {
		const name = nameRaw.trim();
		if (!name) return;
		if (classes.includes(name)) return;
		setClasses((prev) => [...prev, name]);
		setClassInput("");
	};

	const removeClass = (name: string) => {
		setClasses((prev) => prev.filter((c) => c !== name));
	};

	const saveAndGoDashboard = () => {
		const userId = requireUserId(router);

		let payload: OnboardingPayload;
		if (educationLevel === "highSchool") {
			if (!grade) return;
			payload = {
				educationLevel: "highSchool",
				grade,
				highSchoolName: highSchoolName.trim() ? highSchoolName.trim() : undefined,
				classes,
				savedAt: new Date().toISOString(),
			};
		} else {
			payload = {
				educationLevel: "college",
				collegeName: collegeName.trim(),
				major: major.trim() ? major.trim() : undefined,
				classes,
				savedAt: new Date().toISOString(),
			};
		}

		localStorage.setItem(`cortex:users:${userId}:onboarding:v1`, JSON.stringify(payload));
		router.push("/dashboard");
	};

	return (
		<main style={styles.stage}>
			<section style={styles.shell} aria-label="Onboarding">
				{step === "education" && (
					<>
						<header style={styles.header}>
							<div style={styles.title}>Tell us about school</div>
							<div style={styles.subtitle}>We use this to personalize class suggestions and tone.</div>
						</header>

						<div style={styles.body}>
							<div>
								<div style={styles.label}>School level</div>
								<div style={styles.segmented}>
									<button
										type="button"
										style={Object.assign({}, styles.segment, {
											background: educationLevel === "highSchool" ? "rgba(0,0,0,0.30)" : "transparent",
										})}
										onClick={() => setEducationLevel("highSchool")}
									>
										High school
									</button>
									<button
										type="button"
										style={Object.assign({}, styles.segment, {
											background: educationLevel === "college" ? "rgba(0,0,0,0.30)" : "transparent",
										})}
										onClick={() => setEducationLevel("college")}
									>
										College
									</button>
								</div>
							</div>

							{educationLevel === "highSchool" ? (
								<>
									<div>
										<div style={styles.label}>Grade level</div>
										<select
											style={styles.select}
											value={grade ?? ""}
											onChange={(e) => {
												const v = Number(e.target.value);
												if (v === 9 || v === 10 || v === 11 || v === 12) setGrade(v);
											}}
											required
										>
											<option value="" disabled>
												Select…
											</option>
											<option value="9">9</option>
											<option value="10">10</option>
											<option value="11">11</option>
											<option value="12">12</option>
										</select>
									</div>

									<div>
										<div style={styles.label}>High school (optional)</div>
										<input
											style={styles.input}
											value={highSchoolName}
											onChange={(e) => setHighSchoolName(e.target.value)}
											placeholder="e.g. Westview High"
										/>
									</div>
								</>
							) : (
								<>
									<div>
										<div style={styles.label}>College / University</div>
										<input
											style={styles.input}
											value={collegeName}
											onChange={(e) => {
												setCollegeName(e.target.value);
												setCollegeQuery(e.target.value);
											}}
											placeholder="Start typing your school…"
											required
										/>

										<div style={styles.hint}>
											{collegeLoading ? "Searching schools…" : "Pick a match from the list, or keep typing."}
										</div>

										{collegeSuggestions.length > 0 ? (
											<div style={styles.suggestionList}>
												{collegeSuggestions.slice(0, 6).map((s) => (
													<button
														key={s.id}
														type="button"
														style={styles.suggestionItem}
														onClick={() => {
															setCollegeName(s.label);
															setCollegeQuery(s.label);
															setCollegeSuggestions([]);
														}}
													>
														{s.label}
													</button>
												))}
											</div>
										) : null}
									</div>

									<div>
										<div style={styles.label}>Major (optional)</div>
										<input
											style={styles.input}
											value={major}
											onChange={(e) => {
												setMajor(e.target.value);
												setMajorQuery(e.target.value);
											}}
											placeholder="Start typing your major…"
										/>

										<div style={styles.hintTight}>
											Pick a match from the list, or keep typing.
										</div>

										{majorSuggestions.length > 0 ? (
											<div style={styles.suggestionList}>
												{majorSuggestions.map((m) => (
													<button
														key={m}
														type="button"
														style={styles.suggestionItem}
														onClick={() => {
															setMajor(m);
															setMajorQuery(m);
															setMajorSuggestions([]);
														}}
													>
														{m}
													</button>
												))}
											</div>
										) : null}
									</div>
								</>
							)}

							<button
								type="button"
								style={educationNextStyle}
								disabled={educationNextDisabled}
								onClick={() => {
									setClasses([]);
									setClassInput("");
									setStep("classes");
								}}
							>
								Next
							</button>

							<div style={styles.foot}>
								<Link href="/login" prefetch style={styles.link}>
									Back to login
								</Link>
								<Link href="/" prefetch style={styles.link}>
									Back to home
								</Link>
							</div>
						</div>
					</>
				)}

				{step === "classes" && (
					<>
						<header style={styles.header}>
							<div style={styles.title}>What classes are you taking?</div>
							<div style={styles.subtitle}>
								Add all your classes. Suggestions are available for high school by grade.
							</div>
						</header>

						<div style={styles.body}>
							<div>
								<div style={styles.label}>Your classes</div>
								<div style={styles.chipRow}>
									{classes.map((c) => (
										<span key={c} style={styles.chip}>
											{c}
											<button type="button" style={styles.chipX} onClick={() => removeClass(c)} aria-label={`Remove ${c}`}>
												×
											</button>
										</span>
									))}
								</div>
							</div>

							<div>
								<div style={styles.label}>Add a class</div>
								<div style={styles.row}>
									<input
										style={styles.input}
										value={classInput}
										onChange={(e) => setClassInput(e.target.value)}
										placeholder={educationLevel === "college" ? "e.g. CS 182" : "e.g. AP Biology"}
										aria-label="Class name"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addClass(classInput);
											}
										}}
									/>
									<button type="button" style={styles.btnSecondary} onClick={() => addClass(classInput)}>
										Add
									</button>
								</div>
							</div>

							{educationLevel === "highSchool" && suggestionGroups.length > 0 ? (
								<div>
									<div style={styles.label}>Suggestions</div>
									{suggestionGroups.map((g) => (
										<div key={g.category} style={styles.categoryGroup}>
											<div style={styles.categoryHeader}>
												<div style={styles.categoryTitle}>{g.category}</div>
												<button type="button" style={styles.caret} onClick={() => toggleCategory(g.category)} aria-label={`Toggle ${g.category}`}>
													{isCategoryOpen(g.category) ? "−" : "+"}
												</button>
											</div>

											{isCategoryOpen(g.category) && (
												<div style={styles.suggestionWrap}>
													{g.items.slice(0, 12).map((s) => (
														<button key={`${g.category}-${s}`} type="button" style={styles.suggestion} onClick={() => addClass(s)}>
															{s}
														</button>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							) : null}

							<button type="button" style={classesNextStyle} disabled={classesDisabled} onClick={saveAndGoDashboard}>
								Next
							</button>

							<button type="button" style={styles.btnSecondary} onClick={() => setStep("education")}>
								Back
							</button>

							<div style={styles.foot}>
								<Link href="/login" prefetch style={styles.link}>
									Back to login
								</Link>
								<Link href="/" prefetch style={styles.link}>
									Back to home
								</Link>
							</div>
						</div>
					</>
				)}
			</section>
		</main>
	);
}