import { useAuth } from "../auth/useAuth";
import ProductCatalog from "./ProductCatalog";

export function Home() {
  const { customer, logout } = useAuth();

  return (
    <main>
      <header>
        <h1>Welcome to SarakuSetu</h1>

        <p>You are logged in.</p>

        {customer && (
          <p>
            Phone: <strong>{customer.phoneNumber}</strong>
          </p>
        )}

        <button type="button" onClick={logout}>
          Logout
        </button>
      </header>

      <ProductCatalog />
    </main>
  );
}