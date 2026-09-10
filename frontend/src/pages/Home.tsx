import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { addToCart } from "../cart/cartApi";
import { addGuestCartItem } from "../cart/guestCart";
import { getProducts } from "../product/productApi";
import type { Product } from "../product/types";
import "./Home.css";

type HomeProps = {
  onBrowseProducts: () => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
};

type Category = {
  name: string;
  icon: string;
  keywords: string[];
};

const categories: Category[] = [
  { name: "All", icon: "▦", keywords: [] },
  { name: "Rice & Grains", icon: "🌾", keywords: ["rice", "grain", "poha", "rava", "wheat"] },
  { name: "Atta & Flour", icon: "🥣", keywords: ["atta", "flour", "maida", "besan"] },
  { name: "Pulses", icon: "🫘", keywords: ["dal", "pulse", "moong", "toor", "urad", "chana", "masoor"] },
  { name: "Oil & Ghee", icon: "🫗", keywords: ["oil", "ghee"] },
  { name: "Biscuits & Snacks", icon: "🍪", keywords: ["biscuit", "snack", "parle", "good day", "bourbon", "chips"] },
  { name: "Tea & Coffee", icon: "☕", keywords: ["tea", "coffee", "bru", "nescafe", "red label"] },
  { name: "Spices", icon: "🌶️", keywords: ["spice", "chilli", "turmeric", "masala", "pepper"] },
  { name: "Beverages", icon: "🥤", keywords: ["drink", "juice", "beverage", "cola"] },
  { name: "Cleaning", icon: "🧹", keywords: ["clean", "detergent", "dishwash", "washing"] },
  { name: "Personal Care", icon: "🧴", keywords: ["soap", "shampoo", "toothpaste", "personal"] },
  { name: "Stationery", icon: "📚", keywords: ["pen", "pencil", "notebook", "paper", "eraser", "stationery"] },
];

function matchesCategory(product: Product, category: Category) {
  if (category.keywords.length === 0) return true;

  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();

  return category.keywords.some((keyword) => text.includes(keyword));
}

function ProductCard({
  product,
  addingId,
  onAdd,
}: {
  product: Product;
  addingId: number | null;
  onAdd: (product: Product) => void;
}) {
  return (
    <article className="storefront-card">
      <div className="storefront-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span>S</span>
        )}
      </div>

      <div className="storefront-card-body">
        <h3>{product.name}</h3>
        <p>{product.description || "Wholesale product for your shop."}</p>

        <div>
          <strong>₹{product.price.toFixed(2)}</strong>

          <button
            type="button"
            onClick={() => onAdd(product)}
            disabled={addingId === product.id}
          >
            {addingId === product.id ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function Home({
  onBrowseProducts,
  onOpenCart,
  onOpenOrders,
}: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [addingId, setAddingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setMessage("Products could not be loaded right now."));
  }, []);

  const selectedCategoryData =
    categories.find((category) => category.name === selectedCategory) ??
    categories[0];

  const visibleProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const text =
        `${product.name} ${product.description ?? ""}`.toLowerCase();

      const matchesSearch = !search || text.includes(search);
      const matchesSelectedCategory = matchesCategory(
        product,
        selectedCategoryData,
      );

      return matchesSearch && matchesSelectedCategory;
    });
  }, [products, searchTerm, selectedCategoryData]);

  async function handleAdd(product: Product) {
  setAddingId(product.id);
  setMessage("");

  try {
    if (isAuthenticated) {
      const item = await addToCart(product.id);

      setMessage(
        `${product.name} added to cart · Qty ${item.quantity}`,
      );
    } else {
      const items = addGuestCartItem(product);

      const addedItem = items.find(
        (item) => item.product.id === product.id,
      );

      setMessage(
        `${product.name} added to cart · Qty ${addedItem?.quantity ?? 1}`,
      );
    }
  } catch {
    setMessage("Unable to add this product. Please try again.");
  } finally {
    setAddingId(null);
  }
}

  const sections = categories
    .filter((category) => category.name !== "All")
    .map((category) => ({
      ...category,
      products: products.filter((product) => matchesCategory(product, category)),
    }))
    .filter((section) => section.products.length > 0);

  return (
    <section className="storefront-page">
      <div className="storefront-container">
        <div className="storefront-search-row">
          <label className="storefront-search" htmlFor="home-search">
            <span aria-hidden="true">⌕</span>

            <input
              id="home-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products for your shop"
            />
          </label>

          <button
            type="button"
            className="home-orders-link"
            onClick={onOpenOrders}
          >
            My orders
          </button>

          <button
            type="button"
            className="home-cart-link"
            onClick={onOpenCart}
          >
            Cart <span>→</span>
          </button>
        </div>

        <nav className="storefront-categories" aria-label="Product categories">
          {categories.map((category) => (
            <button
              type="button"
              key={category.name}
              className={`category-chip ${
                selectedCategory === category.name ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              <b>{category.icon}</b>
              <span>{category.name}</span>
            </button>
          ))}
        </nav>

        <div className="storefront-strip">
          <div>
            <span>ORDER FOR YOUR SHOP</span>
            <strong>Wholesale essentials, delivered to your doorstep.</strong>
          </div>

          <button type="button" onClick={onBrowseProducts}>
            View catalogue →
          </button>
        </div>

        <div className="storefront-heading">
          <div>
            <span>SHOP SUPPLIES</span>
            <h1>Stock your angadi.</h1>
            <p>
              Everyday grocery and stationery essentials for your shop.
            </p>
          </div>

          {products.length > 0 && (
            <small>{products.length} products available</small>
          )}
        </div>

        {message && (
          <div className="storefront-message" role="status">
            {message}
          </div>
        )}

        {products.length === 0 && !message ? (
          <div className="storefront-empty">
            Loading products for your shop…
          </div>
        ) : selectedCategory !== "All" || searchTerm ? (
          <>
            <div className="storefront-section-title">
              <div>
                <span>CATALOGUE</span>
                <h2>{selectedCategory}</h2>
              </div>

              <button type="button" onClick={onBrowseProducts}>
                See all →
              </button>
            </div>

            {visibleProducts.length > 0 ? (
              <div className="storefront-grid">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addingId={addingId}
                    onAdd={handleAdd}
                  />
                ))}
              </div>
            ) : (
              <div className="storefront-empty">
                No products match “{searchTerm}”.
              </div>
            )}
          </>
        ) : (
          <>
            <div className="storefront-section-title">
              <div>
                <span>BESTSELLERS</span>
                <h2>Popular products</h2>
              </div>

              <button type="button" onClick={onBrowseProducts}>
                See all →
              </button>
            </div>

            <div className="storefront-grid">
              {products.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addingId={addingId}
                  onAdd={handleAdd}
                />
              ))}
            </div>

            {sections.map((section) => (
              <section className="home-product-section" key={section.name}>
                <div className="storefront-section-title">
                  <div>
                    <span>{section.icon} CATEGORY</span>
                    <h2>{section.name}</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory(section.name)}
                  >
                    See all →
                  </button>
                </div>

                <div className="storefront-grid">
                  {section.products.slice(0, 4).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      addingId={addingId}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </section>
  );
}