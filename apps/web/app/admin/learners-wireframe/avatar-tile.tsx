import type { ReactElement } from "react";

type AvatarTileProps = {
  seed: number;
  className?: string;
};

export function AvatarTile({ seed, className }: AvatarTileProps): ReactElement {
  const hue = (seed * 47) % 360;
  const initial = String.fromCharCode(65 + (Math.abs(seed) % 26));

  return (
    <div
      aria-hidden
      className={className}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: `hsl(${hue} 45% 82%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.875rem",
        fontWeight: 600,
        color: `hsl(${hue} 35% 25%)`
      }}
    >
      {initial}
    </div>
  );
}
