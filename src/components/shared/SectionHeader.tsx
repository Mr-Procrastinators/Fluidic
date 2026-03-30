interface SectionHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3.5 py-2 text-white uppercase text-[0.7rem] font-bold tracking-[0.05em]"
      style={{ backgroundColor: "#1a2c42", borderRadius: "4px 4px 0 0" }}
    >
      <span>{title}</span>
      {children}
    </div>
  );
}
