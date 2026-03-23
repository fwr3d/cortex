import React from "react";

type IconProps = { size?: number };

function Svg({ size = 18, children }: React.PropsWithChildren<IconProps>) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
			{children}
		</svg>
	);
}

export function BoldIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M9 7V11H13C14.1046 11 15 10.1046 15 9C15 7.89543 14.1046 7 13 7H9ZM15.9365 11.7161C16.5966 11.0028 17 10.0485 17 9C17 6.79086 15.2091 5 13 5H8.5C7.67157 5 7 5.67157 7 6.5V12V18.5C7 19.3284 7.67157 20 8.5 20H13.5C15.9853 20 18 17.9853 18 15.5C18 13.9126 17.178 12.5171 15.9365 11.7161ZM13 13H9V18H13.5C14.8807 18 16 16.8807 16 15.5C16 14.1193 14.8807 13 13.5 13H13Z"
				fill="#ffffff"
			/>
		</Svg>
	);
}

export function ItalicIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8 6C8 5.44772 8.44772 5 9 5H12H15C15.5523 5 16 5.44772 16 6C16 6.55228 15.5523 7 15 7H12.8579L11.1656 18H13C13.5523 18 14 18.4477 14 19C14 19.5523 13.5523 20 13 20H10H7C6.44772 20 6 19.5523 6 19C6 18.4477 6.44772 18 7 18H9.14208L10.8344 7H9C8.44772 7 8 6.55228 8 6Z"
				fill="#ffffff"
			/>
		</Svg>
	);
}

export function BulletListIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M6.25 7C6.25 7.69036 5.69036 8.25 5 8.25C4.30964 8.25 3.75 7.69036 3.75 7C3.75 6.30964 4.30964 5.75 5 5.75C5.69036 5.75 6.25 6.30964 6.25 7ZM9 6C8.44771 6 8 6.44772 8 7C8 7.55228 8.44771 8 9 8H19C19.5523 8 20 7.55228 20 7C20 6.44772 19.5523 6 19 6H9ZM9 11C8.44771 11 8 11.4477 8 12C8 12.5523 8.44771 13 9 13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H9ZM9 16C8.44771 16 8 16.4477 8 17C8 17.5523 8.44771 18 9 18H19C19.5523 18 20 17.5523 20 17C20 16.4477 19.5523 16 19 16H9ZM5 13.25C5.69036 13.25 6.25 12.6904 6.25 12C6.25 11.3096 5.69036 10.75 5 10.75C4.30964 10.75 3.75 11.3096 3.75 12C3.75 12.6904 4.30964 13.25 5 13.25ZM5 18.25C5.69036 18.25 6.25 17.6904 6.25 17C6.25 16.3096 5.69036 15.75 5 15.75C4.30964 15.75 3.75 16.3096 3.75 17C3.75 17.6904 4.30964 18.25 5 18.25Z"
				fill="#ffffff"
			/>
		</Svg>
	);
}

export function AlignLeftIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M3 10H16M3 14H21M3 18H16M3 6H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function AlignMiddleIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M3 6H21M3 14H21M17 10H7M17 18H7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function AlignRightIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M3 6H21M8 10H21M3 14H21M8 18H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function AlignJustifyIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M3 6H21M3 10H21M3 14H21M3 18H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function SpacingIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M11 12H21M5 4V20M5 4L8 7M5 4L2 7M5 20L8 17M5 20L2 17M11 6H21M11 18H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function UnderlineIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M6 4V10C6 13.3137 8.68629 16 12 16C15.3137 16 18 13.3137 18 10V4M4 20H20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function StrikeIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M3 12H21M16.5 7C16.5 7 15.5 4.5 12 4.5C8.5 4.5 7 6.5 7 8.5C7 11 11 12 12 12M7.5 17C7.5 17 8.5 19.5 12 19.5C15.5 19.5 17 17.5 17 15.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
		</Svg>
	);
}

export function CodeIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M16 18L22 12L16 6M8 6L2 12L8 18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function BlockquoteIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path fillRule="evenodd" clipRule="evenodd" d="M3 6C3 5.44772 3.44772 5 4 5H8C8.55228 5 9 5.44772 9 6V10C9 10.5523 8.55228 11 8 11H6C6 12.6569 7.34315 14 9 14V16C6.23858 16 4 13.7614 4 11V6H3ZM13 6C13 5.44772 13.4477 5 14 5H18C18.5523 5 19 5.44772 19 6V10C19 10.5523 18.5523 11 18 11H16C16 12.6569 17.3431 14 19 14V16C16.2386 16 14 13.7614 14 11V6H13Z" fill="#ffffff" opacity="0.85" />
		</Svg>
	);
}

export function UndoIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M3 7V13H9" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M3.5 13C5 8.5 9 5.5 13.5 5.5C18.1944 5.5 22 9.30558 22 14C22 18.6944 18.1944 22.5 13.5 22.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
		</Svg>
	);
}

export function RedoIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M21 7V13H15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M20.5 13C19 8.5 15 5.5 10.5 5.5C5.80558 5.5 2 9.30558 2 14C2 18.6944 5.80558 22.5 10.5 22.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
		</Svg>
	);
}

