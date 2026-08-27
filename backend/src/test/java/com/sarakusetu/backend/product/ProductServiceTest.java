package com.sarakusetu.backend.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

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
                new BigDecimal("499.00"),
                null
        );

        when(productRepository.findByActiveTrueOrderByNameAsc())
                .thenReturn(List.of(product));

        List<Product> result = productService.getActiveProducts();

        assertThat(result).containsExactly(product);

        verify(productRepository)
                .findByActiveTrueOrderByNameAsc();
    }

    @Test
    void returnsActiveProductById() {
        Product product = new Product(
                "Milk Chocolate Box",
                "Premium milk chocolate gift box",
                new BigDecimal("499.00"),
                null
        );

        when(productRepository.findByIdAndActiveTrue(1L))
                .thenReturn(Optional.of(product));

        Product result = productService.getActiveProduct(1L);

        assertThat(result).isSameAs(product);

        verify(productRepository)
                .findByIdAndActiveTrue(1L);
    }

    @Test
    void throwsWhenActiveProductDoesNotExist() {
        when(productRepository.findByIdAndActiveTrue(999L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getActiveProduct(999L))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessage("Product not found: 999");
    }
}