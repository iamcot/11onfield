"use client";

import { useEffect } from "react";

/**
 * Component to force light mode for form elements on iOS Safari
 * This component uses JavaScript to apply inline styles that Safari cannot override
 */
export default function SafariLightModeWrapper() {
  useEffect(() => {
    const applyLightModeStyles = () => {
      // Target all form elements
      const formElements = document.querySelectorAll('input, select, textarea');

      formElements.forEach((element) => {
        const htmlElement = element as HTMLElement;

        // Apply inline styles that force light mode
        htmlElement.style.setProperty('color-scheme', 'light', 'important');
        htmlElement.style.setProperty('background-color', 'white', 'important');
        htmlElement.style.setProperty('color', '#374151', 'important');

        // Webkit-specific properties
        (htmlElement.style as any).WebkitTextFillColor = '#374151';

        // Apply height and padding based on element type
        if (element.tagName === 'SELECT') {
          (htmlElement.style as any).WebkitAppearance = 'menulist';
          htmlElement.style.setProperty('appearance', 'menulist', 'important');
          // Use explicit height instead of min-height
          htmlElement.style.setProperty('height', '2.5rem', 'important');
          htmlElement.style.setProperty('box-sizing', 'border-box', 'important');
          htmlElement.style.setProperty('padding', '0.5rem 0.75rem', 'important');
          htmlElement.style.setProperty('line-height', 'normal', 'important');
          htmlElement.style.setProperty('vertical-align', 'middle', 'important');
        } else if (element.getAttribute('type') === 'date') {
          (htmlElement.style as any).WebkitAppearance = 'none';
          htmlElement.style.setProperty('appearance', 'none', 'important');
          htmlElement.style.setProperty('height', '2.5rem', 'important');
          htmlElement.style.setProperty('box-sizing', 'border-box', 'important');
          htmlElement.style.setProperty('padding', '0.5rem 0.75rem', 'important');
          htmlElement.style.setProperty('line-height', 'normal', 'important');
        } else if (
          element.getAttribute('type') !== 'checkbox' &&
          element.getAttribute('type') !== 'radio' &&
          element.getAttribute('type') !== 'file'
        ) {
          (htmlElement.style as any).WebkitAppearance = 'none';
          htmlElement.style.setProperty('height', '2.5rem', 'important');
          htmlElement.style.setProperty('box-sizing', 'border-box', 'important');
          htmlElement.style.setProperty('padding', '0.5rem 0.75rem', 'important');
          htmlElement.style.setProperty('line-height', 'normal', 'important');
        }
      });
    };

    // Apply on mount
    applyLightModeStyles();

    // Re-apply when DOM changes (for dynamically added elements)
    const observer = new MutationObserver(() => {
      applyLightModeStyles();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also re-apply on focus events (Safari sometimes resets styles)
    const handleFocus = () => {
      setTimeout(applyLightModeStyles, 0);
    };

    document.addEventListener('focusin', handleFocus);

    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  return null;
}
