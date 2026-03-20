	"use client";

	import React from "react";
	import Link from "next/link";
	import type { Theme } from "./DashboardLayout";

	export type SidebarItem =
		| {
				type?: "link";
				label: string;
				href: string;
				active?: boolean;
		}
		| {
				type: "button";
				label: string;
				onClick: () => void;
		}
		| {
				type: "divider";
		};

	export default function Sidebar(props: {
		theme: Theme;
		title: string;
		items: SidebarItem[];
		footer?: React.ReactNode;
	}) {
		const sidebar: React.CSSProperties = {
			width: 260,
			flexShrink: 0,
			position: "sticky",
			top: 0,
			height: "100vh",
			padding: "18px 14px",
			borderRight: `1px solid ${props.theme.border}`,
			background: "rgba(255,255,255,0.02)",
			display: "flex",
			flexDirection: "column",
			gap: 14,
		};

		const title: React.CSSProperties = {
			fontSize: 13,
			fontWeight: 850,
			letterSpacing: 0.2,
			opacity: 0.9,
		};

		const nav: React.CSSProperties = {
			display: "flex",
			flexDirection: "column",
			gap: 8,
		};

		const itemBase: React.CSSProperties = {
			border: `1px solid ${props.theme.border}`,
			borderRadius: 12,
			padding: "10px 12px",
			color: props.theme.text,
			textDecoration: "none",
			fontSize: 13,
			fontWeight: 700,
			background: "transparent",
			textAlign: "left",
			cursor: "pointer",
			display: "block",
			width: "100%",
		};

		const itemActive: React.CSSProperties = {
			...itemBase,
			background: "rgba(255,255,255,0.06)",
		};

		const divider: React.CSSProperties = {
			height: 1,
			background: props.theme.border,
			opacity: 0.6,
			margin: "6px 0",
		};

		const footerWrap: React.CSSProperties = {
			marginTop: "auto",
			paddingTop: 12,
			color: props.theme.muted,
			fontSize: 12,
			lineHeight: 1.4,
		};

		return (
			<aside style={sidebar} aria-label="Sidebar">
				<div style={title}>{props.title}</div>

				<nav style={nav}>
					{props.items.map((it, idx) => {
						if ((it as SidebarItem).type === "divider") {
							return <div key={`divider-${idx}`} style={divider} />;
						}

						if ((it as SidebarItem).type === "button") {
							const btn = it as Extract<SidebarItem, { type: "button" }>;
							return (
								<button
									key={`${btn.label}-${idx}`}
									type="button"
									style={itemBase}
									onClick={btn.onClick}
								>
									{btn.label}
								</button>
							);
						}

						const linkItem = it as Extract<SidebarItem, { href: string }>;
						return (
							<Link
								key={`${linkItem.label}-${idx}`}
								href={linkItem.href}
								style={linkItem.active ? itemActive : itemBase}
							>
								{linkItem.label}
							</Link>
						);
					})}
				</nav>

				{props.footer ? <div style={footerWrap}>{props.footer}</div> : null}
			</aside>
		);
	}