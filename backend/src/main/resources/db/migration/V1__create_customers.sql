CREATE TABLE customers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_customers_phone_number UNIQUE (phone_number)
);
