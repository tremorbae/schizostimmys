"use client";

interface ErrorMessageProps {
  message?: string;
  children?: React.ReactNode;
}

const ErrorMessage = ({ message, children }: ErrorMessageProps) => {
  const content = message || children;
  const hasContent = Boolean(content);

  return (
    <div className="error-container" aria-live="polite" aria-atomic="true">
      <div className="error-text" style={{ visibility: hasContent ? "visible" : "hidden" }}>
        {content || "placeholder"}
      </div>
    </div>
  );
};

export default ErrorMessage;
