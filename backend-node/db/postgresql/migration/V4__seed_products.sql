INSERT INTO products (
    name,
    description,
    price,
    image_url,
    active,
    created_at,
    updated_at
) VALUES
      (
          'Milk Chocolate Box',
          'Premium milk chocolate gift box.',
          499.00,
          'https://example.com/products/milk-chocolate-box.jpg',
          TRUE,
          CURRENT_TIMESTAMP(6),
          CURRENT_TIMESTAMP(6)
      ),
      (
          'Dark Chocolate Box',
          'Premium dark chocolate gift box.',
          599.00,
          'https://example.com/products/dark-chocolate-box.jpg',
          TRUE,
          CURRENT_TIMESTAMP(6),
          CURRENT_TIMESTAMP(6)
      ),
      (
          'Assorted Chocolate Box',
          'Assorted premium chocolate gift box.',
          699.00,
          'https://example.com/products/assorted-chocolate-box.jpg',
          TRUE,
          CURRENT_TIMESTAMP(6),
          CURRENT_TIMESTAMP(6)
      );