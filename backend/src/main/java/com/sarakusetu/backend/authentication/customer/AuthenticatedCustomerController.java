package com.sarakusetu.backend.authentication.customer;

import com.sarakusetu.backend.customer.Customer;
import com.sarakusetu.backend.customer.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthenticatedCustomerController {

    private final CustomerRepository customerRepository;

    public AuthenticatedCustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentCustomer(@AuthenticationPrincipal Jwt jwt) {
        try {
            Long customerId = Long.valueOf(jwt.getSubject());
            return customerRepository.findById(customerId)
                    .<ResponseEntity<?>>map(customer -> ResponseEntity.ok(CustomerResponse.from(customer)))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        } catch (NumberFormatException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    public record CustomerResponse(Long id, String phoneNumber) {
        static CustomerResponse from(Customer customer) {
            return new CustomerResponse(customer.getId(), customer.getPhoneNumber());
        }
    }
}
