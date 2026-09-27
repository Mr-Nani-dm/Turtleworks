import { ElementType, ReactNode } from "react";

type ContainerProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
};

export function Container({ as: Tag = "div", children, className = "" }: ContainerProps) {
  return <Tag className={`container-tw ${className}`}>{children}</Tag>;
}
