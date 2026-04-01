import { useState, useEffect } from "react";
import logoUrl from "./bitehub-logo.png";

const floatingFoods = ["🍕", "🍛", "🍱", "🌮", "🍜", "🥗", "🍗", "🧆"];
const LOGO = logoUrl;

export function Splash() {
  const [phase, setPhase] = useState<"enter" | "hold">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 900);
    return () => clearTimeout(t1);
  }, []);

  const replay = () => {
    setPhase("enter");
    setTimeout(() => setPhase("hold"), 900);
  };

  return (
    <div
      className="w-[390px] h-[844px] flex flex-col items-center justify-center overflow-hidden relative cursor-pointer select-none"
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "radial-gradient(ellipse at 50% 40%, #1a0a0a 0%, #0a0000 60%, #000 100%)",
      }}
      onClick={replay}
    >
      <style>{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50%       { transform: translateY(-18px) rotate(5deg); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50%       { transform: translateY(-12px) rotate(-3deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-22px) rotate(6deg); }
        }
        @keyframes logo-pop {
          0%   { transform: scale(0.25); opacity: 0; filter: brightness(0); }
          50%  { filter: brightness(1.2); }
          65%  { transform: scale(1.12); opacity: 1; }
          82%  { transform: scale(0.96); }
          100% { transform: scale(1); opacity: 1; filter: brightness(1); }
        }
        @keyframes fade-up {
          0%   { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.75); opacity: 0.5; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scaleY(0.6); opacity: 0.4; }
          40%            { transform: scaleY(1); opacity: 1; }
        }
        @keyframes shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
      `}</style>

      {/* Floating food emojis */}
      {floatingFoods.map((food, i) => (
        <div
          key={i}
          className="absolute text-2xl pointer-events-none"
          style={{
            left: `${8 + (i * 12) % 80}%`,
            top: `${4 + (i * 14) % 88}%`,
            animation: `float-${i % 3} ${3.5 + (i % 3) * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.35}s`,
            opacity: 0.12,
          }}
        >
          {food}
        </div>
      ))}

      {/* Red glow behind logo */}
      <div
        className="absolute rounded-full"
        style={{
          width: 260,
          height: 260,
          background: "radial-gradient(circle, rgba(180,0,0,0.35) 0%, transparent 70%)",
          animation: "shimmer 2.5s ease-in-out infinite",
        }}
      />

      {/* Pulse rings */}
      {phase === "hold" && (
        <>
          <div
            className="absolute rounded-full"
            style={{
              width: 200,
              height: 200,
              border: "2px solid rgba(200,0,0,0.3)",
              animation: "pulse-ring 2s ease-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 200,
              height: 200,
              border: "2px solid rgba(200,0,0,0.15)",
              animation: "pulse-ring 2s ease-out infinite",
              animationDelay: "0.7s",
            }}
          />
        </>
      )}

      {/* Logo image */}
      <div
        key={`logo-${phase}`}
        style={{
          animation: "logo-pop 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards",
          opacity: 0,
          width: 260,
          height: 260,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          background: "#1a0000",
          boxShadow: "0 0 48px rgba(200,0,0,0.4)",
        }}
      >
        <img
          src={LOGO}
          alt="BiteHub"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Tagline */}
      <div
        key={`tag-${phase}`}
        style={{ animation: "fade-up 0.6s ease-out 0.7s forwards", opacity: 0 }}
      >
        <p
          className="text-sm font-medium tracking-widest uppercase mt-1"
          style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.22em" }}
        >
          Flavour, delivered fast.
        </p>
      </div>

      {/* Loading dots */}
      {phase === "hold" && (
        <div
          className="flex gap-2 mt-10"
          style={{ animation: "fade-in 0.4s ease-out forwards" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-4 rounded-full"
              style={{
                background: "#cc0000",
                animation: "dot-bounce 1.1s ease-in-out infinite",
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Tap to replay hint */}
      <p
        className="absolute bottom-10 text-xs font-medium tracking-widest uppercase"
        style={{
          color: "rgba(255,255,255,0.2)",
          animation: "fade-in 0.4s ease-out 1.5s forwards",
          opacity: 0,
          letterSpacing: "0.18em",
        }}
      >
        Tap to replay
      </p>
    </div>
  );
}
