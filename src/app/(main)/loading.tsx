export default function MainLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="w-8 h-8 border-3 rounded-full animate-spin"
        style={{
          borderColor: "rgba(109,106,245,0.3)",
          borderTopColor: "#8b88f8",
        }}
      />
    </div>
  );
}
