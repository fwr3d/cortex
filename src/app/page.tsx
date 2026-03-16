import HomeClient from "./HomeClient";

export default function Page() {
	return (
		<HomeClient
			wordmarkText="CORTEX"
			tagline="Turn class notes into flashcards and quiz questions."
			ctaLabel="Get started"
			ctaHref="/login"
		/>
	);
}