INSERT INTO products
    (name, description, price, image_url, active, created_at, updated_at)
VALUES
-- Rice & Grains
('Sona Masoori Rice 25 kg', 'Everyday medium-grain rice for retail shops.', 1450.00, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Idli Rice 25 kg', 'Rice suitable for idli and dosa preparation.', 1325.00, 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Basmati Rice 10 kg', 'Long-grain aromatic rice.', 980.00, 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Broken Rice 25 kg', 'Economical broken rice for everyday cooking.', 1120.00, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Atta & Flour
('Wheat Atta 10 kg', 'Whole wheat flour for chapati and roti.', 520.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Maida 5 kg', 'Refined wheat flour for bakery and snacks.', 245.00, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Rava Sooji 5 kg', 'Fine semolina for upma, sweets and snacks.', 285.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Besan 5 kg', 'Gram flour for pakoda, snacks and cooking.', 430.00, 'https://images.unsplash.com/photo-1612257999756-6d0e1b5c8f4e?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Pulses
('Toor Dal 5 kg', 'Premium split pigeon peas for everyday cooking.', 720.00, 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Moong Dal 5 kg', 'Split green gram with a mild flavour.', 590.00, 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Chana Dal 5 kg', 'Split chickpeas for dal and snacks.', 480.00, 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Urad Dal 5 kg', 'Split black gram for dosa, idli and vada.', 610.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Oil & Ghee
('Sunflower Oil 5 L', 'Refined sunflower cooking oil.', 735.00, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Groundnut Oil 5 L', 'Groundnut oil for everyday cooking.', 820.00, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Coconut Oil 1 L', 'Coconut oil for cooking and household use.', 215.00, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Pure Ghee 1 L', 'Rich clarified butter for cooking and sweets.', 620.00, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Biscuits & Snacks
('Glucose Biscuits Family Pack', 'Popular everyday glucose biscuits.', 180.00, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Cream Biscuits Assorted', 'Assorted cream-filled biscuits.', 210.00, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Salt Biscuits Box', 'Crispy salted biscuits for tea-time.', 190.00, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('South Indian Mixture 1 kg', 'Crunchy savoury mixture snack.', 220.00, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Tea & Coffee
('Tea Powder 1 kg', 'Strong everyday tea blend for shops.', 420.00, 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Premium Tea 500 g', 'Aromatic tea blend for daily use.', 260.00, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Instant Coffee 200 g', 'Instant coffee powder for quick preparation.', 310.00, 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Spices
('Turmeric Powder 500 g', 'Bright turmeric powder for everyday cooking.', 145.00, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Chilli Powder 500 g', 'Red chilli powder with balanced heat.', 185.00, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Coriander Powder 500 g', 'Ground coriander for curries and masalas.', 135.00, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Garam Masala 200 g', 'Aromatic blended spice mix.', 120.00, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Beverages
('Mango Drink 1 L', 'Refreshing mango fruit beverage.', 180.00, 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Lime Drink 1 L', 'Refreshing lemon-lime beverage.', 160.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Packaged Drinking Water 1 L', 'Packaged drinking water bottles.', 120.00, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Cleaning
('Detergent Powder 2 kg', 'Laundry detergent for everyday washing.', 285.00, 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Dishwash Bar Pack', 'Grease-cutting dishwashing bars.', 150.00, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Floor Cleaner 1 L', 'Fresh-scent floor cleaning liquid.', 175.00, 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Personal Care
('Bath Soap Family Pack', 'Everyday bathing soap multipack.', 220.00, 'https://images.unsplash.com/photo-1607006344380-b6775a0824f7?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Shampoo 650 ml', 'Everyday family shampoo bottle.', 360.00, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),

-- Stationery
('Ball Pen Blue Pack', 'Blue ball pens for school and office use.', 120.00, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Ruled Notebook Pack', 'Ruled notebooks for students and shops.', 240.00, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Pencil Pack', 'HB pencils for school and office use.', 90.00, 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('Eraser Pack', 'Soft erasers for school stationery.', 60.00, 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80', TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
