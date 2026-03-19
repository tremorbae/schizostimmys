"use client";

import { memo } from "react";
import TitleBar from "../ui/TitleBar";

const Modal = memo(({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="window"
        style={{ minWidth: '280px', maxWidth: '400px', width: '90vw', margin: '0 auto', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <TitleBar title={title} onClose={onClose} />
        <div className="body p-4">
          {children}
        </div>
      </div>
    </div>
  );
});

export default Modal;
