"use client";

import { useEffect } from "react";

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  useEffect(() => {
    // Clean up any browser extension attributes that might cause hydration issues
    const body = document.body;

    // Remove common browser extension attributes
    const extensionAttributes = [
      "cz-shortcut-listen",
      "data-new-gr-c-s-check-loaded",
      "data-gr-ext-installed",
      "spellcheck",
    ];

    extensionAttributes.forEach((attr) => {
      if (body.hasAttribute(attr)) {
        body.removeAttribute(attr);
      }
    });
  }, []);

  return <>{children}</>;
}
