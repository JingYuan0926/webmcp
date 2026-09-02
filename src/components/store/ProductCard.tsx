"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

import { formatUSD, type Product } from "@/lib/catalog";
import { flashed, useStore } from "@/lib/store";

type ProductCardProps = { product: Product; preload?: boolean };

export function ProductCard({ product, preload = false }: ProductCardProps) {
  const { state, api } = useStore();
  const [message, setMessage] = useState("");
  const style = { "--product-hue": product.hue } as CSSProperties;
  const isFlashed = flashed(state.lastFlash, `product:${product.id}`);

  function addOne() {
    const result = api.addToCart(product.id, 1);
    setMessage(result.message);
  }

  return (
    <article className={`product-card${isFlashed ? " is-flashing" : ""}`}>
      <div className="product-art" style={style}>
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          preload={preload}
          sizes="(max-width: 768px) 100vw, (max-width: 1152px) 50vw, 28vw"
          className="product-image"
        />
        <small>{product.tag}</small>
      </div>
      <div className="product-copy">
        <div className="product-heading">
          <h3>{product.name}</h3>
          <p className="price">{formatUSD(product.price)}</p>
        </div>
        <p>{product.blurb}</p>
      </div>
      <button type="button" className="button button-secondary product-action" onClick={addOne}>
        Add to cart
      </button>
      <p className="sr-only" aria-live="polite">
        {message}
      </p>
    </article>
  );
}
