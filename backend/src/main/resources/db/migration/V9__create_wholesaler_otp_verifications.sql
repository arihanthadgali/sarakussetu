CREATE TABLE wholesaler_otp_verifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    wholesaler_id BIGINT NULL,
    phone_number VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (id),

    INDEX idx_wholesaler_otp_phone_verified_expiry (
        phone_number,
        verified,
        expires_at
    ),

    INDEX idx_wholesaler_otp_wholesaler_id (
        wholesaler_id
    ),

    CONSTRAINT fk_wholesaler_otp_wholesaler
        FOREIGN KEY (wholesaler_id)
        REFERENCES wholesalers(id)
);
