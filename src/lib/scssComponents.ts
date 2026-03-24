import React from "react";
import Link from "next/link";

function mergeClassNames(baseClassName?: string, className?: string) {
  return [baseClassName, className].filter(Boolean).join(" ") || undefined;
}

type IntrinsicTag = keyof React.JSX.IntrinsicElements;

export function createStyledComponent<Tag extends IntrinsicTag>(
  tag: Tag,
  baseClassName?: string,
) {
  type Props = React.ComponentPropsWithoutRef<Tag>;

  const Component = ({ className, ...props }: Props) =>
    React.createElement(tag, {
      ...props,
      className: mergeClassNames(baseClassName, className),
    });

  Component.displayName = `Scss(${String(tag)})`;

  return Component;
}

export function createStyledLink(baseClassName?: string) {
  type Props = React.ComponentProps<typeof Link>;

  const Component = ({ className, ...props }: Props) =>
    React.createElement(Link, {
      ...props,
      className: mergeClassNames(baseClassName, className),
    });

  Component.displayName = "Scss(Link)";

  return Component;
}
