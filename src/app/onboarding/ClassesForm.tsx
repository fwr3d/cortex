"use client";

import React from "react";
import Link from "next/link";

type Styles = ReturnType<typeof import("./styles").createOnboardingStyles>;

export default function ClassesForm(props: {
	styles: Styles;

	educationLevel: "highSchool" | "college";

	classes: string[];
	removeClass: (name: string) => void;

	classInput: string;
	setClassInput: (v: string) => void;
	addClass: (name: string) => void;

	// College course entry
	courseQuickInput: string;
	setCourseQuickInput: (v: string) => void;
	addCollegeCourseFromQuick: () => void;

	courseSubjectQuery: string;
	setCourseSubjectQuery: (v: string) => void;
	setCourseSubject: (v: string) => void;

	courseNumber: string;
	setCourseNumber: (v: string) => void;

	courseTitle: string;
	setCourseTitle: (v: string) => void;

	addCollegeCourse: () => void;

	courseSubjectSuggestions: string[];
	setCourseSubjectSuggestions: (v: string[]) => void;

	// HS suggestions
	suggestionGroups: Array<{ category: string; items: string[] }>;
	isCategoryOpen: (category: string) => boolean;
	toggleCategory: (category: string) => void;

	nextDisabled: boolean;
	onNext: () => void;
	onBack: () => void;
	saveError?: string | null;
}) {
	const { styles } = props;

	return (
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
						{props.classes.map((c) => (
							<span key={c} style={styles.chip}>
								{c}
								<button
									type="button"
									style={styles.chipX}
									onClick={() => props.removeClass(c)}
									aria-label={`Remove ${c}`}
								>
									×
								</button>
							</span>
						))}
					</div>
				</div>

				<div>
					<div style={styles.label}>Add a class</div>

					{props.educationLevel === "college" ? (
						<>
							<div style={styles.row}>
								<input
									style={styles.input}
									value={props.courseQuickInput}
									onChange={(e) => props.setCourseQuickInput(e.target.value)}
									
									aria-label="Quick add course"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											props.addCollegeCourseFromQuick();
										}
									}}
								/>
								<button
									type="button"
									style={styles.btnSecondary}
									onClick={props.addCollegeCourseFromQuick}
								>
									Add
								</button>
							</div>

							<div style={styles.hintTight}>
								Tip: You can type <span style={styles.inlineCode}>CS182</span>{" "}
								or <span style={styles.inlineCode}>CS 182 - Title</span>.
							</div>

							<div style={styles.row}>
								<input
									style={styles.input}
									value={props.courseSubjectQuery}
									onChange={(e) => {
										const v = e.target.value
											.toUpperCase()
											.replace(/[^A-Z]/g, "");
										props.setCourseSubjectQuery(v);
										props.setCourseSubject(v);
									}}
									
									aria-label="Course subject"
								/>

								<input
									style={styles.input}
									value={props.courseNumber}
									onChange={(e) =>
										props.setCourseNumber(e.target.value.replace(/\s+/g, ""))
									}
									placeholder="Number"
									inputMode="numeric"
									aria-label="Course number"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											props.addCollegeCourse();
										}
									}}
								/>
							</div>

							{props.courseSubjectSuggestions.length > 0 ? (
								<div style={styles.suggestionList}>
									{props.courseSubjectSuggestions.map((s) => (
										<button
											key={s}
											type="button"
											style={styles.suggestionItem}
											onClick={() => {
												props.setCourseSubject(s);
												props.setCourseSubjectQuery(s);
												props.setCourseSubjectSuggestions([]);
											}}
										>
											{s}
										</button>
									))}
								</div>
							) : null}

							<div style={styles.row}>
								<input
									style={styles.input}
									value={props.courseTitle}
									onChange={(e) => props.setCourseTitle(e.target.value)}
									
									aria-label="Course title"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											props.addCollegeCourse();
										}
									}}
								/>
								<button
									type="button"
									style={styles.btnSecondary}
									onClick={props.addCollegeCourse}
								>
									Add
								</button>
							</div>
						</>
					) : (
						<div style={styles.row}>
							<input
								style={styles.input}
								value={props.classInput}
								onChange={(e) => props.setClassInput(e.target.value)}
								placeholder="e.g. AP Biology"
								aria-label="Class name"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										props.addClass(props.classInput);
									}
								}}
							/>
							<button
								type="button"
								style={styles.btnSecondary}
								onClick={() => props.addClass(props.classInput)}
							>
								Add
							</button>
						</div>
					)}
				</div>

				{props.educationLevel === "highSchool" && props.suggestionGroups.length > 0 ? (
					<div>
						<div style={styles.label}>Suggestions</div>

						{props.suggestionGroups.map((g) => (
							<div key={g.category} style={styles.categoryGroup}>
								<div style={styles.categoryHeader}>
									<div style={styles.categoryTitle}>{g.category}</div>
									<button
										type="button"
										style={styles.caret}
										onClick={() => props.toggleCategory(g.category)}
										aria-label={`Toggle ${g.category}`}
									>
										{props.isCategoryOpen(g.category) ? "−" : "+"}
									</button>
								</div>

								{props.isCategoryOpen(g.category) && (
									<div style={styles.suggestionWrap}>
										{g.items.slice(0, 12).map((s) => (
											<button
												key={`${g.category}-${s}`}
												type="button"
												style={styles.suggestion}
												onClick={() => props.addClass(s)}
											>
												{s}
											</button>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				) : null}

				{props.saveError ? (
					<div style={{ fontSize: 13, color: "rgba(255,170,170,0.95)", padding: "8px 10px", background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.18)", borderRadius: 10 }}>
						Failed to save: {props.saveError}
					</div>
				) : null}

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

				<button type="button" style={styles.btnSecondary} onClick={props.onBack}>
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
	);
}