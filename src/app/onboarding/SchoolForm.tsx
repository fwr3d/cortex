"use client";

import React from "react";
import Link from "next/link";
import type {
	CollegeSuggestion,
	EducationLevel,
	GradeLevel,
} from "@/features/onboarding/types";

type Styles = ReturnType<typeof import("./styles").createOnboardingStyles>;

export default function SchoolForm(props: {
	styles: Styles;
	
	educationLevel: EducationLevel;
	setEducationLevel: (v: EducationLevel) => void;

	grade: GradeLevel | null;
	setGrade: (v: GradeLevel) => void;

	highSchoolName: string;
	setHighSchoolName: (v: string) => void;

	collegeName: string;
	setCollegeName: (v: string) => void;
	setCollegeQuery: (v: string) => void;

	collegeLoading: boolean;
	collegeSuggestions: CollegeSuggestion[];
	setCollegeSuggestions: (v: CollegeSuggestion[]) => void;

	major: string;
	setMajor: (v: string) => void;
	setMajorQuery: (v: string) => void;

	majorSuggestions: string[];
	setMajorSuggestions: (v: string[]) => void;

	nextDisabled: boolean;
	onNext: () => void;
}) {
	const { styles } = props;

	return (
		<>
			<header style={styles.header}>
				<div style={styles.title}>Tell us about school</div>
				<div style={styles.subtitle}>
					We use this to personalize class suggestions and tone.
				</div>
			</header>

			<div style={styles.body}>
				<div>
					<div style={styles.label}>School level</div>
					<div style={styles.segmented}>
						<button
							type="button"
							style={Object.assign({}, styles.segment, {
								background:
									props.educationLevel === "highSchool"
										? "rgba(0,0,0,0.30)"
										: "transparent",
							})}
							onClick={() => props.setEducationLevel("highSchool")}
						>
							High school
						</button>

						<button
							type="button"
							style={Object.assign({}, styles.segment, {
								background:
									props.educationLevel === "college"
										? "rgba(0,0,0,0.30)"
										: "transparent",
							})}
							onClick={() => props.setEducationLevel("college")}
						>
							College
						</button>
					</div>
				</div>

				{props.educationLevel === "highSchool" ? (
					<>
						<div>
							<div style={styles.label}>Grade level</div>
							<select
								style={styles.select}
								value={props.grade ?? ""}
								onChange={(e) => {
									const v = Number(e.target.value);
									if (v === 9 || v === 10 || v === 11 || v === 12) {
										props.setGrade(v);
									}
								}}
								required
							>
								<option style ={styles.option} value="" disabled>
									Select…
								</option>
								<option style ={styles.option} value="9">9</option>
								<option style ={styles.option} value="10">10</option>
								<option style ={styles.option} value="11">11</option>
								<option style ={styles.option} value="12">12</option>
							</select>
						</div>

						<div>
							<div style={styles.label}>High school (optional)</div>
							<input
								style={styles.input}
								value={props.highSchoolName}
								onChange={(e) => props.setHighSchoolName(e.target.value)}
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
								value={props.collegeName}
								onChange={(e) => {
									props.setCollegeName(e.target.value);
									props.setCollegeQuery(e.target.value);
								}}
								placeholder="Start typing your school…"
								required
							/>

							<div style={styles.hint}>
								{props.collegeLoading
									? "Searching schools…"
									: "Pick a match from the list, or keep typing."}
							</div>

							{props.collegeSuggestions.length > 0 ? (
								<div style={styles.suggestionList}>
									{props.collegeSuggestions.slice(0, 6).map((s) => (
										<button
											key={s.id}
											type="button"
											style={styles.suggestionItem}
											onClick={() => {
												props.setCollegeName(s.label);
												props.setCollegeQuery(s.label);
												props.setCollegeSuggestions([]);
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
								value={props.major}
								onChange={(e) => {
									props.setMajor(e.target.value);
									props.setMajorQuery(e.target.value);
								}}
								placeholder="Start typing your major…"
							/>

							<div style={styles.hintTight}>
								Pick a match from the list, or keep typing.
							</div>

							{props.majorSuggestions.length > 0 ? (
								<div style={styles.suggestionList}>
									{props.majorSuggestions.map((m) => (
										<button
											key={m}
											type="button"
											style={styles.suggestionItem}
											onClick={() => {
												props.setMajor(m);
												props.setMajorQuery(m);
												props.setMajorSuggestions([]);
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
					style={Object.assign({}, styles.btn, {
						opacity: props.nextDisabled ? 0.55 : 1,
					})}
					disabled={props.nextDisabled}
					onClick={props.onNext}
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
	);
}