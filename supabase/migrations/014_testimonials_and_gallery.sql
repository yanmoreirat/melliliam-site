-- ============================================================
-- MIGRATION 014: Depoimentos (testimonials) + Galeria de fotos (gallery)
-- Data: 2026-09-14
-- ============================================================

-- ----------------------------------------------------------------
-- 1) TABELA: testimonials (depoimentos de clientes / feedback)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  text TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5 CONSTRAINT testimonials_rating_check CHECK (rating BETWEEN 1 AND 5),
  photo_url TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS testimonials_active_order_idx ON public.testimonials (active, order_index);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_testimonials_set_updated_at ON public.testimonials;
CREATE TRIGGER trg_testimonials_set_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS testimonials_select_public ON public.testimonials;
CREATE POLICY testimonials_select_public ON public.testimonials
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS testimonials_select_admin ON public.testimonials;
CREATE POLICY testimonials_select_admin ON public.testimonials
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS testimonials_insert_admin ON public.testimonials;
CREATE POLICY testimonials_insert_admin ON public.testimonials
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS testimonials_update_admin ON public.testimonials;
CREATE POLICY testimonials_update_admin ON public.testimonials
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS testimonials_delete_admin ON public.testimonials;
CREATE POLICY testimonials_delete_admin ON public.testimonials
  FOR DELETE TO authenticated USING (true);

GRANT SELECT ON TABLE public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.testimonials TO authenticated;

-- ----------------------------------------------------------------
-- 2) TABELA: gallery (galeria de fotos sem limite, associada a seções da Home)
--    section: 'story' (dentro de Nossa História) | 'about' | 'hero' | 'custom'
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL DEFAULT 'story' CONSTRAINT gallery_section_check CHECK (section IN ('story','about','hero','custom')),
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gallery_section_active_order_idx ON public.gallery (section, active, order_index);

DROP TRIGGER IF EXISTS trg_gallery_set_updated_at ON public.gallery;
CREATE TRIGGER trg_gallery_set_updated_at
BEFORE UPDATE ON public.gallery
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gallery_select_public ON public.gallery;
CREATE POLICY gallery_select_public ON public.gallery
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS gallery_select_admin ON public.gallery;
CREATE POLICY gallery_select_admin ON public.gallery
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS gallery_insert_admin ON public.gallery;
CREATE POLICY gallery_insert_admin ON public.gallery
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS gallery_update_admin ON public.gallery;
CREATE POLICY gallery_update_admin ON public.gallery
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS gallery_delete_admin ON public.gallery;
CREATE POLICY gallery_delete_admin ON public.gallery
  FOR DELETE TO authenticated USING (true);

GRANT SELECT ON TABLE public.gallery TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.gallery TO authenticated;

-- ----------------------------------------------------------------
-- 3) NOVAS KEYS EM site_settings
-- ----------------------------------------------------------------
INSERT INTO public.site_settings (key, value) VALUES
  ('testimonials_enabled', 'true'),
  ('testimonials_title', 'O que nossos clientes dizem'),
  ('testimonials_subtitle', 'Feedback de famílias que já provaram e aprovaram o nosso mel artesanal'),
  ('gallery_story_enabled', 'true'),
  ('gallery_story_autoplay', 'true'),
  ('gallery_story_interval_ms', '4500')
ON CONFLICT (key) DO NOTHING;
