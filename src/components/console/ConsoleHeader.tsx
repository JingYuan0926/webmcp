import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The header shared by the merchant console and the SDK docs. Both pages used
 * to draw their own bar and their own shield glyph; they now show the product
 * logo and differ only in their subtitle and their links.
 */
export function ConsoleHeader({
  subtitle,
  children,
}: {
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <header className="console-header">
      <Link className="console-brand" href="/" aria-label="PageCtrl home">
        <Image src="/logo.png" alt="" width={30} height={30} priority />
        <span>
          <strong>PageCTRL</strong>
          <small>{subtitle}</small>
        </span>
      </Link>
      {children ? <nav aria-label="Console navigation">{children}</nav> : null}
    </header>
  );
}
