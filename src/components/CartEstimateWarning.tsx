import { AlertTriangle, Info, Scale } from "lucide-react";

interface Props {
  hasUnitItems: boolean;
  itemsWithoutEstimate?: number;
  variant?: "info" | "warning";
  compact?: boolean;
}

export function CartEstimateWarning({ 
  hasUnitItems, 
  itemsWithoutEstimate = 0,
  variant = "info",
  compact = false 
}: Props) {
  if (!hasUnitItems) return null;

  const Icon = variant === "warning" ? AlertTriangle : Info;
  const bgColor = variant === "warning" 
    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" 
    : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
  const textColor = variant === "warning"
    ? "text-amber-700 dark:text-amber-400"
    : "text-blue-700 dark:text-blue-400";
  const iconColor = variant === "warning"
    ? "text-amber-500"
    : "text-blue-500";

  if (compact) {
    return (
      <p className={`text-xs ${textColor} flex items-center gap-1`}>
        <Scale className="h-3 w-3 flex-shrink-0" />
        <span>Valores estimados • Sujeito a variação após pesagem</span>
      </p>
    );
  }

  return (
    <div className={`rounded-xl border p-3 ${bgColor}`}>
      <div className="flex gap-2.5">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
        <div className="space-y-1">
          <p className={`text-sm font-semibold ${textColor}`}>
            {variant === "warning" ? "Atenção:" : "Estimativa de Preço"}
          </p>
          <p className={`text-xs ${textColor} opacity-90 leading-relaxed`}>
            O valor final pode variar após a pesagem dos produtos. 
            Você receberá o valor exato antes da confirmação do pedido.
          </p>
          {itemsWithoutEstimate > 0 && (
            <p className={`text-xs ${textColor} opacity-75 mt-1`}>
              ⚠️ {itemsWithoutEstimate} item(s) sem estimativa disponível
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
