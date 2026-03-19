"use client";

import { memo } from "react";

const TitleBar = memo(({ title, onClose }: { title: string; onClose?: () => void }) => {
  return (
    <div className="titlebar">
      <span>{title}</span>
      {onClose && (
        <div className="titlebar-buttons">
          <div
            className="titlebar-btn"
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose();
              }
            }}
          >
            ×
          </div>
        </div>
      )}
    </div>
  );
});

export default TitleBar;
