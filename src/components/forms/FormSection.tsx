"use client";

import { ReactNode } from "react";

interface FormSectionProps {
  description: string;
  children: ReactNode;
}

const FormSection = ({ description, children }: FormSectionProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 mb-2">
        <p className="form-description">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
};

export default FormSection;
