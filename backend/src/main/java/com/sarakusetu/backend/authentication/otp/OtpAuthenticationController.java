package com.sarakusetu.backend.authentication.otp;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/otp")
public class OtpAuthenticationController {

    private final OtpAuthenticationService otpAuthenticationService;

    public OtpAuthenticationController(OtpAuthenticationService otpAuthenticationService) {
        this.otpAuthenticationService = otpAuthenticationService;
    }

    @PostMapping("/request")
    public ResponseEntity<?> requestOtp(@RequestBody OtpRequest request) {
        if (!isValidPhoneNumber(request.phoneNumber())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("A phone number is required."));
        }

        Instant expiresAt = otpAuthenticationService.requestOtp(request.phoneNumber());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new OtpRequestResponse("OTP requested.", expiresAt));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        if (!isValidPhoneNumber(request.phoneNumber()) || request.otp() == null || !request.otp().matches("\\d{6}")) {
            return ResponseEntity.badRequest().body(new ErrorResponse("A phone number and six-digit OTP are required."));
        }

        return switch (otpAuthenticationService.verifyOtp(request.phoneNumber(), request.otp())) {
            case VERIFIED -> ResponseEntity.ok(new OtpVerificationResponse(true, "OTP verified."));
            case INVALID_OTP -> ResponseEntity.badRequest().body(new ErrorResponse("Invalid OTP."));
            case OTP_UNAVAILABLE -> ResponseEntity.badRequest().body(new ErrorResponse("OTP is expired or unavailable."));
            case ATTEMPTS_EXHAUSTED -> ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ErrorResponse("Maximum verification attempts exceeded."));
        };
    }

    private boolean isValidPhoneNumber(String phoneNumber) {
        return phoneNumber != null && !phoneNumber.isBlank() && phoneNumber.length() <= 20;
    }

    public record OtpRequest(String phoneNumber) {
    }

    public record OtpVerifyRequest(String phoneNumber, String otp) {
    }

    public record OtpRequestResponse(String message, Instant expiresAt) {
    }

    public record OtpVerificationResponse(boolean verified, String message) {
    }

    public record ErrorResponse(String message) {
    }
}
