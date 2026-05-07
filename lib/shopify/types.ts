export type Money = { amount: string; currencyCode: string };

export type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type ProductOption = { name: string; values: string[] };

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: Money;
  selectedOptions: { name: string; value: string }[];
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  availableForSale: boolean;
  options: ProductOption[];
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  images: ProductImage[];
  variants: ProductVariant[];
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: { name: string; value: string }[];
    product: {
      handle: string;
      title: string;
      featuredImage: { url: string; altText: string | null } | null;
    };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: CartLine[];
};
