import { useEffect, useRef } from "react";

export default function CursorClaw() {
  const cursorRef = useRef(null);
  const glowRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const glow = glowRef.current;
    if (!cursor || !glow) return;

    const handleMouseMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        cursor.style.opacity = "1";
        glow.style.opacity = "0.4";
      }
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      cursor.style.opacity = "0";
      glow.style.opacity = "0";
    };

    // Animation loop using requestAnimationFrame
    let animationId;
    const animate = () => {
      const current = posRef.current;
      const target = targetRef.current;

      // Smooth interpolation with higher responsiveness
      current.x += (target.x - current.x) * 0.25;
      current.y += (target.y - current.y) * 0.25;

      // Use transform3d for hardware acceleration
      cursor.style.transform = `translate3d(${current.x - 20}px, ${current.y - 20}px, 0)`;
      glow.style.transform = `translate3d(${current.x - 32}px, ${current.y - 32}px, 0)`;

      animationId = requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Hide default cursor and optimize rendering */}
      <style>{`
        * {
          cursor: none !important;
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>

      {/* Custom claw cursor */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] select-none text-5xl filter drop-shadow-lg"
        style={{
          opacity: 0,
          transition: "opacity 0.15s ease-out",
          willChange: "transform",
          backfaceVisibility: "hidden",
          perspective: 1000,
        }}
      >
        🦞
      </div>

      {/* Glow effect around cursor */}
      <div
        ref={glowRef}
        className="fixed pointer-events-none z-[9998] select-none rounded-full"
        style={{
          width: 64,
          height: 64,
          background:
            "radial-gradient(circle, rgba(255,88,51,0.5) 0%, transparent 70%)",
          filter: "blur(12px)",
          opacity: 0,
          transition: "opacity 0.15s ease-out",
          willChange: "transform",
          backfaceVisibility: "hidden",
          perspective: 1000,
        }}
      />
    </>
  );
}
