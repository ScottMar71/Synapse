import type { ReactElement } from "react";

type AvatarTileProps = {
  seed: number;
  /** Width and height in CSS pixels. Default 36. */
  size?: number;
};

export function AvatarTile({ seed, size = 36 }: AvatarTileProps): ReactElement {
  const hue = (seed * 47) % 360;
  const initial = String.fromCharCode(65 + (Math.abs(seed) % 26));

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `hsl(${hue} 45% 82%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.max(12, size * 0.36)}px`,
        fontWeight: 600,
        color: `hsl(${hue} 35% 25%)`
      }}
    >
      {initial}
    </div>
  );
}
