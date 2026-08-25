package com.sarakusetu.backend.authentication.otp;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
class OtpAuthenticationConfiguration {

    @Bean
    PasswordEncoder otpPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
