"use client";

import React, { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import CortexWord from "@/components/CortexWord";

type Props = {
    wordmarkText: string;
    tagline: string;
    ctaLabel: string;
    ctaHref: string;
};

export default function HomeClient({ wordmarkText, tagline, ctaLabel }: Props) {
    const accent = "#16a34a";
    const textColor = "#ecfeff";
    const mutedColor = "rgba(236,254,255,0.72)";

    const ctaRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!ctaRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ctaRef.current,
                { opacity: 0, y: 8 },
                { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", delay: 0.2 },
            );
        });
        return () => ctx.revert();
    }, []);

    const styles = useMemo(() => {
        const stage: React.CSSProperties = {
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "28px 18px",
            backgroundColor: "#070a0a",
            color: textColor,
            fontFamily:
                "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
        };

        const center: React.CSSProperties = {
            width: "min(980px, 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 14,
        };

        const taglineStyle: React.CSSProperties = {
            marginTop: 2,
            fontSize: 14,
            letterSpacing: 0.4,
            color: mutedColor,
            minHeight: 18,
        };

        const btn: React.CSSProperties = {
            marginTop: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer",
            padding: "12px 16px",
            borderRadius: 14,
            background: accent,
            color: "#07110d",
            fontWeight: 700,
            fontSize: 13,
        };

        return { stage, center, taglineStyle, btn };
    }, [accent, mutedColor]);

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
        <main style={styles.stage}>
            <div style={styles.center}>
                <CortexWord
	text={wordmarkText}
	mode="glitchHard"
	accent={accent}
	textColor={textColor}
/>

                <div style={styles.taglineStyle} aria-label="Tagline">
                    {tagline}
                </div>

                <button
                    ref={ctaRef}
                    type="button"
                    style={styles.btn}
                    onClick={handleGetStarted}
                    onMouseEnter={() => {
                        if (!ctaRef.current) return;
                        gsap.to(ctaRef.current, {
                            y: -2,
                            scale: 1.01,
                            duration: 0.18,
                            ease: "power2.out",
                        });
                    }}
                    onMouseLeave={() => {
                        if (!ctaRef.current) return;
                        gsap.to(ctaRef.current, {
                            y: 0,
                            scale: 1,
                            duration: 0.18,
                            ease: "power2.out",
                        });
                    }}
                >
                    {ctaLabel}
                </button>
            </div>
        </main>
    );
}