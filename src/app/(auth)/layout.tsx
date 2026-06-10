export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", overflow: "hidden", display: "flex" }}>
      {children}
    </div>
  );
}
