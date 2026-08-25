package com.sarakusetu.backend.authentication.otp.delivery;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!dev")
public class NoOpOtpDelivery implements OtpDelivery {

    @Override
    public void deliver(String phoneNumber, String otp) {
        // A production delivery provider will replace this implementation.
    }
}
