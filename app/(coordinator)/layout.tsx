export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7FAFA] via-[#EAF6F3] to-[#EDF7FF]">
      {children}
    </div>
  );
}
