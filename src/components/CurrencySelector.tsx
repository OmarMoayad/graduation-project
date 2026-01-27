import { useCurrency, CURRENCY_CONFIG, Currency } from "@/hooks/use-currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CurrencySelectorProps {
  className?: string;
  showLabel?: boolean;
}

const CurrencySelector = ({ className, showLabel = false }: CurrencySelectorProps) => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={className}>
      {showLabel && (
        <label className="text-sm text-muted-foreground mb-1 block">العملة</label>
      )}
      <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            {CURRENCY_CONFIG[currency].symbol} {CURRENCY_CONFIG[currency].nameAr}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(CURRENCY_CONFIG) as Currency[]).map((curr) => (
            <SelectItem key={curr} value={curr}>
              {CURRENCY_CONFIG[curr].symbol} {CURRENCY_CONFIG[curr].nameAr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CurrencySelector;
