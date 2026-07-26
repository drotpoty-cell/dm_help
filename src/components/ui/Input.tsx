import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
