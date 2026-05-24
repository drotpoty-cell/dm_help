import { LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = ({ className = "", children, ...props }: LabelProps) => {
  return (
    <label
      className={`text-xs font-bold text-zinc-500 uppercase tracking-wider block ${className || 'mb-1'}`}
      {...props}
    >
      {children}
    </label>
  );
};
