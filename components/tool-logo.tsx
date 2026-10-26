import type { SimpleIcon } from "simple-icons";

/** Light brand colours (Hugging Face yellow, for example) sit on a dark tile so they stay visible. */
function isLight(hex: string) {
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
}

function monogram(name: string) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2);
}

export function ToolLogo({ name, icon }: { name: string; icon?: SimpleIcon }) {
  if (!icon) {
    return (
      <span className="logo logo--mono" aria-hidden="true">
        {monogram(name)}
      </span>
    );
  }
  return (
    <span className={`logo${isLight(icon.hex) ? " logo--dark" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" role="img" focusable="false">
        <path d={icon.path} fill={`#${icon.hex}`} />
      </svg>
    </span>
  );
}
