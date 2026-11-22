import logo from "@/assets/codex-soft-logo.webp";

export function BrandMark({ className = "size-9" }: { className?: string }) {
  return <img src={logo} alt="" aria-hidden="true" width={192} height={192} className={`${className} shrink-0 object-contain`} />;
}

export function BrandName({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-wide whitespace-nowrap ${className}`}>
      CODEX <span className="text-primary">·</span> <span className="text-primary">SOFT</span>
    </span>
  );
}
