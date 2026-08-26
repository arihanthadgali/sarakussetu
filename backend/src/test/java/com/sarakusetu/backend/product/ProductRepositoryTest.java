package com.sarakusetu.backend.product;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:product-repository;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.flyway.url=jdbc:h2:mem:product-repository;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.flyway.user=sa",
        "spring.flyway.password="
})

@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Test
    void shouldSaveAndFindProduct() {
        Product product = new Product(
                "Milk Chocolate Box",
                "Premium milk chocolate gift box",
                new BigDecimal("499.00"),
                "https://example.com/milk-chocolate-box.jpg"
        );

        Product savedProduct = productRepository.save(product);

        assertThat(savedProduct.getId()).isNotNull();
        assertThat(savedProduct.getName()).isEqualTo("Milk Chocolate Box");
        assertThat(savedProduct.getPrice()).isEqualByComparingTo("499.00");
        assertThat(savedProduct.isActive()).isTrue();
        assertThat(savedProduct.getCreatedAt()).isNotNull();
        assertThat(savedProduct.getUpdatedAt()).isNotNull();
    }

    @Test
    void shouldFindOnlyActiveProductsOrderedByName() {
        Product darkChocolate = new Product(
                "Dark Chocolate Box",
                "Premium dark chocolate gift box",
                new BigDecimal("599.00"),
                null
        );

        Product milkChocolate = new Product(
                "Milk Chocolate Box",
                "Premium milk chocolate gift box",
                new BigDecimal("499.00"),
                null
        );

        productRepository.saveAll(List.of(darkChocolate, milkChocolate));

        List<Product> products =
                productRepository.findByActiveTrueOrderByNameAsc();

        assertThat(products)
                .extracting(Product::getName)
                .containsExactly(
                        "Dark Chocolate Box",
                        "Milk Chocolate Box"
                );
    }
}