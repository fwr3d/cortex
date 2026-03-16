export type Step = "education" | "classes";
export type EducationLevel = "highSchool" | "college";
export type GradeLevel = 9 | 10 | 11 | 12;

export type ClassCatalog = Record<string, string[]>;

export type OnboardingPayload =
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

export type CollegeSuggestion = { id: string; label: string; name: string };
export type CourseParse = { subject: string; number: string; title: string };