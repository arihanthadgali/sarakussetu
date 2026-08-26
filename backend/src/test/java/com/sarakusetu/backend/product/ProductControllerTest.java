package com.sarakusetu.backend.product;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @Test
    void returnsActiveProducts() throws Exception {
        Product product = new Product(
                "Milk Chocolate Box",
                "Premium milk chocolate gift box",
                new BigDecimal("499.00"),
                "https://example.com/milk.jpg"
        );

        when(productService.getActiveProducts())
                .thenReturn(List.of(product));

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Milk Chocolate Box"))
                .andExpect(jsonPath("$[0].description")
                        .value("Premium milk chocolate gift box"))
                .andExpect(jsonPath("$[0].price").value(499.00))
                .andExpect(jsonPath("$[0].imageUrl")
                        .value("https://example.com/milk.jpg"));
    }

    @Test
    void returnsEmptyListWhenNoActiveProducts() throws Exception {
        when(productService.getActiveProducts())
                .thenReturn(List.of());

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }
}