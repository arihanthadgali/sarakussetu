export type WholesalerPage =
  | "dashboard"
  | "orders"
  | "history"
  | "products"
  | "inventory"
  | "retailers"
  | "notifications"
  | "settings";

interface WholesalerSidebarProps {
  activePage: WholesalerPage;
  onNavigate: (page: WholesalerPage) => void;
  onLogout: () => void;
}

interface NavigationItem {
  id: WholesalerPage;
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
    icon: "▣",
    isAvailable: true,
  },
  {
    id: "history",
    label: "Order History",
    icon: "◷",
    isAvailable: true,
  },
  {
    id: "products",
    label: "Products",
    icon: "▤",
    isAvailable: true,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "▦",
    isAvailable: true,
  },
  {
    id: "retailers",
    label: "Retailers",
    icon: "♙",
    isAvailable: true,
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

function WholesalerSidebar({
  activePage,
  onNavigate,
  onLogout,
}: WholesalerSidebarProps) {
  return (
    <aside className="dashboard-sidebar">
      <div className="brand">
        <div className="brand-mark">S</div>

        <div>
          <strong>SARAKUSETU</strong>
          <span>WHOLESALER</span>
        </div>
      </div>

      <nav
        className="sidebar-nav"
        aria-label="Wholesaler navigation"
      >
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            className={
              activePage === item.id
                ? "nav-item active"
                : "nav-item"
            }
            type="button"
            disabled={!item.isAvailable}
            title={item.isAvailable ? undefined : "Coming soon"}
            onClick={() => onNavigate(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <button
        className="logout-button"
        type="button"
        onClick={onLogout}
      >
        <span aria-hidden="true">↪</span>
        Logout
      </button>
    </aside>
  );
}

export default WholesalerSidebar;
