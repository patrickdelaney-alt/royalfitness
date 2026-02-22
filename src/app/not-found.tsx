import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-4 text-5xl">🤔</div>
      <h2 className="mb-2 text-xl font-bold text-foreground">
        Page not found
      </h2>
      <p className="mb-6 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/feed"
        className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white btn-gradient shadow-glow"
      >
        Go to Feed
      </Link>
    </div>
  );
}
