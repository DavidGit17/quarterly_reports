export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(circle at top left, #DFF7E8 0%, transparent 45%),
          radial-gradient(circle at center, #CFF6F2 0%, transparent 55%),
          radial-gradient(circle at bottom left, #BFE8FF 0%, transparent 50%),
          linear-gradient(135deg, #EAFDFF 0%, #D8F7FF 45%, #F8FEFF 100%)
        `,
      }}
    >
      {children}
    </div>
  );
}
