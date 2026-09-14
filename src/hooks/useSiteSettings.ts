import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

import type { ShippingMode, ShippingOutsideBehavior } from '@/types'

export interface SiteSettingsData {
  company_name: string
  whatsapp: string
  instagram: string
  pix_key: string
  pix_recipient_name: string
  pix_city: string
  shipping_type: 'free' | 'fixed'
  shipping_value: number
  shipping_mode: ShippingMode
  shipping_outside_rules_behavior: ShippingOutsideBehavior
  shipping_blocked_message: string
  home_title: string
  home_subtitle: string
  home_about: string
  home_story: string
  home_cta: string
  footer_text: string
  hero_image: string
  about_image: string
  site_logo_url: string
  site_favicon_url: string
  footer_image_url: string
  footer_mobile_image_url: string
  enable_pickup: string
  pickup_address: string
  pickup_city_state: string
  pickup_hours: string
  testimonials_enabled: string
  testimonials_title: string
  testimonials_subtitle: string
  testimonials_autoplay: string
  testimonials_interval_ms: string
  gallery_story_enabled: string
  gallery_story_autoplay: string
  gallery_story_interval_ms: string
  gallery_about_enabled: string
  gallery_about_autoplay: string
  gallery_about_interval_ms: string
}

const DEFAULT_SETTINGS: SiteSettingsData = {
  company_name: 'MEL LILIAM',
  whatsapp: '',
  instagram: '',
  pix_key: '',
  pix_recipient_name: '',
  pix_city: '',
  shipping_type: 'fixed',
  shipping_value: 0,
  shipping_mode: 'fixed',
  shipping_outside_rules_behavior: 'block',
  shipping_blocked_message: 'No momento não entregamos em sua cidade. Consulte a opção de retirada na loja ou entre em contato pelo WhatsApp.',
  home_title: 'Mel Artesanal, Puro e 100% Orgânico',
  home_subtitle: 'Direto da nossa família para a sua mesa',
  home_about: '[Edite este texto no painel administrativo] A MEL LILIAM é uma pequena empresa familiar com produção artesanal de mel.',
  home_story: '[Edite este texto no painel administrativo] Nossa história começa com o cuidado e a dedicação no trato das abelhas...',
  home_cta: 'Experimente o sabor autêntico do mel de verdade!',
  footer_text: '© MEL LILIAM - Todos os direitos reservados.',
  hero_image: '',
  about_image: '',
  site_logo_url: '',
  site_favicon_url: '',
  footer_image_url: '',
  footer_mobile_image_url: '',
  enable_pickup: 'true',
  pickup_address: '',
  pickup_city_state: '',
  pickup_hours: '',
  testimonials_enabled: 'true',
  testimonials_title: 'O que nossos clientes dizem',
  testimonials_subtitle: 'Feedback de famílias que já provaram e aprovaram o nosso mel artesanal',
  testimonials_autoplay: 'true',
  testimonials_interval_ms: '5000',
  gallery_story_enabled: 'true',
  gallery_story_autoplay: 'true',
  gallery_story_interval_ms: '4500',
  gallery_about_enabled: 'true',
  gallery_about_autoplay: 'true',
  gallery_about_interval_ms: '4500',
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettingsData>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const loadSettings = async () => {
    try {
      const { data } = await supabase.from('site_settings').select('*')
      const rows = (data || []) as Array<{ key: string; value: string }>
      if (rows.length === 0) return
      const s: Record<string, string> = {}
      rows.forEach((item) => (s[item.key] = item.value))
      setSettings({
        ...DEFAULT_SETTINGS,
        company_name: s.company_name || DEFAULT_SETTINGS.company_name,
        whatsapp: s.whatsapp || DEFAULT_SETTINGS.whatsapp,
        instagram: s.instagram || DEFAULT_SETTINGS.instagram,
        pix_key: s.pix_key || DEFAULT_SETTINGS.pix_key,
        pix_recipient_name: s.pix_recipient_name || DEFAULT_SETTINGS.pix_recipient_name,
        pix_city: s.pix_city || DEFAULT_SETTINGS.pix_city,
        shipping_type: (s.shipping_type as 'free' | 'fixed') || DEFAULT_SETTINGS.shipping_type,
        shipping_value: s.shipping_value ? Number(s.shipping_value) : DEFAULT_SETTINGS.shipping_value,
        shipping_mode: (s.shipping_mode as ShippingMode) || DEFAULT_SETTINGS.shipping_mode,
        shipping_outside_rules_behavior: (s.shipping_outside_rules_behavior as ShippingOutsideBehavior) || DEFAULT_SETTINGS.shipping_outside_rules_behavior,
        shipping_blocked_message: s.shipping_blocked_message || DEFAULT_SETTINGS.shipping_blocked_message,
        home_title: s.home_title || DEFAULT_SETTINGS.home_title,
        home_subtitle: s.home_subtitle || DEFAULT_SETTINGS.home_subtitle,
        home_about: s.home_about || DEFAULT_SETTINGS.home_about,
        home_story: s.home_story || DEFAULT_SETTINGS.home_story,
        home_cta: s.home_cta || DEFAULT_SETTINGS.home_cta,
        footer_text: s.footer_text || DEFAULT_SETTINGS.footer_text,
        hero_image: s.hero_image || DEFAULT_SETTINGS.hero_image,
        about_image: s.about_image || DEFAULT_SETTINGS.about_image,
        site_logo_url: s.site_logo_url || DEFAULT_SETTINGS.site_logo_url,
        site_favicon_url: s.site_favicon_url || DEFAULT_SETTINGS.site_favicon_url,
        footer_image_url: s.footer_image_url || DEFAULT_SETTINGS.footer_image_url,
        footer_mobile_image_url: s.footer_mobile_image_url || DEFAULT_SETTINGS.footer_mobile_image_url,
        enable_pickup: s.enable_pickup !== undefined ? s.enable_pickup : DEFAULT_SETTINGS.enable_pickup,
        pickup_address: s.pickup_address || DEFAULT_SETTINGS.pickup_address,
        pickup_city_state: s.pickup_city_state || DEFAULT_SETTINGS.pickup_city_state,
        pickup_hours: s.pickup_hours || DEFAULT_SETTINGS.pickup_hours,
        testimonials_enabled: s.testimonials_enabled !== undefined ? s.testimonials_enabled : DEFAULT_SETTINGS.testimonials_enabled,
        testimonials_title: s.testimonials_title !== undefined && s.testimonials_title !== null ? s.testimonials_title : DEFAULT_SETTINGS.testimonials_title,
        testimonials_subtitle: s.testimonials_subtitle !== undefined && s.testimonials_subtitle !== null ? s.testimonials_subtitle : DEFAULT_SETTINGS.testimonials_subtitle,
        testimonials_autoplay: s.testimonials_autoplay !== undefined ? s.testimonials_autoplay : DEFAULT_SETTINGS.testimonials_autoplay,
        testimonials_interval_ms: s.testimonials_interval_ms || DEFAULT_SETTINGS.testimonials_interval_ms,
        gallery_story_enabled: s.gallery_story_enabled !== undefined ? s.gallery_story_enabled : DEFAULT_SETTINGS.gallery_story_enabled,
        gallery_story_autoplay: s.gallery_story_autoplay !== undefined ? s.gallery_story_autoplay : DEFAULT_SETTINGS.gallery_story_autoplay,
        gallery_story_interval_ms: s.gallery_story_interval_ms || DEFAULT_SETTINGS.gallery_story_interval_ms,
        gallery_about_enabled: s.gallery_about_enabled !== undefined ? s.gallery_about_enabled : DEFAULT_SETTINGS.gallery_about_enabled,
        gallery_about_autoplay: s.gallery_about_autoplay !== undefined ? s.gallery_about_autoplay : DEFAULT_SETTINGS.gallery_about_autoplay,
        gallery_about_interval_ms: s.gallery_about_interval_ms || DEFAULT_SETTINGS.gallery_about_interval_ms,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return { settings, loading, reloadSettings: loadSettings }
}
