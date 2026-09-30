CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    admin_id BIGINT NULL,
    wholesaler_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (id),
    INDEX idx_notifications_admin_created_at (admin_id, created_at),
    INDEX idx_notifications_wholesaler_created_at (wholesaler_id, created_at),
    CONSTRAINT fk_notifications_admin
        FOREIGN KEY (admin_id) REFERENCES admins(id),
    CONSTRAINT fk_notifications_wholesaler
        FOREIGN KEY (wholesaler_id) REFERENCES wholesalers(id)
);
