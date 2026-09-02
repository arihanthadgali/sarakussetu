import { useEffect, useMemo, useState } from "react";
import { addToCart } from "../cart/cartApi";
import { getProducts } from "../product/productApi";
import type { Product } from "../product/types";
import "./Home.css";

type HomeProps = { onBrowseProducts: () => void; onOpenCart: () => void; onOpenOrders: () => void };

export function Home({ onBrowseProducts, onOpenCart, onOpenOrders }: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { getProducts().then(setProducts).catch(() => setMessage("Products could not be loaded right now.")); }, []);
  const visibleProducts = useMemo(() => products.filter((product) => `${product.name} ${product.description ?? ""}`.toLowerCase().includes(searchTerm.trim().toLowerCase())), [products, searchTerm]);
  async function handleAdd(product: Product) { setAddingId(product.id); setMessage(""); try { const item = await addToCart(product.id); setMessage(`${product.name} added to cart · Qty ${item.quantity}`); } catch { setMessage("Unable to add this product. Please try again."); } finally { setAddingId(null); } }

  return <section className="storefront-page"><div className="storefront-container">
    <div className="storefront-search-row"><label className="storefront-search" htmlFor="home-search"><span aria-hidden="true">⌕</span><input id="home-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products for your shop" /></label><button type="button" className="home-orders-link" onClick={onOpenOrders}>My orders</button><button type="button" className="home-cart-link" onClick={onOpenCart}>Cart <span>→</span></button></div>
    <nav className="storefront-categories" aria-label="Product navigation"><button type="button" className="category-chip active"><b>▦</b> All products</button><button type="button" className="category-chip" onClick={onBrowseProducts}><b>⌕</b> Browse catalogue</button></nav>
    <div className="storefront-strip"><div><span>ORDER FOR YOUR SHOP</span><strong>Browse wholesale products with clear prices.</strong></div><button type="button" onClick={onBrowseProducts}>View catalogue →</button></div>
    <div className="storefront-heading"><div><span>SHOP SUPPLIES</span><h1>Stock your angadi.</h1><p>Simple wholesale ordering for your everyday shop needs.</p></div>{products.length > 0 && <small>{products.length} products available</small>}</div>
    {message && <div className="storefront-message" role="status">{message}</div>}
    {products.length === 0 && !message ? <div className="storefront-empty">Loading products for your shop…</div> : <><div className="storefront-section-title"><h2>Available products</h2><button type="button" onClick={onBrowseProducts}>See all →</button></div><div className="storefront-grid">{visibleProducts.slice(0, 8).map((product) => <article className="storefront-card" key={product.id}><div className="storefront-image">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>S</span>}</div><div className="storefront-card-body"><h3>{product.name}</h3><p>{product.description || "Product details available on order."}</p><div><strong>₹{product.price.toFixed(2)}</strong><button type="button" onClick={() => handleAdd(product)} disabled={addingId === product.id}>{addingId === product.id ? "Adding…" : "Add"}</button></div></div></article>)}</div>{visibleProducts.length === 0 && <div className="storefront-empty">No products match “{searchTerm}”.</div>}</>}
  </div></section>;
}
