"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ToolCard } from "@/components/tool-card";
import { AVAILABILITY, IT_CATEGORIES, IT_TOOLS, type Availability } from "@/lib/it-tools";

type Filter = Availability | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open source" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
];

export function ItToolkit() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return IT_TOOLS.filter((tool) => filter === "all" || tool.availability === filter).filter((tool) =>
      needle === "" ? true : [tool.name, tool.description].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [filter, query]);

  return (
    <>
      <PageHeader
        eyebrow="IT & support"
        title="IT toolkit"
        lead="The tools IT uses to diagnose and fix problems: remote help, hardware checks, networks, recovery and security."
      />

      <div className="card filter-bar">
        <div className="tabs" role="group" aria-label="Filter by availability">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label}
              <span className="tabs__count">
                {item.id === "all" ? IT_TOOLS.length : IT_TOOLS.filter((tool) => tool.availability === item.id).length}
              </span>
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr-only">Search IT tools</span>
          <Search aria-hidden="true" />
          <input type="search" placeholder="Search IT tools" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      {visible.length === 0 ? <p className="card empty">No tools match these filters.</p> : null}
      {IT_CATEGORIES.map((category) => {
        const tools = visible.filter((tool) => tool.category === category.id);
        if (tools.length === 0) return null;
        return (
          <section className="tool-section" key={category.id} aria-labelledby={`it-${category.id}`}>
            <h2 className="section-title" id={`it-${category.id}`}>
              {category.label} <span>{tools.length}</span>
            </h2>
            <p className="panel-lead">{category.text}</p>
            <div className="grid tools">
              {tools.map((tool) => (
                <ToolCard
                  key={tool.name}
                  name={tool.name}
                  category={AVAILABILITY[tool.availability].label}
                  description={tool.description}
                  url={tool.url}
                  icon={tool.icon}
                  badge={{ label: tool.note, tone: AVAILABILITY[tool.availability].tone }}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
