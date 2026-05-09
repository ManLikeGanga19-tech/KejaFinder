-- KejaFinder development seed data
-- Run with: psql $DATABASE_URL -f api/db/seed.sql
-- or via the helper:    npm --workspace api run db:seed
--
-- Idempotent: ON CONFLICT DO NOTHING on natural keys.

BEGIN;

-- ── Demo agent user + agent profile ──────────────────────────────────────
INSERT INTO users (id, firebase_uid, name, email, phone, role, email_verified, phone_verified, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'seed_agent_uid_1', 'Premium Realty Agent', 'agent@premium.co.ke', '+254700100100', 'agent', true, true, true),
  ('22222222-2222-2222-2222-222222222222', 'seed_agent_uid_2', 'Skyline Properties Agent', 'agent@skyline.co.ke', '+254700200200', 'agent', true, true, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO agents (id, user_id, display_name, company_name, bio, kyc_status, kyc_verified_at, is_active)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Premium Realty', 'Premium Realty Ltd', 'Curated apartments in upmarket Nairobi suburbs.', 'approved', NOW(), true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Skyline Properties', 'Skyline Properties Group', 'Modern penthouses and townhouses across Westlands.', 'approved', NOW(), true)
ON CONFLICT (user_id) DO NOTHING;

-- ── Areas ────────────────────────────────────────────────────────────────
INSERT INTO areas (id, slug, name, city, tags, area_score, safety_rating, safety_label, cost_tier, rent_range_min, rent_range_max, mobility_score, walkability_score, connectivity_mins, connectivity_route, investment_growth_pct, rental_yield_pct, demand_score, is_active)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'kilimani', 'Kilimani', 'Nairobi', ARRAY['Modern', 'Family-friendly', 'Lively'], 8.4, 82, 'Very safe', '$$$', 50000, 150000, 8.5, 7.8, 18, 'Argwings Kodhek to CBD via Ngong Rd', 9.5, 6.8, 'High', true),
  ('a2222222-2222-2222-2222-222222222222', 'westlands', 'Westlands', 'Nairobi', ARRAY['Business district', 'Nightlife', 'Urban'], 8.7, 78, 'Safe', '$$$$', 80000, 250000, 9.0, 8.5, 12, 'Waiyaki Way, 12 mins to CBD', 11.2, 7.5, 'High', true),
  ('a3333333-3333-3333-3333-333333333333', 'lavington', 'Lavington', 'Nairobi', ARRAY['Quiet', 'Leafy', 'Premium'], 8.2, 88, 'Very safe', '$$$$', 90000, 280000, 7.5, 6.8, 22, 'James Gichuru Rd', 8.8, 5.9, 'Medium', true),
  ('a4444444-4444-4444-4444-444444444444', 'kileleshwa', 'Kileleshwa', 'Nairobi', ARRAY['Residential', 'Quiet'], 7.9, 80, 'Safe', '$$$', 45000, 130000, 7.8, 7.2, 20, 'Ring Rd Kileleshwa', 7.6, 6.2, 'Medium', true),
  ('a5555555-5555-5555-5555-555555555555', 'south-b', 'South B', 'Nairobi', ARRAY['Affordable', 'Family-friendly'], 7.0, 72, 'Moderate', '$$', 25000, 70000, 7.0, 6.5, 25, 'Mombasa Rd', 6.5, 7.8, 'High', true)
ON CONFLICT (slug) DO NOTHING;

-- Add area centroids (PostGIS points)
UPDATE areas SET centroid = ST_SetSRID(ST_MakePoint(36.7860, -1.2921), 4326) WHERE slug = 'kilimani';
UPDATE areas SET centroid = ST_SetSRID(ST_MakePoint(36.8068, -1.2654), 4326) WHERE slug = 'westlands';
UPDATE areas SET centroid = ST_SetSRID(ST_MakePoint(36.7669, -1.2842), 4326) WHERE slug = 'lavington';
UPDATE areas SET centroid = ST_SetSRID(ST_MakePoint(36.7830, -1.2800), 4326) WHERE slug = 'kileleshwa';
UPDATE areas SET centroid = ST_SetSRID(ST_MakePoint(36.8410, -1.3170), 4326) WHERE slug = 'south-b';

