const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  pending: { label: "Pendente", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-400" },
  preparing: { label: "Preparando", bg: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  ready_for_delivery: { label: "Pronto para entrega", bg: "bg-cyan-100 text-cyan-800", dot: "bg-cyan-500" },
  delivering: { label: "Na rota", bg: "bg-purple-100 text-purple-800", dot: "bg-purple-500" },
  delivered: { label: "Entregue", bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "bg-muted text-muted-foreground",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg}`}
    >
      <span
        className={`h-2 w-2 rounded-full flex-shrink-0 ${config.dot} ${status === "preparing" ? "animate-pulse-dot" : ""
          }`}
      />
      {config.label}
    </span>
  );
}
