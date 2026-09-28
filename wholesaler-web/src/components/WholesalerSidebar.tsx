export type WholesalerPage = "dashboard" | "orders" | "history";

interface WholesalerSidebarProps {
  activePage: WholesalerPage;
  onNavigate: (page: WholesalerPage) => void;
  onLogout: () => void;
}

interface NavigationItem {
  id: WholesalerPage;
  label: string;
  icon: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    id: "orders",
    label: "Orders",
    icon: "▣",
  },
  {
    id: "history",
    label: "Order History",
    icon: "◷",
  },
];

const FUTURE_ITEMS = [
  {
    label: "Products (Catalog)",
    icon: "▤",
  },
  {
    label: "Retailers",
    icon: "♙",
  },
  {
    label: "Notifications",
    icon: "♧",
  },
  {
    label: "Profile",
    icon: "⚙",
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
            onClick={() => onNavigate(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}

        {FUTURE_ITEMS.map((item) => (
          <button
            key={item.label}
            className="nav-item nav-item-disabled"
            type="button"
            disabled
            title="Coming soon"
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