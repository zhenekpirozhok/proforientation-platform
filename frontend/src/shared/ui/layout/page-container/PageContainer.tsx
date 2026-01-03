export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-3 sm:px-4 md:px-6">
      {children}
    </div>
  );
}
