import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageMotion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("animate-page-enter", className)}>{children}</div>;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  as: Comp = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const style: CSSProperties | undefined =
    delay > 0 ? { animationDelay: `${delay}s` } : undefined;

  return (
    <Comp className={cn("animate-fade-up", className)} style={style}>
      {children}
    </Comp>
  );
}
