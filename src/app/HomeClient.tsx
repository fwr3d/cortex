"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import CortexWord from "@/components/CortexWord";

type Props = {
    wordmarkText: string;
    tagline: string;
    ctaLabel: string;
    ctaHref: string;
};

const FEATURES = ["Rich notes", "Auto-flashcards", "Study sessions"];

export default function HomeClient({ wordmarkText, tagline, ctaLabel }: Props) {
    const accent = "#16a34a";
    const textColor = "#ecfeff";

    const [loggedIn, setLoggedIn] = React.useState(false);
    const belowRef = useRef<HTMLDivElement | null>(null);
    const ctaRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        try {
            setLoggedIn(!!localStorage.getItem("cortex:userId"));
        } catch {}
    }, []);

    useEffect(() => {
        if (!belowRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                belowRef.current,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.25 },
            );
        });
        return () => ctx.revert();
    }, []);

    function handleGetStarted() {
        try {
            const userId = localStorage.getItem("cortex:userId");
            if (userId) {
                const onboardingKey = `cortex:users:${userId}:onboarding:v1`;
                const onboarded = localStorage.getItem(onboardingKey);
                window.location.href = onboarded ? "/dashboard" : "/onboarding";
                return;
            }
        } catch {}
        window.location.href = "/login";
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                padding: "48px 24px",
                backgroundColor: "#070a0a",
                color: textColor,
                fontFamily:
                    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* background glow */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 640,
                    height: 360,
                    borderRadius: "50%",
                    background: "radial-gradient(ellipse at center, rgba(22,163,74,0.13) 0%, transparent 70%)",
                    pointerEvents: "none",
                    filter: "blur(12px)",
                }}
            />

            <div
                style={{
                    width: "min(760px, 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 0,
                    position: "relative",
                }}
            >
                {/* wordmark */}
                <CortexWord
                    text={wordmarkText}
                    mode="glitchHard"
                    accent={accent}
                    textColor={textColor}
                />

                {/* tagline + CTA animate in together */}
                <div ref={belowRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, opacity: 0 }}>
                    <p
                        style={{
                            marginTop: 20,
                            fontSize: 19,
                            fontWeight: 400,
                            letterSpacing: 0.2,
                            color: "rgba(236,254,255,0.65)",
                            lineHeight: 1.5,
                            maxWidth: 420,
                        }}
                    >
                        {tagline}
                    </p>

                    <button
                        ref={ctaRef}
                        type="button"
                        onClick={handleGetStarted}
                        aria-label={loggedIn ? "Go to dashboard" : ctaLabel}
                        onMouseEnter={() => {
                            if (!ctaRef.current) return;
                            gsap.to(ctaRef.current, { y: -2, scale: 1.02, duration: 0.16, ease: "power2.out" });
                        }}
                        onMouseLeave={() => {
                            if (!ctaRef.current) return;
                            gsap.to(ctaRef.current, { y: 0, scale: 1, duration: 0.16, ease: "power2.out" });
                        }}
                        style={{
                            marginTop: 32,
                            padding: "14px 32px",
                            borderRadius: 12,
                            border: "none",
                            background: accent,
                            color: "#041a0e",
                            fontWeight: 700,
                            fontSize: 15,
                            letterSpacing: 0.3,
                            cursor: "pointer",
                            boxShadow: "0 0 24px rgba(22,163,74,0.35)",
                        }}
                    >
                        {loggedIn ? "Go to dashboard" : ctaLabel}
                    </button>

                    {/* feature pills */}
                    <div
                        style={{
                            marginTop: 28,
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            justifyContent: "center",
                        }}
                    >
                        {FEATURES.map((f) => (
                            <span
                                key={f}
                                style={{
                                    padding: "5px 12px",
                                    borderRadius: 20,
                                    border: "1px solid rgba(22,163,74,0.3)",
                                    color: "rgba(236,254,255,0.45)",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    letterSpacing: 0.4,
                                    background: "rgba(22,163,74,0.06)",
                                }}
                            >
                                {f}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}