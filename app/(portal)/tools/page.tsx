import type { Metadata } from "next";
import { ToolCatalogue } from "./tool-catalogue";

export const metadata: Metadata = { title: "Tools" };

export default function ToolsPage() {
  return <ToolCatalogue />;
}
