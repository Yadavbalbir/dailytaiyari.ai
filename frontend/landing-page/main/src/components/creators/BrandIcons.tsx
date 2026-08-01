import type { SVGProps } from "react";

/**
 * Minimal brand glyphs as inline SVGs. This project's lucide-react version does
 * not ship brand icons, so we provide recognizable platform marks here. Each
 * accepts standard SVG props (className, etc.) and uses currentColor.
 */
type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export function Youtube({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}

export function Instagram({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function Linkedin({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.27V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export function Telegram({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M21.94 4.3 18.6 20.02c-.25 1.11-.9 1.38-1.82.86l-5.03-3.7-2.43 2.34c-.27.27-.5.5-1.01.5l.36-5.12L16.9 7.4c.4-.36-.09-.56-.63-.2L6.75 13.1l-4.96-1.55c-1.08-.34-1.1-1.08.23-1.6L20.53 2.7c.9-.34 1.68.2 1.4 1.6Z" />
    </svg>
  );
}

export function Whatsapp({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.9c0 1.76.46 3.45 1.34 4.95L2 22l5.3-1.39a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7C17.18 3.03 14.68 2 12.04 2Zm5.8 14.15c-.24.68-1.4 1.3-1.94 1.34-.5.05-.97.24-3.26-.68-2.75-1.08-4.5-3.87-4.64-4.05-.14-.18-1.12-1.49-1.12-2.84s.71-2.02.96-2.29c.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.55.79 1.9.86 2.04.07.14.12.3.02.48-.09.18-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.28-.12.55.16.27.72 1.18 1.54 1.92 1.06.94 1.95 1.24 2.22 1.38.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.34Z" />
    </svg>
  );
}

export function Facebook({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}
