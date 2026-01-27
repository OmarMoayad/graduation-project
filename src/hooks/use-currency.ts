import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "ILS" | "USD" | "JOD";

export const CURRENCY_CONFIG: Record<Currency, { symbol: string; name: string; nameAr: string; rate: number }> = {
  ILS: { symbol: "₪", name: "Israeli Shekel", nameAr: "شيقل إسرائيلي", rate: 1 },
  USD: { symbol: "$", name: "US Dollar", nameAr: "دولار أمريكي", rate: 0.27 },
  JOD: { symbol: "د.أ", name: "Jordanian Dinar", nameAr: "دينار أردني", rate: 0.19 },
};

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number) => string;
  convertPrice: (price: number) => number;
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "ILS",

      setCurrency: (currency) => {
        set({ currency });
      },

      formatPrice: (price: number) => {
        const { currency } = get();
        const config = CURRENCY_CONFIG[currency];
        const convertedPrice = price * config.rate;
        return `${config.symbol}${convertedPrice.toFixed(2)}`;
      },

      convertPrice: (price: number) => {
        const { currency } = get();
        const config = CURRENCY_CONFIG[currency];
        return price * config.rate;
      },
    }),
    {
      name: "shop-currency",
    }
  )
);
