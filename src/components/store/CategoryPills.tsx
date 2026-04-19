import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

interface Props {
  storeSlug: string;
  categories: Category[];
  activeSlug?: string;
  showAll?: boolean;
}

export function CategoryPills({ storeSlug, categories, activeSlug, showAll = true }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {showAll && (
        <Link
          to={`/loja/${storeSlug}/produtos`}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border",
            !activeSlug
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-secondary-foreground border-transparent hover:border-primary/30"
          )}
        >
          Todos
        </Link>
      )}
      {categories.map((c) => (
        <Link
          key={c.id}
          to={`/loja/${storeSlug}/categoria/${c.slug}`}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border",
            activeSlug === c.slug
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-secondary-foreground border-transparent hover:border-primary/30"
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
