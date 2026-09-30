CREATE TABLE wholesaler_inventory (
    id BIGINT NOT NULL AUTO_INCREMENT,
    wholesaler_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    stock_quantity INT UNSIGNED NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_wholesaler_inventory_wholesaler_product (wholesaler_id, product_id),
    KEY idx_wholesaler_inventory_product_id (product_id),
    CONSTRAINT fk_wholesaler_inventory_wholesaler
        FOREIGN KEY (wholesaler_id) REFERENCES wholesalers (id),
    CONSTRAINT fk_wholesaler_inventory_product
        FOREIGN KEY (product_id) REFERENCES products (id)
);
