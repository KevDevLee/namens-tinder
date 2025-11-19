export default function AppCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: "white",
        width: "100%",
        maxWidth: 380,
        borderRadius: 20,
        padding: "32px 28px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
