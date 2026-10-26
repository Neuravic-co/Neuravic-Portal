export type Role = "admin" | "manager" | "member";

export const ROLES: { id: Role; label: string; text: string }[] = [
  { id: "admin", label: "Admin", text: "Manages roles, people and every team." },
  { id: "manager", label: "Manager", text: "Creates teams and manages the teams they lead." },
  { id: "member", label: "Member", text: "Sees teams and the people directory." },
];

export const ROLE_TONE: Record<Role, string> = {
  admin: "badge badge--blue",
  manager: "badge badge--green",
  member: "badge",
};

export function asRole(value: string): Role {
  return value === "admin" || value === "manager" ? value : "member";
}

export const roleLabel = (value: string) => ROLES.find((role) => role.id === asRole(value))!.label;

export const canCreateTeams = (role: string) => asRole(role) !== "member";

/** Admins manage every team; managers only the teams they lead. */
export function canManageTeam(user: { id: number; role: string }, team: { lead_id: number | null }) {
  const role = asRole(user.role);
  return role === "admin" || (role === "manager" && team.lead_id === user.id);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
