package com.sarakusetu.backend.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void returnsActiveProductsFromRepository() {
        Product product = new Product(
                "Milk Chocolate Box",
                "Premium milk chocolate gift box",
                new java.math.BigDecimal("499.00"),
                null
        );

        when(productRepository.findByActiveTrueOrderByNameAsc())
                .thenReturn(List.of(product));

        List<Product> result = productService.getActiveProducts();

        assertThat(result).containsExactly(product);

        verify(productRepository)
                .findByActiveTrueOrderByNameAsc();
    }
}