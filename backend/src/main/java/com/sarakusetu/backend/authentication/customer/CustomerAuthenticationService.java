package com.sarakusetu.backend.authentication.customer;

import com.sarakusetu.backend.customer.Customer;
import com.sarakusetu.backend.customer.CustomerRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerAuthenticationService {

    private final CustomerRepository customerRepository;

    public CustomerAuthenticationService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Optional<Customer> findCustomerByPhoneNumber(String phoneNumber) {
        return customerRepository.findByPhoneNumber(phoneNumber);
    }

    @Transactional
    public Customer findOrCreateCustomer(String phoneNumber) {
        return customerRepository.findByPhoneNumber(phoneNumber)
                .orElseGet(() -> customerRepository.save(new Customer(phoneNumber)));
    }
}
