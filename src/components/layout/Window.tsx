"use client";

import { ReactNode } from "react";
import TitleBar from "../ui/TitleBar";

interface WindowProps {
  title: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

const Window = ({ title, children, className = "", onClose }: WindowProps) => {
  return (
    <div className={`window ${className}`}>
      <TitleBar title={title} onClose={onClose} />
      <div className="body flex-1 flex">
        <div className="inset p-4 flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Window;
