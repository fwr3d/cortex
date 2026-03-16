import type { OnboardingPayload } from "@/features/onboarding/types";

const USER_ID_KEY = "cortex:userId";

export function getUserId(): string | null {
	try {
		return localStorage.getItem(USER_ID_KEY);
	} catch {
		return null;
	}
}

export function clearUserId() {
	try {
		localStorage.removeItem(USER_ID_KEY);
	} catch {
		// ignore
	}
}

export function getOnboardingKey(userId: string) {
	return `cortex:users:${userId}:onboarding:v1`;
}

export function loadOnboarding(userId: string): OnboardingPayload | null {
	try {
		const raw = localStorage.getItem(getOnboardingKey(userId));
		if (!raw) return null;
		return JSON.parse(raw) as OnboardingPayload;
	} catch {
		return null;
	}
}

export function saveOnboarding(userId: string, payload: OnboardingPayload) {
	localStorage.setItem(getOnboardingKey(userId), JSON.stringify(payload));
}