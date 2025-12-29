export function FullBleed({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {children}
    </div>
  );
}
