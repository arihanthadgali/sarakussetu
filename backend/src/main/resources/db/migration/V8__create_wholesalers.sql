CREATE TABLE wholesalers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    phone_number VARCHAR(20) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_wholesalers_phone_number (phone_number)
);
