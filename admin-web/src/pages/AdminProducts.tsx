import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  createProduct,
  deleteProductImage,
  resolveProductImageUrl,
  updateProduct,
  uploadProductImage,
} from "../products/productApi";
import type { AdminProduct } from "../products/types";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

type ProductFilter = "ALL" | "ACTIVE" | "INACTIVE";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  active: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  active: true,
};

export default function AdminProducts({
  products,
  isLoading,
  onRefresh,
}: {
  products: AdminProduct[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<ProductFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((product) => product.active).length,
      inactive: products.filter((product) => !product.active).length,
    }),
    [products],
  );

  const visibleProducts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ACTIVE" && product.active) ||
        (filter === "INACTIVE" && !product.active);
      const matchesSearch = `${product.id} ${product.name}`
        .toLowerCase()
        .includes(normalizedSearchTerm);

      return matchesFilter && matchesSearch;
    });
  }, [filter, products, searchTerm]);

  function openCreate() {
    setEditingProduct(null);
    setIsFormOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setSelectedProduct(null);
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Products</h2>
            <p>Manage catalog products, retailer prices, photos, and availability.</p>
          </div>

          <div className="product-header-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={onRefresh}
              disabled={isLoading}
            >
              ↻ Refresh
            </button>
            <button type="button" className="primary-button" onClick={openCreate}>
              + Add Product
            </button>
          </div>
        </div>

        <div className="product-tools">
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search product ID or name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="product-filter-group" aria-label="Product status filters">
            <button
              type="button"
              className={filter === "ALL" ? "product-filter active" : "product-filter"}
              onClick={() => setFilter("ALL")}
            >
              All {counts.all}
            </button>
            <button
              type="button"
              className={filter === "ACTIVE" ? "product-filter active" : "product-filter"}
              onClick={() => setFilter("ACTIVE")}
            >
              Active {counts.active}
            </button>
            <button
              type="button"
              className={filter === "INACTIVE" ? "product-filter active" : "product-filter"}
              onClick={() => setFilter("INACTIVE")}
            >
              Inactive {counts.inactive}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading products…</div>
        ) : visibleProducts.length === 0 ? (
          <div className="empty-state">
            {products.length === 0
              ? "No products found."
              : "No products match the current search or filter."}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="product-operations-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Product</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => {
                  const imageUrl = resolveProductImageUrl(product.imageUrl);

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="product-table-image">
                          {imageUrl ? (
                            <img src={imageUrl} alt="" />
                          ) : (
                            <span>{product.name.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                        <span className="table-secondary">ID #{product.id}</span>
                      </td>
                      <td className="product-description">
                        {product.description ?? "—"}
                      </td>
                      <td><strong>{money.format(product.price)}</strong></td>
                      <td>
                        <span className={`status-badge ${product.active ? "product-active" : "product-inactive"}`}>
                          {product.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{formatDate(product.updatedAt)}</td>
                      <td>
                        <div className="product-row-actions">
                          <button
                            type="button"
                            className="ghost-button order-view-button"
                            onClick={() => setSelectedProduct(product)}
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            className="primary-button order-view-button"
                            onClick={() => openEdit(product)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedProduct !== null && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={() => openEdit(selectedProduct)}
        />
      )}

      {isFormOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setIsFormOpen(false)}
          onSaved={() => {
            setIsFormOpen(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

function ProductDetails({
  product,
  onClose,
  onEdit,
}: {
  product: AdminProduct;
  onClose: () => void;
  onEdit: () => void;
}) {
  const imageUrl = resolveProductImageUrl(product.imageUrl);

  return (
    <div className="order-details-backdrop" role="presentation" onClick={onClose}>
      <section
        className="order-details product-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <h2 id="product-details-title">{product.name}</h2>
            <p>Product ID #{product.id}</p>
          </div>
          <div className="product-header-actions">
            <button type="button" className="ghost-button" onClick={onEdit}>Edit</button>
            <button type="button" className="ghost-button" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="order-details-content">
          {imageUrl && (
            <div className="product-details-image">
              <img src={imageUrl} alt={product.name} />
            </div>
          )}

          <dl className="order-details-summary">
            <div><dt>Retail price</dt><dd>{money.format(product.price)}</dd></div>
            <div><dt>Status</dt><dd>{product.active ? "Active" : "Inactive"}</dd></div>
            <div><dt>Created</dt><dd>{formatDate(product.createdAt)}</dd></div>
            <div><dt>Last updated</dt><dd>{formatDate(product.updatedAt)}</dd></div>
          </dl>

          <h3 className="details-section-title">Description</h3>
          <p className="product-details-description">
            {product.description ?? "No description available."}
          </p>
        </div>
      </section>
    </div>
  );
}

function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = product !== null;
  const [form, setForm] = useState<ProductFormState>(() =>
    product
      ? {
          name: product.name,
          description: product.description ?? "",
          price: product.price.toFixed(2),
          active: product.active,
        }
      : emptyForm,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    product ? resolveProductImageUrl(product.imageUrl) : null,
  );
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function setField<K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(file: File | undefined) {
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Product images must be 5 MB or smaller.");
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveExistingImage(false);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) {
      setError("Product name is required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid retail price.");
      return;
    }

    try {
      setIsSaving(true);

      const input = {
        name,
        description: form.description.trim() || null,
        price,
        active: form.active,
      };

      const savedProduct = isEditing
        ? await updateProduct(product.id, input)
        : await createProduct(input);

      if (selectedFile) {
        await uploadProductImage(savedProduct.id, selectedFile);
      } else if (isEditing && removeExistingImage && product.imageUrl) {
        await deleteProductImage(savedProduct.id);
      }

      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save product.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const hasImage = Boolean(previewUrl);

  return (
    <div className="order-details-backdrop" role="presentation" onClick={onClose}>
      <section
        className="order-details product-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <h2 id="product-form-title">
              {isEditing ? "Edit Product" : "Add Product"}
            </h2>
            <p>
              {isEditing
                ? "Update the retailer-facing product information."
                : "Add a product to the retailer catalog."}
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose} disabled={isSaving}>
            Close
          </button>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}

          <div className="product-image-upload">
            <div className="product-image-preview">
              {hasImage ? (
                <img src={previewUrl ?? undefined} alt="Product preview" />
              ) : (
                <span>📷</span>
              )}
            </div>

            <div className="product-image-upload-copy">
              <strong>Product photo</strong>
              <p>Use a clear product image. JPG, PNG or WebP, maximum 5 MB.</p>
              <div className="product-image-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                >
                  {hasImage ? "Change photo" : "Upload photo"}
                </button>
                {hasImage && (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      if (previewUrl?.startsWith("blob:")) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setRemoveExistingImage(true);
                    }}
                    disabled={isSaving}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="visually-hidden"
                onChange={(event) => {
                  handleFileChange(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
          </div>

          <label className="product-form-field">
            <span>Product name</span>
            <input
              value={form.name}
              maxLength={255}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="e.g. Tomato Paste"
              required
              disabled={isSaving}
            />
          </label>

          <label className="product-form-field">
            <span>Description</span>
            <textarea
              value={form.description}
              maxLength={5000}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Short description shown to retailers"
              rows={3}
              disabled={isSaving}
            />
          </label>

          <label className="product-form-field">
            <span>Retail price</span>
            <div className="price-input">
              <span>₹</span>
              <input
                type="number"
                min="0"
                max="99999999.99"
                step="0.01"
                inputMode="decimal"
                value={form.price}
                onChange={(event) => setField("price", event.target.value)}
                placeholder="0.00"
                required
                disabled={isSaving}
              />
            </div>
            <small>This is the price displayed to retailers.</small>
          </label>

          <label className="product-form-toggle">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setField("active", event.target.checked)}
              disabled={isSaving}
            />
            <span>
              <strong>Active product</strong>
              <small>Active products appear in the retailer catalog.</small>
            </span>
          </label>

          <div className="product-form-actions">
            <button type="button" className="ghost-button" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving
                ? "Saving…"
                : isEditing
                  ? "Save Changes"
                  : "Add Product"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
