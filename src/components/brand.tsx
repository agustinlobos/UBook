import { cn } from "@/lib/utils";

/**
 * Logotipo de umoov. La "u" inicial va en el verde principal; el resto en blanco.
 */
export function Brand({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-extrabold tracking-tighter leading-none select-none",
        className,
      )}
    >
      <span className="text-primary">U</span>
      <span className="text-foreground">moov</span>
    </span>
  );
}
