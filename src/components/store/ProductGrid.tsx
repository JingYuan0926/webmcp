import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/store/ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <div className="store-empty" role="status">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="m16.5 16.5 4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <strong>No matching products</strong>
        <span>Try a shorter name or a category such as desk.</span>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} preload={index === 0} />
      ))}
    </div>
  );
}
