INSERT INTO public.site_settings (key, value) VALUES
  ('company_name', 'MEL LILIAM'),
  ('whatsapp', ''),
  ('instagram', ''),
  ('pix_key', ''),
  ('pix_recipient_name', ''),
  ('pix_city', ''),
  ('shipping_type', 'fixed'),
  ('shipping_value', '0'),
  ('home_title', 'Mel Artesanal, Puro e de Verdade'),
  ('home_subtitle', 'Direto da nossa família para a sua mesa'),
  ('home_about', '[Edite este texto no painel administrativo] A MEL LILIAM é uma pequena empresa familiar com produção artesanal de mel.'),
  ('home_story', '[Edite este texto no painel administrativo] Nossa história começa com o cuidado e a dedicação no trato das abelhas...'),
  ('home_cta', 'Experimente o sabor autêntico do mel de verdade!'),
  ('footer_text', '© MEL LILIAM - Todos os direitos reservados.'),
  ('hero_image', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.products (name, slug, description, size, price, discount_percent, is_available, display_order) VALUES
  (
    'Mel Silvestre Puro',
    'mel-silvestre-puro-500g',
    'Mel 100% puro produzido por abelhas nativas em mata preservada. Sabor intenso e característico, rico em propriedades naturais. Extração artesanal sem processamento químico.',
    '500g',
    89.90,
    0,
    true,
    1
  ),
  (
    'Mel Laranjeira Premium',
    'mel-laranjeira-premium-1kg',
    'Mel de florada laranjeira com sabor suave e aroma cítrico marcante. Produzido em pomares certificados, sem aditivos. Ideal para consumo diário e receitas doces.',
    '1kg',
    159.90,
    10,
    true,
    2
  ),
  (
    'Mel Eucalipto Natural',
    'mel-eucalipto-natural-250g',
    'Mel de eucalipto com coloração escura e sabor forte, característico da florada. Perfeito para dias frios e para fortalecer a imunidade. Embalagem compacta.',
    '250g',
    49.90,
    0,
    true,
    3
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_images (product_id, storage_path, display_order)
SELECT p.id, 'products/silvestre-1.jpg', 0
FROM public.products p WHERE p.slug = 'mel-silvestre-puro-500g'
AND NOT EXISTS (
  SELECT 1 FROM public.product_images pi
  WHERE pi.product_id = p.id AND pi.storage_path = 'products/silvestre-1.jpg'
);

INSERT INTO public.product_images (product_id, storage_path, display_order)
SELECT p.id, 'products/laranjeira-1.jpg', 0
FROM public.products p WHERE p.slug = 'mel-laranjeira-premium-1kg'
AND NOT EXISTS (
  SELECT 1 FROM public.product_images pi
  WHERE pi.product_id = p.id AND pi.storage_path = 'products/laranjeira-1.jpg'
);

INSERT INTO public.product_images (product_id, storage_path, display_order)
SELECT p.id, 'products/eucalipto-1.jpg', 0
FROM public.products p WHERE p.slug = 'mel-eucalipto-natural-250g'
AND NOT EXISTS (
  SELECT 1 FROM public.product_images pi
  WHERE pi.product_id = p.id AND pi.storage_path = 'products/eucalipto-1.jpg'
);
