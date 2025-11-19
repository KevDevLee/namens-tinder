export default function AppBackground({ children }) {
  return (
    <main
      style={{
        height: "100vh",
        width: "100%",
        background: "linear-gradient(180deg, #3a8de0 0%, #6fbaff 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      {children}
    </main>
  );
}
