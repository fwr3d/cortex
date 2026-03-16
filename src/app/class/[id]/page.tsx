import ClassClient from "./ClassClient";

export default async function Page({ params }: { params: { id: string } }) {
	return <ClassClient classId={params.id} />;
}