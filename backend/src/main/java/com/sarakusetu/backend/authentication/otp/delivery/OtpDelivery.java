package com.sarakusetu.backend.authentication.otp.delivery;

public interface OtpDelivery {

    void deliver(String phoneNumber, String otp);
}
