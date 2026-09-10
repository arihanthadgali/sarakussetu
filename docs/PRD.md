# SarakuSetu Product Requirements Document

## 1. Product Overview

**Product name:** SarakuSetu

**Product vision:** SarakuSetu is a single platform that helps retailers source products from wholesalers and manage the journey from catalog discovery to fulfilled wholesale orders.

**Problem statement:** Retailers need a simple way to discover wholesale products and place repeatable business orders. Wholesalers need an efficient way to present their catalog and manage retailer demand. Today, the repository describes SarakuSetu as a bridge between wholesalers and retailers; the detailed operational workflows remain to be finalized.

**Proposed solution:** Provide role-appropriate retailer, wholesaler, and administrator interfaces backed by one shared SarakuSetu platform, catalog, account model, and business rules.

**Business context:** The current implementation is retailer-oriented: customers can sign in by phone OTP, browse an active product catalog, and the cart data model/add-item backend foundation is in progress. Wholesaler, administrator, order, payment, and notification capabilities are future product requirements.

> **Documentation note:** `docs/PROJECT_OVERVIEW.md` was not present when this PRD was prepared. Current/implemented statements below are based on the repository code and existing README files.

## 2. Goals

- Make wholesale product discovery and purchasing simpler for retailers.
- Give wholesalers a structured way to manage catalog, availability, and incoming orders.
- Maintain one coherent platform and backend for all roles and interfaces.
- Start with a secure, maintainable, cost-conscious implementation that can evolve without unnecessary infrastructure.

## 3. Non-Goals

Initially, SarakuSetu is not intended to be:

- A consumer retail marketplace.
- A standalone accounting, ERP, warehouse-management, or logistics system.
- A separate business system for each mobile or web interface.
- A provider-specific payment product before payment requirements and provider selection are finalized.
- A full multi-tenant marketplace model until wholesaler and catalog ownership rules are defined.

## 4. Target Users

### Retailer

**Needs:** find suitable wholesale products, build orders quickly, understand pricing and availability, and track purchases.

**Pain points:** fragmented ordering, limited catalog visibility, and poor visibility into order status.

**Goals:** log in securely, browse products, maintain a cart, place orders, and review order progress and history.

**Expected capabilities:** phone-based account access; product browsing; cart management; order placement, payment, tracking, and profile management as the product evolves.

### Wholesaler

**Needs:** maintain a reliable catalog, control pricing and availability, receive and fulfill retailer orders, and understand demand.

**Pain points:** manual order intake, inconsistent product information, and limited operational reporting.

**Goals:** manage product and business information, fulfil orders efficiently, and grow retailer relationships.

**Expected capabilities:** wholesaler authentication, catalog/pricing/inventory management, order operations, retailer management, reports, and notifications. These are future requirements, not currently implemented capabilities.

### Admin

**Needs:** operate the platform safely, support businesses, manage access, and oversee platform activity.

**Pain points:** fragmented operational tools and insufficient visibility into account, catalog, order, and payment activity.

**Goals:** administer the platform consistently and enforce policy.

**Expected capabilities:** account management, catalog oversight, platform configuration, reports, payment/order oversight, and role-based access controls. These are future requirements.

## 5. Product Ecosystem

The following interfaces are intended to operate on the same SarakuSetu platform/backend. They must share the relevant identity, authorization, catalog, order, and business rules rather than becoming independent business systems.

### Retailer Mobile App

Purpose: allow retailers to authenticate, browse a wholesale catalog, manage a cart, place and track orders, and manage their account.

### Wholesaler Mobile App

Purpose: support operational wholesaler workflows such as order alerts, fulfillment updates, and selected catalog/inventory actions.

### Wholesaler Web Application

Purpose: provide broader catalog, pricing, inventory, retailer, order, reporting, and business-profile management.

### Admin Web Application

Purpose: provide platform administration, access management, oversight, configuration, and reporting.

## 6. Authentication & Account Management

### Current / implemented

- Retailer/customer authentication uses a phone number and six-digit OTP.
- OTPs are securely generated, stored as BCrypt hashes, expire after five minutes, and permit five verification attempts.
- Successful verification issues an HS256 JWT with the customer ID as its subject and a configurable access-token TTL (default one hour).
- Authenticated requests use `Authorization: Bearer <token>`; current customer information can be restored through `/api/auth/me`.
- Logout is client-side token removal.

### Future requirements / open decisions

- Identify and authorize retailer, wholesaler, and admin roles.
- Define registration, verification, suspension, deactivation, recovery, and account-lifecycle policies for every role.
- Define session renewal, revocation, multi-device behavior, and audit requirements.
- Confirm whether phone authentication remains the sole sign-in method for all roles.

## 7. Retailer Requirements

The intended retailer journey is:

