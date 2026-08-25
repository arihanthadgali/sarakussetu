package com.sarakusetu.backend.authentication.otp;

import com.sarakusetu.backend.authentication.customer.CustomerAuthenticationService;
import com.sarakusetu.backend.authentication.otp.delivery.OtpDelivery;
import com.sarakusetu.backend.customer.Customer;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpAuthenticationService {

    private static final Duration OTP_VALIDITY = Duration.ofMinutes(5);
    private static final int MAX_ATTEMPTS = 5;

    private final CustomerAuthenticationService customerAuthenticationService;
    private final OtpVerificationRepository otpVerificationRepository;
    private final OtpCodeGenerator otpCodeGenerator;
    private final PasswordEncoder otpPasswordEncoder;
    private final OtpDelivery otpDelivery;

    public OtpAuthenticationService(
            CustomerAuthenticationService customerAuthenticationService,
            OtpVerificationRepository otpVerificationRepository,
            OtpCodeGenerator otpCodeGenerator,
            PasswordEncoder otpPasswordEncoder,
            OtpDelivery otpDelivery) {
        this.customerAuthenticationService = customerAuthenticationService;
        this.otpVerificationRepository = otpVerificationRepository;
        this.otpCodeGenerator = otpCodeGenerator;
        this.otpPasswordEncoder = otpPasswordEncoder;
        this.otpDelivery = otpDelivery;
    }

    @Transactional
    public Instant requestOtp(String phoneNumber) {
        Customer customer = customerAuthenticationService.findOrCreateCustomer(phoneNumber);
        Instant now = Instant.now();
        otpVerificationRepository.expireActiveOtpsForCustomer(customer.getId(), now);

        String otp = otpCodeGenerator.generate();
        Instant expiresAt = now.plus(OTP_VALIDITY);
        otpVerificationRepository.save(new OtpVerification(
                customer, phoneNumber, otpPasswordEncoder.encode(otp), expiresAt));
        otpDelivery.deliver(phoneNumber, otp);
        return expiresAt;
    }

    @Transactional
    public VerificationResult verifyOtp(String phoneNumber, String otp) {
        Optional<OtpVerification> verification = otpVerificationRepository
                .findTopByPhoneNumberAndVerifiedFalseAndExpiresAtAfterOrderByCreatedAtDesc(phoneNumber, Instant.now());

        if (verification.isEmpty()) {
            return VerificationResult.OTP_UNAVAILABLE;
        }

        OtpVerification activeOtp = verification.get();
        if (activeOtp.getAttemptCount() >= MAX_ATTEMPTS) {
            return VerificationResult.ATTEMPTS_EXHAUSTED;
        }

        if (!otpPasswordEncoder.matches(otp, activeOtp.getOtpHash())) {
            activeOtp.recordFailedAttempt();
            return activeOtp.getAttemptCount() >= MAX_ATTEMPTS
                    ? VerificationResult.ATTEMPTS_EXHAUSTED
                    : VerificationResult.INVALID_OTP;
        }

        activeOtp.markVerified();
        return VerificationResult.VERIFIED;
    }

    public enum VerificationResult {
        VERIFIED,
        INVALID_OTP,
        OTP_UNAVAILABLE,
        ATTEMPTS_EXHAUSTED
    }
}
