"use client";

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const SectionHeader = ({ children, className = "section-header mb-0.5" }: SectionHeaderProps) => {
  return (
    <p className={className}>
      {children}
    </p>
  );
};

export default SectionHeader;
