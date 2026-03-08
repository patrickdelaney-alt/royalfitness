export default function MainLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="w-8 h-8 border-3 rounded-full animate-spin"
        style={{
          borderColor: "rgba(120,117,255,0.30)",
          borderTopColor: "#a8a6ff",
        }}
      />
    </div>
  );
}
