package com.sarakusetu.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.sarakusetu.backend.authentication.jwt.JwtProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class SarakuSetuApplication {

    public static void main(String[] args) {
        SpringApplication.run(SarakuSetuApplication.class, args);
    }
}