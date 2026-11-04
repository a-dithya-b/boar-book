import type { ReactNode } from "react";
import { Link } from "react-router";

export function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <rect x="8" y="8" width="7" height="16" rx="1.5" fill="#fff" />
      <rect x="17" y="13" width="7" height="11" rx="1.5" fill="#fff" opacity=".55" />
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Logo />
            <span>Boar Book</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/#chapters" className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              Chapters
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <span>An unofficial, fan-made study companion to <em>Designing Data-Intensive Applications</em> (2nd ed.).</span>
          <span>Not affiliated with the authors or O'Reilly. Go read the book.</span>
        </div>
      </footer>
    </div>
  );
}
