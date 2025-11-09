import * as React from "react";

// Define the breakpoint
const MOBILE_BREAKPOINT = 768;

// Define the media query string
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

export function useIsMobile() {
  // Use 'undefined' as the initial state to handle Server-Side Rendering (SSR)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // 'window.matchMedia' is a client-side only API
    const mql = window.matchMedia(QUERY);

    // Handler for when the media query match state changes
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Set the initial state correctly on client-side mount
    // 'mql.matches' gives the current state of the media query
    setIsMobile(mql.matches);

    // Add the event listener
    mql.addEventListener("change", onChange);

    // Clean up the listener when the component unmounts
    return () => mql.removeEventListener("change", onChange);
  }, []); // The empty dependency array ensures this effect runs only once on mount

  // On the server (or before hydration), 'isMobile' will be 'undefined'.
  // '!!undefined' evaluates to 'false', which is a safe default.
  return !!isMobile;
}