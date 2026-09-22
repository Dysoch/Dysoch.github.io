import type { CSSProperties } from 'react'

const PATHS: Record<string, string> = {
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  sword: '<path d="M5 19L18 6"/><path d="M15 3l3 3-2 2-3-3z"/>',
  slash: '<path d="M4 6l14 14M18 6L4 20"/>',
  axe: '<path d="M6 4l4 4-6 6 2 2 6-6 4 4 4-10z"/>',
  lightning: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
  burst: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/>',
  meteor: '<circle cx="12" cy="12" r="9"/><path d="M12 3l1.5 5L18 9l-4 3 1 5-3-3-3 3 1-5-4-3 4.5-1z"/>',
  shield: '<path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z"/>',
  wand: '<path d="M5 19l9-9"/><path d="M14 10l1.5-1.5L17 10l-1.5 1.5z"/><path d="M17 3v3M15.5 4.5h3"/>',
  sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>',
  clover: '<circle cx="9" cy="9" r="3"/><circle cx="15" cy="9" r="3"/><circle cx="9" cy="15" r="3"/><circle cx="15" cy="15" r="3"/><path d="M12 12v6"/>',
  backpack: '<rect x="6" y="8" width="12" height="12" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9 12h6"/>',
  map: '<path d="M9 4l6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v14M15 6v14"/>',
  crown: '<path d="M4 18h16l-1-8-4 3-3-6-3 6-4-3z"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  heart: '<path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.3 1.2 4 2.3C10.7 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20z"/>',
  flame: '<path d="M12 2c1 3-3 4-3 7a3 3 0 0 0 6 0c0-1-1-1.5-1-2.5 1 1 2 2.5 2 4.5a4 4 0 0 1-8 0c0-4 3-5 4-9z"/>',
  armor: '<path d="M12 3l7 3-1 4-2-1v9l-4 2-4-2v-9l-2 1-1-4z"/>',
  robe: '<path d="M9 3h6l1 4-2 1 2 11H8l2-11-2-1z"/>',
  amulet: '<circle cx="12" cy="15" r="4"/><path d="M9 4h6l-1 5h-4z"/>',
  ring: '<circle cx="12" cy="14" r="5"/><path d="M9 9l3-6 3 6"/>',
  boots: '<path d="M8 4h4v9l4 2v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3z"/>',
  gloves: '<path d="M7 10V6a2 2 0 0 1 4 0v3m0-3a2 2 0 0 1 4 0v3m0 0V7a2 2 0 0 1 4 0v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-3z"/>',
  cleave: '<path d="M4 12L14 4l3 3-8 8z"/><path d="M20 12L10 20l-3-3 8-8z"/>',
  chain: '<circle cx="8" cy="8" r="3.5"/><circle cx="16" cy="16" r="3.5"/><path d="M10.5 10.5l3 3"/>',
}

export type IconName = keyof typeof PATHS

interface IconProps {
  name: string
  size?: number
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 18, className, style }: IconProps) {
  const inner = PATHS[name] ?? PATHS.sparkles
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
}
