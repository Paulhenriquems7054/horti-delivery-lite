import { useState } from "react";
import { X, DollarSign, Save, Calculator } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptValueModalProps {
  orderId: string;
  customerName: string;
  orderTotal: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReceiptValueModal({
  orderId,
  customerName,
  orderTotal,
  onClose,
  onSuccess,
}: ReceiptValueModalProps) {
  const [receiptTotal, setReceiptTotal] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const receiptValue = parseFloat(receiptTotal.replace(",", "."));

    if (!receiptValue || receiptValue <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setSaving(true);

    try {
      // Atualiza o pedido com o valor total do cupom (sem foto)
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          receipt_total: receiptValue,
          total: receiptValue, // ATUALIZA O TOTAL DO PEDIDO COM O VALOR DO CUPOM
          receipt_uploaded_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      toast.success(`Valor do cupom registrado: R$ ${receiptValue.toFixed(2)} 💰`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erro ao registrar valor:", error);
      toast.error(error.message || "Erro ao registrar valor do cupom");
    } finally {
      setSaving(false);
    }
  };

  const estimatedValue = orderTotal.toFixed(2).replace(".", ",");
  const currentValue = parseFloat(receiptTotal.replace(",", ".")) || 0;
  const difference = currentValue - orderTotal;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Valor do Cupom</h2>
              <p className="text-xs text-muted-foreground">{customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Valor Estimado */}
          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Valor Estimado do Pedido</p>
            <p className="text-2xl font-extrabold text-foreground">
              R$ {estimatedValue}
            </p>
          </div>

          {/* Input do Valor Real */}
          <div>
            <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Valor Total do Cupom Fiscal (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={receiptTotal}
                onChange={(e) => {
                  // Permite apenas números, vírgula e ponto
                  const value = e.target.value.replace(/[^0-9.,]/g, "");
                  setReceiptTotal(value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
                className="w-full h-14 pl-12 pr-4 border-2 border-blue-300 dark:border-blue-700 rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card text-foreground placeholder:text-muted-foreground/50"
                placeholder="0,00"
                autoFocus
              />
            </div>

            {/* Diferença */}
            {currentValue > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Diferença do estimado:</span>
                <span
                  className={`text-sm font-bold ${
                    difference > 0
                      ? "text-red-500"
                      : difference < 0
                      ? "text-emerald-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {difference > 0 ? "+" : ""}
                  R$ {difference.toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}

            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 font-semibold bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
              ⚠️ Este valor substituirá o total do pedido e será usado para pagamento
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-2 border-border text-foreground font-bold hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!receiptTotal || currentValue <= 0 || saving}
              className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Registrar
                </>
              )}
            </button>
          </div>

          {/* Tecla Enter */}
          <p className="text-xs text-center text-muted-foreground">
            Pressione <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">Enter</kbd> para registrar
          </p>
        </div>
      </div>
    </div>
  );
}
