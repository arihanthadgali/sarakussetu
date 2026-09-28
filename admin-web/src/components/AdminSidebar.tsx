export type AdminPage =
  | "dashboard"
  | "orders"
  | "retailers"
  | "wholesalers"
  | "products";

interface AdminSidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onLogout: () => void;
}

const items: Array<{
  page: AdminPage;
  label: string;
  icon: string;
  enabled: boolean;
}> = [
  {
    page: "dashboard",
    label: "Dashboard",
    icon: "⌂",
    enabled: true,
  },
  {
    page: "orders",
    label: "Orders",
    icon: "▤",
    enabled: true,
  },
  {
    page: "retailers",
    label: "Retailers",
    icon: "♙",
    enabled: false,
  },
  {
    page: "wholesalers",
    label: "Wholesalers",
    icon: "▥",
    enabled: true,
  },
  {
    page: "products",
    label: "Products",
    icon: "▦",
    enabled: false,
  },
];

export default function AdminSidebar({
  activePage,
  onNavigate,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">S</div>

        <div>
          <strong>SARAKUSETU</strong>
          <span>ADMIN</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.page}
            type="button"
            className={`sidebar-item ${
              activePage === item.page ? "active" : ""
            } ${!item.enabled ? "disabled" : ""}`}
            disabled={!item.enabled}
            onClick={() => onNavigate(item.page)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="logout-button"
        onClick={onLogout}
      >
        <span>↪</span>
        Logout
      </button>
    </aside>
  );
}