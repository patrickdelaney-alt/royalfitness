export default function MainLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="w-8 h-8 border-3 rounded-full animate-spin"
        style={{
          borderColor: "rgba(36,63,22,0.30)",
          borderTopColor: "#528531",
        }}
      />
    </div>
  );
}
