import React, { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem } from "@/hooks/usePOS";

interface CartItemRowProps {
  item: CartItem;
  onUpdate: (id: string, u: Partial<CartItem>) => void;
  onRemove: (id: string) => void;
}

export const CartItemRow = memo(function CartItemRow({ item, onUpdate, onRemove }: CartItemRowProps) {
  const lineTotal = item.unit_price * item.quantity - item.discount;
  const allowDecimal = item.product.allow_decimal_quantity ?? false;
  const step = allowDecimal ? 0.01 : 1;
  const minQty = allowDecimal ? 0.01 : 1;
  const decrementBy = allowDecimal ? 0.5 : 1;

  const handleDecrement = useCallback(() => {
    onUpdate(item.product.id, { quantity: Math.max(minQty, +(item.quantity - decrementBy).toFixed(3)) });
  }, [item.product.id, item.quantity, onUpdate, minQty, decrementBy]);

  const handleIncrement = useCallback(() => {
    onUpdate(item.product.id, { quantity: +(item.quantity + (allowDecimal ? 0.5 : 1)).toFixed(3) });
  }, [item.product.id, item.quantity, onUpdate, allowDecimal]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (Number.isNaN(v)) return;
    onUpdate(item.product.id, { quantity: Math.max(minQty, v) });
  }, [item.product.id, onUpdate, minQty]);

  const handleRemove = useCallback(() => {
    onRemove(item.product.id);
  }, [item.product.id, onRemove]);

  return (
    <div className="flex items-start gap-2 p-2 rounded border bg-background">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.product.name}</p>
        <p className="text-xs text-muted-foreground">@ KES {Number(item.unit_price).toLocaleString()}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={handleDecrement}>
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          className="w-14 h-7 text-center text-sm p-0"
          type="number"
          min={minQty}
          step={step}
          value={item.quantity}
          onChange={handleQuantityChange}
        />
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={handleIncrement}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="text-right min-w-[70px]">
        <p className="font-semibold text-sm">KES {lineTotal.toLocaleString()}</p>
      </div>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleRemove}>
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
});

CartItemRow.displayName = "CartItemRow";
