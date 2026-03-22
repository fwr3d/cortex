import HomeClient from "../HomeClient";

export default function Page() {
	return (
		<HomeClient
			wordmarkText="Cortex"
			tagline="Turn notes into flashcards and quizzes."
			ctaLabel="Log in"
			ctaHref="/login"
		/>
	);
}