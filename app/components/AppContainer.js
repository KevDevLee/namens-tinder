export default function AppContainer({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#f4faff",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  );
}