-- ── Area amenities (a few per area) ───────────────────────────────────────
INSERT INTO area_amenities (area_id, name, category, distance_km, rating, is_top_tier) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Yaya Centre', 'retail', 0.5, 4.5, true),
  ('a1111111-1111-1111-1111-111111111111', 'Nairobi Hospital', 'healthcare', 1.2, 4.7, true),
  ('a1111111-1111-1111-1111-111111111111', 'Strathmore School', 'education', 0.8, 4.6, true),
  ('a1111111-1111-1111-1111-111111111111', 'Java House', 'dining', 0.3, 4.3, false),
  ('a2222222-2222-2222-2222-222222222222', 'Sarit Centre', 'retail', 0.4, 4.6, true),
  ('a2222222-2222-2222-2222-222222222222', 'M.P. Shah Hospital', 'healthcare', 0.9, 4.5, true),
  ('a2222222-2222-2222-2222-222222222222', 'ABC Place', 'retail', 1.1, 4.2, false),
  ('a3333333-3333-3333-3333-333333333333', 'Lavington Mall', 'retail', 0.7, 4.4, true),
  ('a3333333-3333-3333-3333-333333333333', 'Aga Khan University Hospital', 'healthcare', 2.1, 4.8, true);

-- ── Listings ──────────────────────────────────────────────────────────────
INSERT INTO listings (id, slug, agent_id, area_id, title, description_full, description_teaser, property_type, price_kes, bedrooms, bathrooms, area_sqft, furnishing, parking, wifi, amenities, city, address, caretaker_name, caretaker_phone, deposit_months, unlock_price_kes, is_verified, is_featured, status, published_at)
VALUES
  ('11111111-aaaa-aaaa-aaaa-111111111111', 'modern-2br-kilimani-views', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1111111-1111-1111-1111-111111111111',
    '2BR Apartment with City Views',
    'Spacious top-floor apartment with floor-to-ceiling windows, modern kitchen with quartz countertops, walk-in closet, two private balconies overlooking the Nairobi skyline. Includes 24/7 security, backup generator, water tank, gym and rooftop pool access. Perfect for working professionals.',
    'Spacious top-floor apartment with floor-to-ceiling windows, modern kitchen with quartz countertops...',
    'apartment', 75000, 2, 2, 1100, 'semi_furnished', 1, true, ARRAY['Gym', 'Pool', 'Generator', '24/7 Security'], 'Nairobi', 'Argwings Kodhek Rd, Apt 4B, Kilimani', 'Jane Wanjiru', '+254722111222', 2, 499, true, true, 'active', NOW()),

  ('22222222-bbbb-bbbb-bbbb-222222222222', 'penthouse-westlands-3br', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a2222222-2222-2222-2222-222222222222',
    '3BR Penthouse in Westlands',
    'Luxury penthouse with panoramic city views, large open-plan living area, premium kitchen, three en-suite bedrooms, private terrace with hot tub. Minutes from Sarit Centre and Westgate. Includes two parking bays, full backup power, biometric access.',
    'Luxury penthouse with panoramic city views, large open-plan living area, premium kitchen...',
    'penthouse', 220000, 3, 3, 2400, 'furnished', 2, true, ARRAY['Hot tub', 'Concierge', 'Gym', 'Pool', 'Backup Power'], 'Nairobi', 'Mpaka Rd, Penthouse, Westlands', 'James Otieno', '+254722333444', 3, 499, true, true, 'active', NOW()),

  ('33333333-cccc-cccc-cccc-333333333333', 'cozy-1br-lavington', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a3333333-3333-3333-3333-333333333333',
    'Cozy 1BR in Quiet Lavington',
    'Bright, cozy one-bedroom unit in a tranquil compound. Tiled floors, fitted wardrobes, modern bathroom, well-equipped kitchen. Close to Lavington Mall, Aga Khan Hospital, and excellent international schools. Tenant pays utilities; water tank ensures uninterrupted supply.',
    'Bright, cozy one-bedroom unit in a tranquil compound. Tiled floors, fitted wardrobes...',
    'apartment', 55000, 1, 1, 650, 'unfurnished', 1, false, ARRAY['Water tank', 'Garden', 'Compound'], 'Nairobi', 'Hatheru Rd, Block C, Lavington', 'Mary Achieng', '+254722555666', 2, 499, true, false, 'active', NOW()),

  ('44444444-dddd-dddd-dddd-444444444444', 'studio-kileleshwa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a4444444-4444-4444-4444-444444444444',
    'Modern Studio Apartment',
    'Compact, smartly designed studio with kitchenette, en-suite bathroom, and a small balcony. Ideal for students or young professionals. Walking distance to public transport. Internet ready.',
    'Compact, smartly designed studio with kitchenette, en-suite bathroom...',
    'studio', 32000, 0, 1, 380, 'furnished', 0, true, ARRAY['Internet', 'Security'], 'Nairobi', 'Othaya Rd, Kileleshwa', 'Peter Kamau', '+254722777888', 1, 499, true, false, 'active', NOW()),

  ('55555555-eeee-eeee-eeee-555555555555', 'family-house-south-b', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a5555555-5555-5555-5555-555555555555',
    '4BR Family House',
    'Spacious detached family house with a large garden, four bedrooms (one en-suite), maid quarters, two-car parking. Quiet residential street, near schools and Mombasa Rd. Backup water and electricity. Pet-friendly.',
    'Spacious detached family house with a large garden, four bedrooms (one en-suite)...',
    'house', 65000, 4, 3, 1800, 'unfurnished', 2, false, ARRAY['Garden', 'Maid quarters', 'Backup water'], 'Nairobi', 'Aboretum Dr, South B', 'Susan Mwangi', '+254722999000', 2, 499, true, true, 'active', NOW()),

  ('66666666-ffff-ffff-ffff-666666666666', 'townhouse-kilimani-pool', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1111111-1111-1111-1111-111111111111',
    '4BR Townhouse with Private Pool',
    'Stunning four-bedroom townhouse in a gated community of 8 units. Private heated pool, landscaped garden, modern open-plan kitchen, four en-suite bedrooms, study, double garage. Concierge, 24/7 security, backup power and water.',
    'Stunning four-bedroom townhouse in a gated community of 8 units. Private heated pool...',
    'townhouse', 180000, 4, 5, 3200, 'semi_furnished', 2, true, ARRAY['Private pool', 'Garden', 'Concierge', 'Garage'], 'Nairobi', 'Yaya Centre area, Kilimani', 'David Kiprono', '+254723111222', 3, 499, true, false, 'active', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Set listing coordinates (PostGIS points)
UPDATE listings SET coordinates = ST_SetSRID(ST_MakePoint(36.7860, -1.2921), 4326) WHERE slug = 'modern-2br-kilimani-views';
UPDATE listings SET coordinates = ST_SetSRID(ST_MakePoint(36.8068, -1.2654), 4326) WHERE slug = 'penthouse-westlands-3br';
UPDATE listings SET coordinates = ST_SetSRID(ST_MakePoint(36.7669, -1.2842), 4326) WHERE slug = 'cozy-1br-lavington';
UPDATE listings SET coordinates = ST_SetSRID(ST_MakePoint(36.7830, -1.2800), 4326) WHERE slug = 'studio-kileleshwa';
UPDATE listings SET coordinates = ST_SetSRID(ST_MakePoint(36.8410, -1.3170), 4326) WHERE slug = 'family-house-south-b';
UPDATE listings SET coordinates = ST_SetSRID(ST_MakePoint(36.7858, -1.2918), 4326) WHERE slug = 'townhouse-kilimani-pool';

-- ── Listing photos (using Unsplash placeholders) ──────────────────────────
INSERT INTO listing_photos (listing_id, cloudinary_public_id, url, display_order, is_cover) VALUES
  ('11111111-aaaa-aaaa-aaaa-111111111111', 'seed/kil-1', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80', 0, true),
  ('11111111-aaaa-aaaa-aaaa-111111111111', 'seed/kil-2', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=80', 1, false),
  ('22222222-bbbb-bbbb-bbbb-222222222222', 'seed/west-1', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80', 0, true),
  ('22222222-bbbb-bbbb-bbbb-222222222222', 'seed/west-2', 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1600&q=80', 1, false),
  ('33333333-cccc-cccc-cccc-333333333333', 'seed/lav-1', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80', 0, true),
  ('44444444-dddd-dddd-dddd-444444444444', 'seed/kil-st', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80', 0, true),
  ('55555555-eeee-eeee-eeee-555555555555', 'seed/sb-1', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80', 0, true),
  ('66666666-ffff-ffff-ffff-666666666666', 'seed/kil-th', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&q=80', 0, true);

COMMIT;

SELECT
  (SELECT COUNT(*) FROM users) AS users,
  (SELECT COUNT(*) FROM agents) AS agents,
  (SELECT COUNT(*) FROM areas) AS areas,
  (SELECT COUNT(*) FROM listings) AS listings,
  (SELECT COUNT(*) FROM listing_photos) AS photos;
