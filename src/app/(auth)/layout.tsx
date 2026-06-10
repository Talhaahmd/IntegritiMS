export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </div>
  );
}
