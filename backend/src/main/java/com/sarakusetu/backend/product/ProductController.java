package com.sarakusetu.backend.product;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> getActiveProducts() {
        return productService.getActiveProducts()
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    public record ProductResponse(
            Long id,
            String name,
            String description,
            java.math.BigDecimal price,
            String imageUrl
    ) {
        static ProductResponse from(Product product) {
            return new ProductResponse(
                    product.getId(),
                    product.getName(),
                    product.getDescription(),
                    product.getPrice(),
                    product.getImageUrl()
            );
        }
    }
}