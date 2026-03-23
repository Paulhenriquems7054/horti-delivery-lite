import type { BasketProduct } from "@/hooks/useActiveBasket";

// Emojis de vegetais/frutas por nome (fallback visual)
const EMOJI_MAP: Record<string, string> = {
  banana: "🍌",
  tomate: "🍅",
  alface: "🥬",
  batata: "🥔",
  cebola: "🧅",
  maçã: "🍎",
  maca: "🍎",
  laranja: "🍊",
  uva: "🍇",
  abacaxi: "🍍",
  cenoura: "🥕",
  beterraba: "🪔",
  limão: "🍋",
  limao: "🍋",
  melão: "🍈",
  melao: "🍈",
  morango: "🍓",
};

function getProductEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const key of Object.keys(EMOJI_MAP)) {
    if (lower.includes(key)) return EMOJI_MAP[key];
  }
  return "🥦";
}

interface Props {
  product: BasketProduct;
}

export function ProductCard({ product }: Props) {
  const emoji = getProductEmoji(product.name);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card border border-border/60 transition-transform active:scale-[0.98]">
      {/* Avatar com emoji ou imagem */}
      <div className="flex-shrink-0 h-14 w-14 rounded-xl gradient-card flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl" role="img" aria-label={product.name}>
            {emoji}
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground truncate">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {product.quantity}x •{" "}
          <span className="text-primary font-semibold">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
        </p>
      </div>

      {/* Badge de qtd */}
      <span className="flex-shrink-0 h-7 w-7 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center">
        {product.quantity}
      </span>
    </div>
  );
}
