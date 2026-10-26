import { ExternalLink } from "lucide-react";
import type { SimpleIcon } from "simple-icons";
import { ToolLogo } from "@/components/tool-logo";

export type ToolCardProps = {
  name: string;
  category: string;
  description: string;
  url: string;
  icon?: SimpleIcon;
  badge: { label: string; tone: "green" | "blue" | "amber" };
};

export function ToolCard({ name, category, description, url, icon, badge }: ToolCardProps) {
  return (
    <article className="card tool">
      <div className="tool__head">
        <ToolLogo name={name} icon={icon} />
        <div>
          <h3 className="tool__name">{name}</h3>
          <p className="tool__category">{category}</p>
        </div>
      </div>
      <p className="tool__text">{description}</p>
      <div className="tool__foot">
        <span className={`badge badge--plain badge--${badge.tone}`}>{badge.label}</span>
        <a className="tool__link" href={url} target="_blank" rel="noopener noreferrer">
          Website <ExternalLink aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
}
