export type AdminPage =
  | "dashboard"
  | "orders"
  | "retailers"
  | "wholesalers"
  | "products"
  | "delivery"
  | "operations"
  | "payments"
  | "reports"
  | "notifications"
  | "settings";

interface AdminSidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onLogout: () => void;
}

interface NavigationItem {
  id: AdminPage;
  label: string;
  icon: string;
  isAvailable: boolean;
}

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "⌂",
    isAvailable: true,
  },
  {
    id: "orders",
    label: "Orders",
    icon: "▤",
    isAvailable: true,
  },
  {
    id: "retailers",
    label: "Retailers",
    icon: "♙",
    isAvailable: false,
  },
  {
    id: "wholesalers",
    label: "Wholesalers",
    icon: "▥",
    isAvailable: true,
  },
  {
    id: "products",
    label: "Products",
    icon: "▦",
    isAvailable: false,
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: "▣",
    isAvailable: false,
  },
  {
    id: "operations",
    label: "Operations",
    icon: "◫",
    isAvailable: false,
  },
  {
    id: "payments",
    label: "Payments",
    icon: "₹",
    isAvailable: false,
  },
  {
    id: "reports",
    label: "Reports",
    icon: "◷",
    isAvailable: false,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "♧",
    isAvailable: false,
  },
  {
    id: "settings",
    label: "Settings",
    icon: "⚙",
    isAvailable: false,
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
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-item ${
              activePage === item.id ? "active" : ""
            } ${!item.isAvailable ? "disabled" : ""}`}
            disabled={!item.isAvailable}
            title={item.isAvailable ? undefined : "Coming soon"}
            onClick={() => onNavigate(item.id)}
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