**Registration/login → browse catalog → view product → add to cart → manage cart → place order → payment → order tracking → order history → account/profile**

| Journey stage | Status | Requirement |
| --- | --- | --- |
| Registration/login | Current | Authenticate a customer through phone OTP and establish an authenticated session. |
| Browse catalog | Current | Show active products ordered by name, with name, description, price, and optional image URL. |
| View product | Proposed | Provide a product detail experience; the current API exposes catalog list data only. |
| Add to cart | In progress | Persist one customer-owned cart and add an active product with a positive quantity. |
| Manage cart | Future | View cart, change quantities, remove items, and show validation/availability outcomes. |
| Place order | Future | Create an order from a validated cart. |
| Payment | Future | Offer a finalized payment flow and status handling. |
| Order tracking/history | Future | Display current order status and past orders. |
| Account/profile | Current + future | Current customer identity is available; broader profile/account management is future work. |

## 8. Wholesaler Requirements

### MVP requirements (proposed)

- Authenticate and identify a wholesaler business user.
- Create and maintain a product catalog with product information, pricing, availability, and images.
- Receive and manage retailer orders through defined fulfillment states.
- Maintain core business information visible to retailers where applicable.

### Post-MVP / future requirements

- Inventory controls and low-stock workflows.
- Retailer relationship management.
- Sales, fulfillment, and product reports.
- Operational notifications.
- Bulk catalog updates, richer pricing rules, and team/member permissions.

None of these wholesaler capabilities are currently implemented in the repository.

## 9. Admin Requirements

Future administrator requirements include:

- Platform administration and configuration.
- Retailer and wholesaler management.
- Product/catalog oversight.
- Order and payment oversight.
- Reports and operational monitoring.
- Role/access control and audit support.

The precise administrator workflows, permissions, and approval responsibilities are open decisions.

## 10. Catalog & Product Requirements

### Current / implemented

- Products have a name, optional description, decimal wholesale price, optional image URL, active flag, and timestamps.
- Retailers can retrieve active products only; results are ordered alphabetically by name.
- Product catalog access requires an authenticated customer.

### Future requirements

- Categories and category navigation.
- Product detail views and richer product information.
- Product image management and image-delivery policy.
- Inventory and availability management.
- Product visibility rules and wholesaler-specific catalog ownership.
- Pricing rules, including any retailer-specific, volume, or promotional pricing.

## 11. Cart Requirements

### Current / implemented or in progress

- A cart is owned by one authenticated customer; one persistent cart per customer is represented in the data model.
- A cart item references one cart and one product.
- A cart cannot contain duplicate rows for the same product; `(cart_id, product_id)` is unique.
- The add-item backend flow requires authentication, accepts only a positive integer quantity, and accepts only an existing active product.
- Adding a product already in the cart increases its quantity.
- Cart data is persisted in `carts` and `cart_items`.

### Future requirements

- Retrieve the authenticated customer’s cart.
- Update item quantity and remove an item.
- Define cart ordering and empty-cart behavior.
- Revalidate product availability and pricing before checkout.
- Define price display behavior: the current cart does not store a price snapshot, so the catalog product price is the current source until order requirements define snapshot behavior.
- Define handling when a previously added product becomes inactive or unavailable.

## 12. Order Requirements

Orders are future requirements. The intended lifecycle should be finalized before implementation. A proposed baseline is:

`DRAFT → PLACED → CONFIRMED → PROCESSING → READY_FOR_DISPATCH → DISPATCHED → DELIVERED`

Possible terminal/exception states: `CANCELLED`, `REJECTED`, `PAYMENT_FAILED`, and `RETURNED` (if returns are in scope).

Open decisions include who may transition each state, cancellation windows, partial fulfillment, substitutions, delivery responsibility, and immutable order-price snapshots.

## 13. Payment Requirements

Payments are future requirements. SarakuSetu must define:

- Supported payment methods and payment provider(s).
- Payment initiation, confirmation, failure, refund, and reconciliation behavior.
- Relationship between payment status and order state.
- Security, audit, and customer-support requirements.

No payment provider or payment workflow is implemented or selected in the repository.

## 14. Notifications

### Current / implemented

- OTP delivery is abstracted; development logs OTPs and non-development delivery is currently a no-op pending a provider.

### Future requirements

- OTP delivery through a production-capable channel.
- Retailer confirmation when an order is placed and when order status changes.
- Payment success, failure, and refund events.
- Wholesaler notifications for new or changed orders.
- Inventory/availability and operational alerts where approved.

## 15. Business Rules

### Confirmed rules

- A customer phone number is unique.
- OTPs are six digits, expire after five minutes, and have a maximum of five verification attempts.
- Only active products are visible through the current catalog API and may be added to the cart.
- Cart quantities must be positive integers.
- A customer has at most one cart, and a cart has at most one item row per product.
- Backend authorization is the security boundary; clients cannot provide another customer’s identity for protected operations.

