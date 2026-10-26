export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <p className="page-head__eyebrow">{eyebrow}</p>
        <h1 className="page-head__title">{title}</h1>
        <p className="page-head__lead">{lead}</p>
      </div>
      {actions ? <div className="page-head__actions">{actions}</div> : null}
    </header>
  );
}
