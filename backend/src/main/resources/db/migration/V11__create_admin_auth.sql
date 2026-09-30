CREATE TABLE admins (
    id BIGINT NOT NULL AUTO_INCREMENT,
    phone_number VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT uk_admins_phone_number
        UNIQUE (phone_number)
);

CREATE TABLE admin_otp_verifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    admin_id BIGINT NULL,
    phone_number VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (id),

    INDEX idx_admin_otp_phone_verified_expiry (
        phone_number,
        verified,
        expires_at
    ),

    INDEX idx_admin_otp_admin_id (
        admin_id
    ),

    CONSTRAINT fk_admin_otp_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
);
