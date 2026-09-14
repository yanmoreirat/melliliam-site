-- Migration 015: novas chaves em site_settings para Galeria Sobre e Depoimentos Carousel
-- Execute APÓS a migration 014

INSERT INTO site_settings (key, value, updated_at) VALUES
  ('gallery_about_enabled', 'true', NOW()),
  ('gallery_about_autoplay', 'true', NOW()),
  ('gallery_about_interval_ms', '4500', NOW()),
  ('testimonials_autoplay', 'true', NOW()),
  ('testimonials_interval_ms', '5000', NOW())
ON CONFLICT (key) DO NOTHING;

SELECT 'Migration 015 aplicada: novas chaves Galeria Sobre + Depoimentos Carousel' as status;
