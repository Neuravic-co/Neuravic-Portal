/** Options shared by the sign-up form and the PIMS profile. */
export const DEPARTMENTS = ["Engineering", "Data & AI", "Product", "Design", "Automation", "Operations", "Sales", "Finance", "People", "IT"];

export const OFFICES = [
  { id: "dubai", label: "Dubai, UAE" },
  { id: "cairo", label: "Cairo, Egypt" },
  { id: "remote", label: "Remote" },
];

export const officeLabel = (id: string) => OFFICES.find((office) => office.id === id)?.label ?? "Not set";

export const PASSWORD_MIN = 10;
