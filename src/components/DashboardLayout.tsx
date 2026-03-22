"use client";

import React, { useEffect, useState } from "react";
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
	const [isMobile, setIsMobile] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

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
		padding: isMobile ? "60px 14px 40px" : "28px 18px 40px",
		minWidth: 0,
	};

	const hamburger: React.CSSProperties = {
		display: isMobile ? "flex" : "none",
		position: "fixed",
		top: 12,
		left: 12,
		zIndex: 200,
		alignItems: "center",
		justifyContent: "center",
		width: 38,
		height: 38,
		borderRadius: 10,
		border: `1px solid ${props.theme.border}`,
		background: props.theme.bg,
		cursor: "pointer",
		color: props.theme.text,
		fontSize: 18,
	};

	const backdrop: React.CSSProperties = {
		display: isMobile && mobileOpen ? "block" : "none",
		position: "fixed",
		inset: 0,
		background: "rgba(0,0,0,0.55)",
		zIndex: 99,
	};

	return (
		<div style={layout}>
			<button
				type="button"
				style={hamburger}
				onClick={() => setMobileOpen(true)}
				aria-label="Open navigation"
			>
				☰
			</button>

			<div style={backdrop} onClick={() => setMobileOpen(false)} />

			<Sidebar
				theme={props.theme}
				title={props.sidebarTitle ?? "Cortex"}
				items={props.sidebarItems}
				footer={props.sidebarFooter}
				isMobile={isMobile}
				isOpen={mobileOpen}
				onClose={() => setMobileOpen(false)}
			/>

			<main style={main}>{props.children}</main>
		</div>
	);
}
