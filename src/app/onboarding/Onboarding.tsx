"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import SchoolForm from "./SchoolForm";
import ClassesForm from "./ClassesForm";
import { createOnboardingStyles } from "./styles";

import { CLASSES_BY_GRADE, COLLEGE_SUBJECTS, COMMON_MAJORS } from "@/features/onboarding/constants";
import { formatCollegeCourse, parseCollegeCourse } from "@/features/onboarding/collegeCourse";
import { supabase } from "@/lib/supabaseClient";
import type {
	CollegeSuggestion,
	EducationLevel,
	GradeLevel,
	OnboardingPayload,
	Step,
} from "@/features/onboarding/types";

const USER_ID_KEY = "cortex:userId";

function getUserId(): string | null {
	try {
		return localStorage.getItem(USER_ID_KEY);
	} catch {
		return null;
	}
}

async function loadOnboarding(userId: string): Promise<OnboardingPayload | null> {
	const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
	if (!data) return null;
	return {
		educationLevel: data.education_level ?? "highSchool",
		grade: data.grade ?? undefined,
		highSchoolName: undefined,
		collegeName: data.college_name ?? "",
		major: data.major ?? undefined,
		classes: data.classes ?? [],
		savedAt: new Date().toISOString(),
	} as OnboardingPayload;
}

async function saveOnboarding(userId: string, payload: OnboardingPayload) {
	await supabase.from("profiles").upsert({
		id: userId,
		education_level: payload.educationLevel,
		grade: payload.educationLevel === "highSchool" ? payload.grade ?? null : null,
		college_name: payload.educationLevel === "college" ? payload.collegeName ?? null : null,
		major: payload.educationLevel === "college" ? payload.major ?? null : null,
		classes: payload.classes ?? [],
	});
}

