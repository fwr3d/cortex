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
	isMobile?: boolean;
	isOpen?: boolean;
	onClose?: () => void;
}) {
	const { isMobile = false, isOpen = false, onClose } = props;

	const sidebar: React.CSSProperties = {
		width: 260,
		flexShrink: 0,
		height: "100vh",
		padding: "18px 14px",
		borderRight: `1px solid ${props.theme.border}`,
		display: "flex",
		flexDirection: "column",
		gap: 14,
		...(isMobile
			? {
					position: "fixed",
					top: 0,
					left: 0,
					zIndex: 100,
					background: props.theme.bg,
					transform: isOpen ? "translateX(0)" : "translateX(-100%)",
					transition: "transform 220ms ease",
				}
			: {
					position: "sticky",
					top: 0,
					background: "rgba(255,255,255,0.02)",
				}),
	};

	const titleRow: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	};

	const title: React.CSSProperties = {
		fontSize: 13,
		fontWeight: 850,
		letterSpacing: 0.2,
		opacity: 0.9,
	};

	const closeBtn: React.CSSProperties = {
		display: isMobile ? "flex" : "none",
		alignItems: "center",
		justifyContent: "center",
		width: 28,
		height: 28,
		borderRadius: 8,
		border: `1px solid ${props.theme.border}`,
		background: "transparent",
		color: props.theme.text,
		cursor: "pointer",
		fontSize: 16,
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

	function handleLinkClick() {
		if (isMobile && onClose) onClose();
	}

	return (
		<aside style={sidebar} aria-label="Sidebar">
			<div style={titleRow}>
				<div style={title}>{props.title}</div>
				<button type="button" style={closeBtn} onClick={onClose} aria-label="Close navigation">
					✕
				</button>
			</div>

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
								onClick={() => {
									btn.onClick();
									if (isMobile && onClose) onClose();
								}}
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
							onClick={handleLinkClick}
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
