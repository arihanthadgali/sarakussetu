CREATE TABLE otp_verifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_otp_verifications_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id)
);

CREATE INDEX idx_otp_verifications_customer_id ON otp_verifications (customer_id);

CREATE INDEX idx_otp_verifications_active_expiry
    ON otp_verifications (phone_number, verified, expires_at);