export default function Onboarding() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const stepParam = searchParams.get("step"); // "classes"

	// Core state
	const [step, setStep] = useState<Step>("education");
	const [payload, setPayload] = useState<OnboardingPayload | null>(null);

	const [educationLevel, setEducationLevel] = useState<EducationLevel>("highSchool");

	// HS
	const [grade, setGrade] = useState<GradeLevel | null>(null);
	const [highSchoolName, setHighSchoolName] = useState("");

	// College
	const [collegeName, setCollegeName] = useState("");
	const [major, setMajor] = useState("");
	const [collegeQuery, setCollegeQuery] = useState("");

	// Suggestions state
	const [collegeSuggestions, setCollegeSuggestions] = useState<CollegeSuggestion[]>([]);
	const [collegeLoading, setCollegeLoading] = useState(false);

	const [majorQuery, setMajorQuery] = useState("");
	const [majorSuggestions, setMajorSuggestions] = useState<string[]>([]);

	// Classes
	const [classes, setClasses] = useState<string[]>([]);
	const [classInput, setClassInput] = useState("");

	// College course entry
	const [courseSubject, setCourseSubject] = useState("CS");
	const [courseNumber, setCourseNumber] = useState("");
	const [courseTitle, setCourseTitle] = useState("");
	const [courseQuickInput, setCourseQuickInput] = useState("");

	const [courseSubjectQuery, setCourseSubjectQuery] = useState("CS");
	const [courseSubjectSuggestions, setCourseSubjectSuggestions] = useState<string[]>([]);

	// HS suggestion UI
	const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

	// Theme + styles
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

	const styles = useMemo(() => createOnboardingStyles(theme), [theme]);

	// Load saved onboarding (remember data)
	useEffect(() => {
		const userId = getUserId();
		if (!userId) {
			router.push("/login");
			return;
		}

		loadOnboarding(userId).then((saved) => {
			if (!saved) return;
			setPayload(saved);
			setEducationLevel(saved.educationLevel);
			setClasses(saved.classes ?? []);
			if (saved.educationLevel === "highSchool") {
				setGrade(saved.grade);
				setHighSchoolName(saved.highSchoolName ?? "");
			} else {
				setCollegeName(saved.collegeName);
				setCollegeQuery(saved.collegeName);
				setMajor(saved.major ?? "");
				setMajorQuery(saved.major ?? "");
			}
		});
	}, [router]);

	// Jump directly to classes on /onboarding?step=classes
	useEffect(() => {
		if (stepParam === "classes" && payload) {
			setStep("classes");
		}
	}, [stepParam, payload]);

	// College suggestions fetch
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
				const json = (await res.json()) as { results?: CollegeSuggestion[] };
				if (cancelled) return;
				setCollegeSuggestions(Array.isArray(json?.results) ? json.results : []);
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

	// Major suggestions
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

		const matches = COMMON_MAJORS.filter((m) => m.toLowerCase().includes(q))
			.filter((m) => m !== major)
			.slice(0, 6);

		setMajorSuggestions(matches as string[]);
	}, [educationLevel, major, majorQuery]);

	// Course subject suggestions
	useEffect(() => {
		if (educationLevel !== "college") {
			setCourseSubjectSuggestions([]);
			return;
		}

		const q = courseSubjectQuery.trim().toUpperCase();
		if (q.length === 0) {
			setCourseSubjectSuggestions(Array.from(COLLEGE_SUBJECTS).slice(0, 8));
			return;
		}

		const matches = Array.from(COLLEGE_SUBJECTS)
			.filter((s) => s.includes(q))
			.slice(0, 8);

		setCourseSubjectSuggestions(matches);
	}, [courseSubjectQuery, educationLevel]);

	const educationNextDisabled =
		educationLevel === "highSchool" ? grade === null : collegeName.trim().length < 2;

	const classesNextDisabled = classes.length === 0;

	const suggestionGroups = useMemo(() => {
		if (educationLevel !== "highSchool" || !grade) {
			return [] as Array<{ category: string; items: string[] }>;
		}
		const catalog = CLASSES_BY_GRADE[grade];
		return Object.entries(catalog)
			.map(([category, items]) => ({
				category,
				items: items.filter((c) => !classes.includes(c)),
			}))
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

	const addCollegeCourse = () => {
		if (!courseSubject.trim() || !courseNumber.trim()) return;
		const formatted = formatCollegeCourse(courseSubject, courseNumber, courseTitle);
		if (classes.includes(formatted)) return;
		setClasses((prev) => [...prev, formatted]);
		setCourseNumber("");
		setCourseTitle("");
		setCourseQuickInput("");
	};

	const addCollegeCourseFromQuick = () => {
		const parsed = parseCollegeCourse(courseQuickInput);
		if (!parsed) return;
		const formatted = formatCollegeCourse(parsed.subject, parsed.number, parsed.title);
		if (classes.includes(formatted)) return;
		setCourseSubject(parsed.subject);
		setCourseSubjectQuery(parsed.subject);
		setCourseNumber(parsed.number);
		setCourseTitle(parsed.title);
		setClasses((prev) => [...prev, formatted]);
		setCourseQuickInput("");
	};

	const saveAndGoDashboard = async () => {
		const userId = getUserId();
		if (!userId) {
			router.push("/login");
			return;
		}

		let nextPayload: OnboardingPayload;

		if (educationLevel === "highSchool") {
			if (!grade) return;
			nextPayload = {
				educationLevel: "highSchool",
				grade,
				highSchoolName: highSchoolName.trim() ? highSchoolName.trim() : undefined,
				classes,
				savedAt: new Date().toISOString(),
			};
		} else {
			nextPayload = {
				educationLevel: "college",
				collegeName: collegeName.trim(),
				major: major.trim() ? major.trim() : undefined,
				classes,
				savedAt: new Date().toISOString(),
			};
		}

		await saveOnboarding(userId, nextPayload);
		router.push("/dashboard");
	};

	return (
		<main style={styles.stage}>
			<section style={styles.shell} aria-label="Onboarding">
				{step === "education" ? (
					<SchoolForm
						styles={styles}
						educationLevel={educationLevel}
						setEducationLevel={setEducationLevel}
						grade={grade}
						setGrade={setGrade}
						highSchoolName={highSchoolName}
						setHighSchoolName={setHighSchoolName}
						collegeName={collegeName}
						setCollegeName={setCollegeName}
						setCollegeQuery={setCollegeQuery}
						collegeLoading={collegeLoading}
						collegeSuggestions={collegeSuggestions}
						setCollegeSuggestions={setCollegeSuggestions}
						major={major}
						setMajor={setMajor}
						setMajorQuery={setMajorQuery}
						majorSuggestions={majorSuggestions}
						setMajorSuggestions={setMajorSuggestions}
						nextDisabled={educationNextDisabled}
						onNext={() => setStep("classes")}
					/>
				) : (
					<ClassesForm
						styles={styles}
						educationLevel={educationLevel}
						classes={classes}
						removeClass={removeClass}
						classInput={classInput}
						setClassInput={setClassInput}
						addClass={addClass}
						courseQuickInput={courseQuickInput}
						setCourseQuickInput={setCourseQuickInput}
						addCollegeCourseFromQuick={addCollegeCourseFromQuick}
						courseSubjectQuery={courseSubjectQuery}
						setCourseSubjectQuery={setCourseSubjectQuery}
						setCourseSubject={setCourseSubject}
						courseNumber={courseNumber}
						setCourseNumber={setCourseNumber}
						courseTitle={courseTitle}
						setCourseTitle={setCourseTitle}
						addCollegeCourse={addCollegeCourse}
						courseSubjectSuggestions={courseSubjectSuggestions}
						setCourseSubjectSuggestions={setCourseSubjectSuggestions}
						suggestionGroups={suggestionGroups}
						isCategoryOpen={isCategoryOpen}
						toggleCategory={toggleCategory}
						nextDisabled={classesNextDisabled}
						onNext={saveAndGoDashboard}
						onBack={() => setStep("education")}
					/>
				)}
			</section>
		</main>
	);
}