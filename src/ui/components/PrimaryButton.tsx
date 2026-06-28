import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function PrimaryButton({ children, ...rest }: Props) {
  return (
    <button className="btn-primary" {...rest}>
      {children}
    </button>
  );
}
