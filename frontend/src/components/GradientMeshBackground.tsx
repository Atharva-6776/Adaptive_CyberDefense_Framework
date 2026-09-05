export function GradientMeshBackground({ variant = "default" }: { variant?: "default" | "reduced" | "none" }) {
  if (variant === "none") return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden"
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          variant === "reduced" ? "opacity-30" : "opacity-100"
        }`}
      >
        <div className="absolute top-0 left-[-10%] w-[60%] h-[60%] opacity-[0.12] filter blur-[100px] animate-blob1 rounded-full" style={{ backgroundColor: 'var(--accent-blue)' }} />
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] opacity-[0.08] filter blur-[100px] animate-blob2 rounded-full" style={{ backgroundColor: 'var(--brand-navy)' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] opacity-[0.15] filter blur-[100px] animate-blob3 rounded-full" style={{ backgroundColor: '#D0D0CC' }} />
      </div>
    </div>
  );
}
