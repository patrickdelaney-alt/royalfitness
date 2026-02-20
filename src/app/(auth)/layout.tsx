export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="text-primary">Royal</span>
          <span className="text-foreground">Wellness</span>{" "}
          <span className="text-lg font-normal text-muted">Beta</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Track your workouts. Track your nutrition. Track your wellness
        </p>
      </div>
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-lg border border-border">
        {children}
      </div>
    </div>
  );
}
