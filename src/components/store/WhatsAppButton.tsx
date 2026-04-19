import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function buildWhatsAppUrl(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

interface Props {
  phone?: string;
  message?: string;
  variant?: "floating" | "inline";
  label?: string;
  className?: string;
}

export function WhatsAppButton({ phone, message, variant = "inline", label = "Falar no WhatsApp", className }: Props) {
  if (!phone) return null;
  const href = buildWhatsAppUrl(phone, message);

  if (variant === "floating") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cn(
          "fixed bottom-5 right-5 z-40 h-14 w-14 grid place-items-center rounded-full shadow-elegant",
          "bg-[hsl(142_70%_45%)] text-white hover:scale-105 transition-transform",
          className
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    );
  }

  return (
    <Button
      asChild
      variant="outline"
      className={cn("border-[hsl(142_70%_45%)] text-[hsl(142_70%_35%)] hover:bg-[hsl(142_70%_45%)] hover:text-white", className)}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}
