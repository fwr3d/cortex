"use client";

import React from "react";
import Sidebar, { type SidebarItem } from "./sidebar";

export type Theme = {
	bg: string;
	border: string;
	text: string;
	muted: string;
};

export default function DashboardLayout(props: {
	theme: Theme;
	sidebarTitle?: string;
	sidebarItems: SidebarItem[];
	sidebarFooter?: React.ReactNode;
	children: React.ReactNode;
}) {
	const layout: React.CSSProperties = {
		display: "flex",
		minHeight: "100vh",
		backgroundColor: props.theme.bg,
		color: props.theme.text,
		fontFamily:
			"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
	};

	const main: React.CSSProperties = {
		flex: 1,
		padding: "28px 18px 40px",
		minWidth: 0,
	};

	return (
		<div style={layout}>
			<Sidebar
				theme={props.theme}
				title={props.sidebarTitle ?? "Cortex"}
				items={props.sidebarItems}
				footer={props.sidebarFooter}
			/>
			<main style={main}>{props.children}</main>
		</div>
	);
}