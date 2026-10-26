"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ToolCard } from "@/components/tool-card";
import { TOOL_GROUPS, TOOL_KINDS, TOOLS, type ToolKind } from "@/lib/tools";

export function ToolCatalogue() {
  const [kind, setKind] = useState<ToolKind>("open");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TOOLS.filter((tool) => tool.kind === kind).filter((tool) =>
      needle === "" ? true : [tool.name, tool.category, tool.description].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [kind, query]);

  const current = TOOL_KINDS.find((item) => item.id === kind)!;

  return (
    <>
      <PageHeader
        eyebrow="Tools"
        title="Approved tools"
        lead="AI and everyday software the team works with, split into open source and closed & paid. Ask IT before adding anything new."
      />

      <div className="card filter-bar">
        <div className="tabs tabs--lg" role="tablist" aria-label="Tool type">
          {TOOL_KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={kind === item.id}
              aria-controls="tool-panel"
              onClick={() => setKind(item.id)}
            >
              {item.label}
              <span className="tabs__count">{TOOLS.filter((tool) => tool.kind === item.id).length}</span>
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr-only">Search tools</span>
          <Search aria-hidden="true" />
          <input type="search" placeholder="Search tools" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      <div id="tool-panel" role="tabpanel" aria-labelledby={`tab-${kind}`}>
        <p className="panel-lead">{current.lead}</p>
        {visible.length === 0 ? <p className="card empty">No tools match “{query}”.</p> : null}
        {TOOL_GROUPS.map((group) => {
          const tools = visible.filter((tool) => tool.group === group.id);
          if (tools.length === 0) return null;
          return (
            <section className="tool-section" key={group.id} aria-labelledby={`group-${group.id}`}>
              <h2 className="section-title" id={`group-${group.id}`}>
                {group.label} <span>{tools.length}</span>
              </h2>
              <div className="grid tools">
                {tools.map((tool) => (
                  <ToolCard
                    key={tool.name}
                    name={tool.name}
                    category={tool.category}
                    description={tool.description}
                    url={tool.url}
                    icon={tool.icon}
                    badge={tool.kind === "open" ? { label: tool.licence, tone: "green" } : { label: tool.licence, tone: "blue" }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
