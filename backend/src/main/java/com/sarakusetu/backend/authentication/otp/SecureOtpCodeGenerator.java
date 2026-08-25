package com.sarakusetu.backend.authentication.otp;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

@Component
public class SecureOtpCodeGenerator implements OtpCodeGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int OTP_BOUND = 1_000_000;

    @Override
    public String generate() {
        return String.format("%06d", RANDOM.nextInt(OTP_BOUND));
    }
}
