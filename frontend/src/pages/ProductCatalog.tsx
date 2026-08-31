import { useEffect, useState } from "react";

import { addToCart } from "../cart/cartApi";
import { apiRequest } from "../api/client";
import "./ProductCatalog.css";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
};

export default function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [cartMessage, setCartMessage] = useState<{
  productName: string;
  quantity: number;
} | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await apiRequest<Product[]>("/api/products", {
          authenticated: true,
        });

        setProducts(response);
      } catch {
        setError("Unable to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

  async function handleAddToCart(productId: number) {
  setAddingProductId(productId);
  setCartMessage(null);

  try {
    const cartItem = await addToCart(productId);

    const addedProduct = products.find(
      (product) => product.id === productId,
    );

    setCartMessage({
      productName: addedProduct?.name ?? cartItem.product.name,
      quantity: cartItem.quantity,
    });
  } catch {
    setCartMessage(null);
  } finally {
    setAddingProductId(null);
  }
}
  if (isLoading) {
    return (
      <section className="catalog-page">
        <div className="catalog-container">
          <div className="catalog-header">
            <div>
              <span className="catalog-kicker">PRODUCT CATALOG</span>
              <h1>Products</h1>
              <p>Browse products available for your shop.</p>
            </div>
          </div>

          <div className="catalog-status">Loading products...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="catalog-page">
        <div className="catalog-container">
          <div className="catalog-header">
            <div>
              <span className="catalog-kicker">PRODUCT CATALOG</span>
              <h1>Products</h1>
              <p>Browse products available for your shop.</p>
            </div>
          </div>

          <div className="catalog-status catalog-error">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <div className="catalog-container">
        <div className="catalog-header">
          <div>
            <span className="catalog-kicker">PRODUCT CATALOG</span>
            <h1>Products</h1>
            <p>Browse products available from your wholesale network.</p>
          </div>

          <div className="product-count">{products.length} products</div>
        </div>

        {cartMessage && (
          <div className="catalog-cart-message">{cartMessage && (
  <div className="cart-message">
    <strong>
      ✓ {cartMessage.productName} added to cart
    </strong>
    <span>
      Quantity: {cartMessage.quantity}
    </span>
  </div>
)}</div>
        )}

        {products.length === 0 ? (
          <div className="catalog-status">
            No products are currently available.
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  <div className="product-image-placeholder">S</div>
                </div>

                <div className="product-content">
                  <div>
                    <h2>{product.name}</h2>
                    <p>{product.description}</p>
                  </div>

                  <div className="product-footer">
                    <strong>₹{product.price.toFixed(2)}</strong>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addingProductId === product.id}
                    >
                      {addingProductId === product.id
                        ? "Adding..."
                        : "Add to order"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}