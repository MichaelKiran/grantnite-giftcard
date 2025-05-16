'use client';

import React, { PropsWithChildren } from 'react';

// SafeSVG component to prevent hydration mismatches caused by browser extensions
// like Dark Reader that inject custom CSS
export default function SafeSVG({
  children,
  ...props
}: PropsWithChildren<React.SVGProps<SVGSVGElement>>) {
  return (
    <svg {...props} suppressHydrationWarning>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            suppressHydrationWarning: true,
            ...child.props,
          });
        }
        return child;
      })}
    </svg>
  );
} 