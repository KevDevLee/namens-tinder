export default function AppButton({ href, onClick, children, style = {} }) {
  const baseStyle = {
    background: "#4a90e2",
    color: "white",
    fontSize: 20,
    padding: "14px 18px",
    borderRadius: 12,
    textAlign: "center",
    textDecoration: "none",
    fontWeight: "600",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    cursor: "pointer",
    display: "block",
  };

  if (href) {
    return (
      <a href={href} style={{ ...baseStyle, ...style }}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} style={{ ...baseStyle, ...style }}>
      {children}
    </button>
  );
}