export function OrderedListIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M5.99999 5.5C5.99999 5.22386 5.77613 5 5.49999 5C5.22385 5 4.99999 5.22386 4.99999 5.5V8.5C4.99999 8.77614 5.22385 9 5.49999 9C5.77613 9 5.99999 8.77614 5.99999 8.5V5.5ZM5.25046 11.2673C5.38308 11.1789 5.55766 11.1864 5.68212 11.286C5.85245 11.4223 5.86653 11.6764 5.71228 11.8306L4.39644 13.1464C4.25344 13.2894 4.21066 13.5045 4.28805 13.6913C4.36544 13.8782 4.54776 14 4.74999 14H6.49999C6.77613 14 6.99999 13.7761 6.99999 13.5C6.99999 13.2239 6.77613 13 6.49999 13H5.9571L6.41939 12.5377C6.99508 11.962 6.94256 11.0137 6.30681 10.5051C5.8423 10.1335 5.19072 10.1053 4.69576 10.4352L4.47264 10.584C4.24288 10.7372 4.18079 11.0476 4.33397 11.2773C4.48714 11.5071 4.79758 11.5692 5.02734 11.416L5.25046 11.2673ZM4.74999 15.5C4.47385 15.5 4.24999 15.7239 4.24999 16C4.24999 16.2761 4.47385 16.5 4.74999 16.5H5.29288L4.64644 17.1464C4.50344 17.2894 4.46066 17.5045 4.53805 17.6913C4.61544 17.8782 4.79776 18 4.99999 18H5.74999C5.88806 18 5.99999 18.1119 5.99999 18.25C5.99999 18.3881 5.88806 18.5 5.74999 18.5H4.74999C4.47385 18.5 4.24999 18.7239 4.24999 19C4.24999 19.2761 4.47385 19.5 4.74999 19.5H5.74999C6.44035 19.5 6.99999 18.9404 6.99999 18.25C6.99999 17.6972 6.6412 17.2283 6.1438 17.0633L6.85355 16.3536C6.99654 16.2106 7.03932 15.9955 6.96193 15.8087C6.88454 15.6218 6.70222 15.5 6.49999 15.5H4.74999ZM8.99999 6C8.44771 6 7.99999 6.44772 7.99999 7C7.99999 7.55228 8.44771 8 8.99999 8H19C19.5523 8 20 7.55228 20 7C20 6.44772 19.5523 6 19 6H8.99999ZM8.99999 11C8.44771 11 7.99999 11.4477 7.99999 12C7.99999 12.5523 8.44771 13 8.99999 13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H8.99999ZM8.99999 16C8.44771 16 7.99999 16.4477 7.99999 17C7.99999 17.5523 8.44771 18 8.99999 18H19C19.5523 18 20 17.5523 20 17C20 16.4477 19.5523 16 19 16H8.99999Z"
				fill="#ffffff"
			/>
		</Svg>
	);
}

export function HighlightIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M9 3L5 7L9 11L13 7L9 3Z" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
			<path d="M9 11L5 15H3V17H7L11 13" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M3 21H21" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
		</Svg>
	);
}

export function LinkIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M10 13C10.5523 13.5523 11.1974 13.9866 11.8998 14.2731C12.6022 14.5597 13.3474 14.6924 14.0954 14.663C14.8434 14.6336 15.5761 14.4426 16.2554 14.1022C16.9347 13.7619 17.5459 13.2796 18.05 12.69L20.05 10.39C20.9627 9.41427 21.4643 8.12447 21.4472 6.78938C21.43 5.45429 20.8952 4.17757 19.9581 3.22575C19.021 2.27394 17.7556 1.72099 16.4207 1.67832C15.0859 1.63566 13.7875 2.1068 12.79 2.99L11.41 4.26" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M14 11C13.4477 10.4477 12.8026 10.0134 12.1002 9.72692C11.3978 9.44047 10.6526 9.30763 9.90459 9.33704C9.15659 9.36644 8.42387 9.55736 7.74455 9.89775C7.06523 10.2381 6.45412 10.7204 5.95 11.31L3.95 13.61C3.03734 14.5857 2.53574 15.8755 2.55287 17.2106C2.56999 18.5457 3.10476 19.8224 4.04184 20.7742C4.97892 21.7261 6.24435 22.279 7.57924 22.3217C8.91413 22.3643 10.2125 21.8932 11.21 21.01L12.58 19.74" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function UnlinkIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M18.84 12.25L21.05 10.04C21.96 9.07 22.46 7.78 22.44 6.44C22.42 5.11 21.89 3.84 20.95 2.89C20.01 1.95 18.73 1.42 17.4 1.4C16.07 1.38 14.78 1.88 13.81 2.79L11.61 4.99" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M5.16 11.75L2.95 13.96C2.04 14.93 1.54 16.22 1.56 17.56C1.58 18.89 2.11 20.16 3.05 21.11C3.99 22.05 5.27 22.58 6.6 22.6C7.93 22.62 9.22 22.12 10.19 21.21L12.39 19.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M2 2L22 22" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
		</Svg>
	);
}

export function SuperscriptIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M5 7L11 13M11 7L5 13" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
			<path d="M17 9V5H21M17 5L21 9" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function SubscriptIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M5 7L11 13M11 7L5 13" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
			<path d="M17 19V15H21M17 15L21 19" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
}

export function TaskListIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<rect x="3" y="5" width="4" height="4" rx="1" stroke="#ffffff" strokeWidth="1.5" />
			<path d="M4.5 7L5.5 8L7 6" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M9 7H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
			<rect x="3" y="13" width="4" height="4" rx="1" stroke="#ffffff" strokeWidth="1.5" />
			<path d="M9 15H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
		</Svg>
	);
}

export function HorizontalRuleIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M3 12H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
			<path d="M7 8V16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
			<path d="M17 8V16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
		</Svg>
	);
}

export function FontColorIcon({ size = 18 }: IconProps) {
	return (
		<Svg size={size}>
			<path d="M9 3L4 17H6.5L7.5 14H11.5L12.5 17H15L10 3H9Z" fill="#ffffff" opacity="0.9" />
			<path d="M8.2 12L9.5 8L10.8 12H8.2Z" fill="rgba(0,0,0,0.5)" />
		</Svg>
	);
}