### Proposed / open rules

- Maximum cart-item quantity and cart size.
- Availability/inventory reservation policy.
- Product price behavior in cart and price snapshot policy at order placement.
- Wholesaler ownership, catalog visibility, and pricing rules.
- Order cancellation, fulfillment, delivery, return, and refund rules.

## 16. Roles & Permissions

| Capability | Retailer | Wholesaler | Admin |
| --- | --- | --- | --- |
| Authenticate to own account | Required | Proposed | Proposed |
| Browse retailer-visible catalog | Current | Proposed | Proposed oversight |
| Manage own cart | In progress | No | Oversight only, proposed |
| Place/track own orders | Future | No | Oversight only, proposed |
| Manage products, pricing, inventory | No | Future | Oversight, future |
| Manage fulfillment orders | No | Future | Oversight, future |
| Manage platform accounts/access | No | Limited business-team scope, proposed | Future |
| Configure platform/report across businesses | No | No | Future |

Backend authorization must remain the security boundary. Interface visibility alone must not grant access.

## 17. Non-Functional Requirements

- **Security:** protect credentials and OTPs; enforce server-side authorization; validate input; avoid exposing secrets or internal errors; retain auditable security decisions as requirements mature.
- **Performance:** use efficient indexed queries and avoid per-item query patterns; establish concrete latency targets before scale commitments.
- **Scalability:** keep modules and data relationships clear; scale only when measured demand requires it.
- **Reliability:** provide health checks, safe database operations, graceful failure handling, and recoverable operational procedures.
- **Maintainability:** retain modular routes/domain logic, automated tests, clear migrations, and environment-based configuration.
- **Observability:** add structured logging, metrics, alerts, and traceability progressively; avoid logging OTPs or sensitive production data.
- **Cost optimization:** begin with a simple, cost-efficient architecture; avoid premature queues, microservices, caches, or infrastructure layers without demonstrated need.

## 18. MVP Scope

### MVP

- Retailer phone OTP authentication and authenticated session restoration.
- Active product catalog browsing.
- Customer-owned cart: add, retrieve, update, and remove items once the corresponding S03 stories are completed.
- A minimal order-placement and fulfillment workflow, payment approach, and wholesaler operations remain proposed MVP scope pending product decisions.

### Post-MVP

- Rich catalog navigation, categories, images, availability, and inventory workflows.
- Wholesaler web/mobile operations, retailer management, and reporting.
- Order history, advanced tracking, and notification workflows.

### Future

- Administrative web operations, advanced role controls, sophisticated pricing, integrations, and analytics.

## 19. Product Roadmap

Existing repository sprint structure:

- **S00:** project setup.
- **S01:** customer authentication foundation, phone OTP, customer JWT session, and frontend authentication experience.
- **S02:** product catalog foundation, seed data, catalog API, and catalog frontend.
- **S03:** cart.
  - **S03-01:** cart data-model/backend foundation.
  - **S03-02:** add product to cart.
  - **S03-03:** get cart (planned).
  - **S03-04:** update quantity (planned).
  - **S03-05:** remove item (planned).
- **S04:** Node.js backend migration and Spring retirement.

Order, payment, wholesaler, administrator, and notification sprint identifiers are not present in the repository and should not be assigned until planning is approved.

## 20. Success Metrics

The following are **proposed metrics**; no targets are currently defined in the repository.

- Active retailers and active wholesalers.
- Retailer authentication success rate.
- Catalog engagement: catalog views, product views, and add-to-cart rate.
- Carts created and cart-to-order conversion.
- Orders placed, order completion rate, and cancellation rate.
- Repeat-order rate and average order value.
- Order fulfillment and delivery cycle time.
- Payment success/failure rate once payments exist.

## 21. Open Questions / Decisions

- What business model connects retailers, wholesalers, and catalog ownership?
- Which user roles and account approval flows are required at launch?
- What is the final MVP boundary for orders, fulfillment, delivery, and payments?
- Which payment methods/provider(s) will be supported?
- How are stock, availability, product deactivation, and substitutions handled?
- When is a price fixed: in catalog, cart, checkout, or order creation?
- What are cart maximums and quantity limits?
- Which notifications are mandatory and through which channels?
- What reporting, compliance, tax, invoice, and audit requirements apply?
- What are the role-specific mobile versus web priorities?

## 22. Product Principles

- Keep workflows simple for real retailer and wholesaler operations.
- Prefer maintainable, explicit product rules over hidden complexity.
- Be cost-conscious and add infrastructure only when justified.
- Treat security and backend authorization as non-negotiable foundations.
- Scale through clear modules and measured demand, not premature complexity.
- Use role-based access controls as the product expands.
- Build one coherent SarakuSetu platform, not disconnected applications with divergent business rules.
