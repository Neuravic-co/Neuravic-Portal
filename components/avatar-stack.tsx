import { initials } from "@/lib/roles";

export function AvatarStack({ names, total }: { names: string[]; total: number }) {
  const extra = total - names.length;
  return (
    <span className="avatars" aria-label={`${total} ${total === 1 ? "member" : "members"}`}>
      {names.map((name) => (
        <span className="avatar avatar--sm" key={name} title={name} aria-hidden="true">
          {initials(name)}
        </span>
      ))}
      {extra > 0 ? (
        <span className="avatar avatar--sm avatar--more" aria-hidden="true">
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
