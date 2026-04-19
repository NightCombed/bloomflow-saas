import { ReactNode } from "react";

export function PlaceholderPage({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="max-w-4xl space-y-3">
      <h1 className="font-serif text-3xl">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
      <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        {children ?? "Em breve. Esta seção será conectada ao Lovable Cloud."}
      </div>
    </div>
  );
}
