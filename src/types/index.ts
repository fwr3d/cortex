export type NoteRow = {
	id: string;
	classId: string;
	title: string;
	updatedAt: string; // ISO
	content: string;
};

// Re-export shared onboarding types from their canonical source.
export type { GradeLevel, OnboardingPayload } from "@/features/onboarding/types";
