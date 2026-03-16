import React, { Suspense } from "react";
import OnboardingClient from "./Onboarding";

export default function Page() {
	return (
		<Suspense fallback={null}>
			<OnboardingClient />
		</Suspense>
	);
}