import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
