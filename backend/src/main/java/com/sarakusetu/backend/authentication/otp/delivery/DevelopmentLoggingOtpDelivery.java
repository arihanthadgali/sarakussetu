package com.sarakusetu.backend.authentication.otp.delivery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevelopmentLoggingOtpDelivery implements OtpDelivery {

    private static final Logger LOGGER = LoggerFactory.getLogger(DevelopmentLoggingOtpDelivery.class);

    @Override
    public void deliver(String phoneNumber, String otp) {
        LOGGER.info("Development OTP for {}: {}", phoneNumber, otp);
    }
}
