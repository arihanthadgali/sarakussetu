package com.sarakusetu.backend.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:customer-repository;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.flyway.url=jdbc:h2:mem:customer-repository;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.flyway.user=sa",
        "spring.flyway.password="
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CustomerRepositoryTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Test
    void savesAndFindsCustomerByUniquePhoneNumber() {
        Customer customer = customerRepository.saveAndFlush(new Customer("+919876543210"));

        assertThat(customer.getId()).isNotNull();
        assertThat(customer.getCreatedAt()).isNotNull();
        assertThat(customer.getUpdatedAt()).isNotNull();
        assertThat(customerRepository.findByPhoneNumber("+919876543210"))
                .containsSame(customer);
    }

    @Test
    void rejectsDuplicatePhoneNumbers() {
        customerRepository.saveAndFlush(new Customer("+919876543210"));

        assertThatThrownBy(() -> customerRepository.saveAndFlush(new Customer("+919876543210")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
