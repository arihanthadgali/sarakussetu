package com.sarakusetu.backend.authentication.otp;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByPhoneNumberAndVerifiedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phoneNumber, Instant now);

    @Modifying
    @Query("update OtpVerification otp set otp.expiresAt = :now "
            + "where otp.customer.id = :customerId and otp.verified = false and otp.expiresAt > :now")
    int expireActiveOtpsForCustomer(@Param("customerId") Long customerId, @Param("now") Instant now);
}
