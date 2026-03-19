"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const Button = ({ 
  isLoading = false, 
  loadingText = "submitting...", 
  children, 
  disabled, 
  ...props 
}: ButtonProps) => {
  return (
    <button 
      {...props}
      disabled={disabled || isLoading}
      className="button w-full"
    >
      {isLoading ? loadingText : children}
    </button>
  );
};

export default Button;
