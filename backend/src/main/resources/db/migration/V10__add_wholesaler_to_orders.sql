ALTER TABLE orders
    ADD COLUMN wholesaler_id BIGINT NULL AFTER customer_id;

CREATE INDEX idx_orders_wholesaler_id
    ON orders (wholesaler_id);

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_wholesaler
        FOREIGN KEY (wholesaler_id)
        REFERENCES wholesalers (id);
