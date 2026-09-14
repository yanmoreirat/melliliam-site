import { useState, useEffect, useRef } from 'react'
import { Save, Home, FileText, Upload, Trash2, Image as ImageIcon, MessageCircle, ChevronRight, Package, Plus, Pencil, X, MapPin, Star, Quote, Images, MessageSquareHeart, UserRound, Search, Monitor } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import BeeHiveDecor from '@/components/BeeHiveDecor'
import type { Testimonial, GalleryImage, GallerySection } from '@/types'

interface Toast {
  type: 'success' | 'error'
  message: string
}

interface FormState {
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

interface TestimonialFormState {
  id?: string
  name: string
  role: string
  text: string
  rating: number
  photo_url: string
  order_index: number
  active: boolean
}

interface GalleryFormState {
  id?: string
  image_url: string
  section: GallerySection
  title: string
  description: string
  order_index: number
  active: boolean
}

function InstagramIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export default function AdminContent() {
  const { settings, loading: settingsLoading, reloadSettings } = useSiteSettings()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const heroFileInputRef = useRef<HTMLInputElement>(null)
  const aboutFileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const faviconFileInputRef = useRef<HTMLInputElement>(null)
  const footerImageInputRef = useRef<HTMLInputElement>(null)
  const footerMobileImageInputRef = useRef<HTMLInputElement>(null)
  const testimonialPhotoInputRef = useRef<HTMLInputElement>(null)
  const galleryImageInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    home_title: '',
    home_subtitle: '',
    home_about: '',
    home_story: '',
    home_cta: '',
    footer_text: '',
    hero_image: '',
    about_image: '',
    site_logo_url: '',
    site_favicon_url: '',
    footer_image_url: '',
    footer_mobile_image_url: '',
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
  })

  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(false)
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false)
  const [testimonialForm, setTestimonialForm] = useState<TestimonialFormState>({
    name: '', role: '', text: '', rating: 5, photo_url: '', order_index: 0, active: true,
  })
  const [testimonialFormSubmitting, setTestimonialFormSubmitting] = useState(false)
  const [testimonialSearch, setTestimonialSearch] = useState('')
  const [testimonialDeleteConfirm, setTestimonialDeleteConfirm] = useState<string | null>(null)

  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [galleryModalOpen, setGalleryModalOpen] = useState(false)
  const [galleryForm, setGalleryForm] = useState<GalleryFormState>({
    image_url: '', section: 'story', title: '', description: '', order_index: 0, active: true,
  })
  const [galleryFormSubmitting, setGalleryFormSubmitting] = useState(false)
  const [gallerySearch, setGallerySearch] = useState('')
  const [galleryDeleteConfirm, setGalleryDeleteConfirm] = useState<string | null>(null)

  const loadTestimonials = async () => {
    try {
      setLoadingTestimonials(true)
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      setTestimonials((data || []) as Testimonial[])
    } catch (err: any) {
      console.warn('[testimonials] load skipped:', err.message)
      setTestimonials([])
    } finally {
      setLoadingTestimonials(false)
    }
  }

  const loadGallery = async () => {
    try {
      setLoadingGallery(true)
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      setGallery((data || []) as GalleryImage[])
    } catch (err: any) {
      console.warn('[gallery] load skipped:', err.message)
      setGallery([])
    } finally {
      setLoadingGallery(false)
    }
  }

  useEffect(() => {
    loadTestimonials()
    loadGallery()
  }, [])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!settingsLoading) {
      setForm({
        home_title: settings.home_title || '',
        home_subtitle: settings.home_subtitle || '',
        home_about: settings.home_about || '',
        home_story: settings.home_story || '',
        home_cta: settings.home_cta || '',
        footer_text: settings.footer_text || '',
        hero_image: settings.hero_image || '',
        about_image: settings.about_image || '',
        site_logo_url: settings.site_logo_url || '',
        site_favicon_url: settings.site_favicon_url || '',
        footer_image_url: settings.footer_image_url || '',
        footer_mobile_image_url: settings.footer_mobile_image_url || '',
        testimonials_enabled: settings.testimonials_enabled !== undefined ? settings.testimonials_enabled : 'true',
        testimonials_title: settings.testimonials_title !== undefined && settings.testimonials_title !== null ? settings.testimonials_title : 'O que nossos clientes dizem',
        testimonials_subtitle: settings.testimonials_subtitle !== undefined && settings.testimonials_subtitle !== null ? settings.testimonials_subtitle : 'Feedback de famílias que já provaram e aprovaram o nosso mel artesanal',
        testimonials_autoplay: settings.testimonials_autoplay !== undefined ? settings.testimonials_autoplay : 'true',
        testimonials_interval_ms: settings.testimonials_interval_ms || '5000',
        gallery_story_enabled: settings.gallery_story_enabled !== undefined ? settings.gallery_story_enabled : 'true',
        gallery_story_autoplay: settings.gallery_story_autoplay !== undefined ? settings.gallery_story_autoplay : 'true',
        gallery_story_interval_ms: settings.gallery_story_interval_ms || '4500',
        gallery_about_enabled: settings.gallery_about_enabled !== undefined ? settings.gallery_about_enabled : 'true',
        gallery_about_autoplay: settings.gallery_about_autoplay !== undefined ? settings.gallery_about_autoplay : 'true',
        gallery_about_interval_ms: settings.gallery_about_interval_ms || '4500',
      })
    }
  }, [settingsLoading, settings])

  const extractStoragePath = (publicUrl: string): string | null => {
    try {
      const url = new URL(publicUrl)
      const pathParts = url.pathname.split('/product_images/')
      if (pathParts.length === 2) return decodeURIComponent(pathParts[1])
      return null
    } catch { return null }
  }

  const handleHeroImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('error', 'Por favor, selecione um arquivo de imagem'); return }
    try {
      setUploading(true)
      const timestamp = Date.now()
      const storagePath = `site/hero_${timestamp}.png`
      const { error: uploadError } = await supabase.storage.from('product_images').upload(storagePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('product_images').getPublicUrl(storagePath)
      setForm((prev) => ({ ...prev, hero_image: urlData?.publicUrl || '' }))
      showToast('success', 'Foto do Hero enviada com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao enviar imagem')
    } finally { setUploading(false) }
  }

  const handleHeroImageRemove = () => {
    setForm((prev) => ({ ...prev, hero_image: '' }))
    showToast('success', 'Foto do Hero removida. Clique em Salvar para confirmar.')
  }

  const handleAboutImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('error', 'Por favor, selecione um arquivo de imagem'); return }
    try {
      setUploading(true)
      const timestamp = Date.now()
      const storagePath = `site/about_${timestamp}.png`
      const { error: uploadError } = await supabase.storage.from('product_images').upload(storagePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('product_images').getPublicUrl(storagePath)
      setForm((prev) => ({ ...prev, about_image: urlData?.publicUrl || '' }))
      showToast('success', 'Foto do Quem Somos enviada com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao enviar imagem')
    } finally { setUploading(false) }
  }

  const handleAboutImageRemove = () => {
    setForm((prev) => ({ ...prev, about_image: '' }))
    showToast('success', 'Foto do Quem Somos removida. Clique em Salvar para confirmar.')
  }

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('error', 'Por favor, selecione um arquivo de imagem'); return }
    try {
      setUploading(true)
      const oldStoragePath = form.site_logo_url ? extractStoragePath(form.site_logo_url) : null
      const timestamp = Date.now()
      const storagePath = `site/logo_${timestamp}.png`
      const { error: uploadError } = await supabase.storage.from('product_images').upload(storagePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      if (oldStoragePath) {
        try { await supabase.storage.from('product_images').remove([oldStoragePath]) } catch {}
      }
      const { data: urlData } = supabase.storage.from('product_images').getPublicUrl(storagePath)
      setForm((prev) => ({ ...prev, site_logo_url: urlData?.publicUrl || '' }))
      showToast('success', 'Logo enviado com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao enviar logo')
    } finally { setUploading(false) }
  }

  const handleLogoRemove = async () => {
    try {
      setUploading(true)
      const oldStoragePath = form.site_logo_url ? extractStoragePath(form.site_logo_url) : null
      if (oldStoragePath) { try { await supabase.storage.from('product_images').remove([oldStoragePath]) } catch {} }
      setForm((prev) => ({ ...prev, site_logo_url: '' }))
      showToast('success', 'Logo removido com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao remover logo')
    } finally { setUploading(false) }
  }

  const handleFaviconUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('error', 'Por favor, selecione um arquivo de imagem'); return }
    try {
      setUploading(true)
      const oldStoragePath = form.site_favicon_url ? extractStoragePath(form.site_favicon_url) : null
      const timestamp = Date.now()
      const storagePath = `site/favicon_${timestamp}.png`
      const { error: uploadError } = await supabase.storage.from('product_images').upload(storagePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      if (oldStoragePath) { try { await supabase.storage.from('product_images').remove([oldStoragePath]) } catch {} }
      const { data: urlData } = supabase.storage.from('product_images').getPublicUrl(storagePath)
      setForm((prev) => ({ ...prev, site_favicon_url: urlData?.publicUrl || '' }))
      showToast('success', 'Favicon enviado com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao enviar favicon')
    } finally { setUploading(false) }
  }

  const handleFaviconRemove = async () => {
    try {
      setUploading(true)
      const oldStoragePath = form.site_favicon_url ? extractStoragePath(form.site_favicon_url) : null
      if (oldStoragePath) { try { await supabase.storage.from('product_images').remove([oldStoragePath]) } catch {} }
      setForm((prev) => ({ ...prev, site_favicon_url: '' }))
      showToast('success', 'Favicon removido com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao remover favicon')
    } finally { setUploading(false) }
  }

  const handleFooterImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('error', 'Por favor, selecione um arquivo de imagem'); return }
    try {
      setUploading(true)
      const oldStoragePath = form.footer_image_url ? extractStoragePath(form.footer_image_url) : null
      const timestamp = Date.now()
      const storagePath = `site/footer_${timestamp}.png`
      const { error: uploadError } = await supabase.storage.from('product_images').upload(storagePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      if (oldStoragePath) { try { await supabase.storage.from('product_images').remove([oldStoragePath]) } catch {} }
      const { data: urlData } = supabase.storage.from('product_images').getPublicUrl(storagePath)
      setForm((prev) => ({ ...prev, footer_image_url: urlData?.publicUrl || '' }))
      showToast('success', 'Imagem de rodapé enviada com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao enviar imagem de rodapé')
    } finally { setUploading(false) }
  }

  const handleFooterImageRemove = async () => {
    try {
      setUploading(true)
      const oldStoragePath = form.footer_image_url ? extractStoragePath(form.footer_image_url) : null
      if (oldStoragePath) { try { await supabase.storage.from('product_images').remove([oldStoragePath]) } catch {} }
      setForm((prev) => ({ ...prev, footer_image_url: '' }))
      showToast('success', 'Imagem de rodapé removida com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao remover imagem de rodapé')
    } finally { setUploading(false) }
  }

  const handleFooterMobileImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('error', 'Por favor, selecione um arquivo de imagem'); return }
    try {
      setUploading(true)
      const oldStoragePath = form.footer_mobile_image_url ? extractStoragePath(form.footer_mobile_image_url) : null
      const timestamp = Date.now()
      const storagePath = `site/footer_mobile_${timestamp}.png`
      const { error: uploadError } = await supabase.storage.from('product_images').upload(storagePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      if (oldStoragePath) { try { await supabase.storage.from('product_images').remove([oldStoragePath]) } catch {} }
      const { data: urlData } = supabase.storage.from('product_images').getPublicUrl(storagePath)
      setForm((prev) => ({ ...prev, footer_mobile_image_url: urlData?.publicUrl || '' }))
      showToast('success', 'Imagem de rodapé (mobile) enviada com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao enviar imagem de rodapé mobile')
    } finally { setUploading(false) }
  }

  const handleFooterMobileImageRemove = async () => {
    try {
      setUploading(true)
      const oldStoragePath = form.footer_mobile_image_url ? extractStoragePath(form.footer_mobile_image_url) : null
      if (oldStoragePath) { try { await supabase.storage.from('product_images').remove([oldStoragePath]) } catch {} }
      setForm((prev) => ({ ...prev, footer_mobile_image_url: '' }))
      showToast('success', 'Imagem de rodapé (mobile) removida com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao remover imagem de rodapé mobile')
    } finally { setUploading(false) }
  }

  const handleTestimonialPhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('error', 'Por favor, selecione um arquivo de imagem'); return }
    try {
      setUploading(true)
      const timestamp = Date.now()
      const storagePath = `testimonials/${timestamp}.png`
      const { error: uploadError } = await supabase.storage.from('product_images').upload(storagePath, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw uploadError
      const { data: publicData } = supabase.storage.from('product_images').getPublicUrl(storagePath)
      setTestimonialForm({ ...testimonialForm, photo_url: publicData.publicUrl })
      showToast('success', 'Foto enviada!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao enviar foto')
    } finally { setUploading(false) }
  }

  const openTestimonialModal = (t?: Testimonial) => {
    if (t) {
      setTestimonialForm({
        id: t.id, name: t.name, role: t.role || '', text: t.text, rating: t.rating,
        photo_url: t.photo_url || '', order_index: t.order_index || 0, active: t.active,
      })
    } else {
      setTestimonialForm({ name: '', role: '', text: '', rating: 5, photo_url: '', order_index: 0, active: true })
    }
    setTestimonialModalOpen(true)
  }

  const closeTestimonialModal = () => {
    setTestimonialModalOpen(false)
    setTestimonialFormSubmitting(false)
  }

  const handleSaveTestimonial = async () => {
    if (!testimonialForm.name.trim()) { showToast('error', 'Informe o nome do cliente'); return }
    if (!testimonialForm.text.trim()) { showToast('error', 'Informe o texto do depoimento'); return }
    if (testimonialForm.rating < 1 || testimonialForm.rating > 5) { showToast('error', 'A nota deve ser entre 1 e 5 estrelas'); return }
    try {
      setTestimonialFormSubmitting(true)
      const payload = {
        name: testimonialForm.name.trim(),
        role: testimonialForm.role.trim() || null,
        text: testimonialForm.text.trim(),
        rating: testimonialForm.rating,
        photo_url: testimonialForm.photo_url || null,
        order_index: testimonialForm.order_index || 0,
        active: testimonialForm.active,
        updated_at: new Date().toISOString(),
      }
      if (testimonialForm.id) {
        const tableT = supabase.from('testimonials') as any
        const { error } = await tableT.update(payload).eq('id', testimonialForm.id)
        if (error) throw error
      } else {
        const tableT = supabase.from('testimonials') as any
        const { error } = await tableT.insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
      }
      await loadTestimonials()
      closeTestimonialModal()
      showToast('success', testimonialForm.id ? 'Depoimento atualizado!' : 'Depoimento adicionado!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao salvar depoimento')
    } finally { setTestimonialFormSubmitting(false) }
  }

  const handleDeleteTestimonial = async (t: Testimonial) => {
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', t.id)
      if (error) throw error
      if (t.photo_url) {
        const path = extractStoragePath(t.photo_url)
        if (path) await supabase.storage.from('product_images').remove([path]).catch(() => {})
      }
      await loadTestimonials()
      setTestimonialDeleteConfirm(null)
      showToast('success', 'Depoimento excluído!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao excluir depoimento')
    }
  }

  const filteredTestimonials = testimonials.filter((t) => {
    if (!testimonialSearch.trim()) return true
    const q = testimonialSearch.trim().toLowerCase()
    return t.name.toLowerCase().includes(q) || t.text.toLowerCase().includes(q)
  })

  const handleGalleryImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('error', 'Por favor, selecione um arquivo de imagem'); return }
    try {
      setUploading(true)
      const timestamp = Date.now()
      const storagePath = `gallery/${timestamp}.png`
      const { error: uploadError } = await supabase.storage.from('product_images').upload(storagePath, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw uploadError
      const { data: publicData } = supabase.storage.from('product_images').getPublicUrl(storagePath)
      setGalleryForm({ ...galleryForm, image_url: publicData.publicUrl })
      showToast('success', 'Foto enviada!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao enviar foto')
    } finally { setUploading(false) }
  }

  const openGalleryModal = (g?: GalleryImage) => {
    if (g) {
      setGalleryForm({
        id: g.id, image_url: g.image_url, section: g.section, title: g.title || '',
        description: g.description || '', order_index: g.order_index || 0, active: g.active,
      })
    } else {
      setGalleryForm({ image_url: '', section: 'story', title: '', description: '', order_index: 0, active: true })
    }
    setGalleryModalOpen(true)
  }

  const closeGalleryModal = () => {
    setGalleryModalOpen(false)
    setGalleryFormSubmitting(false)
  }

  const handleSaveGallery = async () => {
    if (!galleryForm.image_url.trim()) { showToast('error', 'Envie uma foto para a galeria'); return }
    try {
      setGalleryFormSubmitting(true)
      const payload = {
        image_url: galleryForm.image_url, section: galleryForm.section,
        title: galleryForm.title.trim() || null, description: galleryForm.description.trim() || null,
        order_index: galleryForm.order_index || 0, active: galleryForm.active,
        updated_at: new Date().toISOString(),
      }
      if (galleryForm.id) {
        const tableG = supabase.from('gallery') as any
        const { error } = await tableG.update(payload).eq('id', galleryForm.id)
        if (error) throw error
      } else {
        const tableG = supabase.from('gallery') as any
        const { error } = await tableG.insert(payload)
        if (error) throw error
      }
      await loadGallery()
      closeGalleryModal()
      showToast('success', galleryForm.id ? 'Foto atualizada!' : 'Foto adicionada!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao salvar foto')
    } finally { setGalleryFormSubmitting(false) }
  }

  const handleDeleteGallery = async (g: GalleryImage) => {
    try {
      const { error } = await supabase.from('gallery').delete().eq('id', g.id)
      if (error) throw error
      const path = extractStoragePath(g.image_url)
      if (path) await supabase.storage.from('product_images').remove([path]).catch(() => {})
      await loadGallery()
      setGalleryDeleteConfirm(null)
      showToast('success', 'Foto excluída!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao excluir foto')
    }
  }

  const filteredGallery = gallery.filter((g) => {
    if (!gallerySearch.trim()) return true
    const q = gallerySearch.trim().toLowerCase()
    return (g.title || '').toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q) || g.section.toLowerCase().includes(q)
  })

  const sectionLabel = (s: GallerySection) => {
    switch (s) {
      case 'story': return 'História'
      case 'about': return 'Sobre'
      case 'hero': return 'Destaques'
      case 'custom': return 'Personalizada'
      default: return s
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const rows: Array<{ key: string; value: string }> = [
        { key: 'home_title', value: form.home_title.trim() },
        { key: 'home_subtitle', value: form.home_subtitle.trim() },
        { key: 'home_about', value: form.home_about.trim() },
        { key: 'home_story', value: form.home_story.trim() },
        { key: 'home_cta', value: form.home_cta.trim() },
        { key: 'footer_text', value: form.footer_text.trim() },
        { key: 'hero_image', value: form.hero_image },
        { key: 'about_image', value: form.about_image },
        { key: 'site_logo_url', value: form.site_logo_url },
        { key: 'site_favicon_url', value: form.site_favicon_url },
        { key: 'footer_image_url', value: form.footer_image_url },
        { key: 'footer_mobile_image_url', value: form.footer_mobile_image_url },
        { key: 'testimonials_enabled', value: form.testimonials_enabled },
        { key: 'testimonials_title', value: form.testimonials_title.trim() },
        { key: 'testimonials_subtitle', value: form.testimonials_subtitle.trim() },
        { key: 'testimonials_autoplay', value: form.testimonials_autoplay },
        { key: 'testimonials_interval_ms', value: form.testimonials_interval_ms.trim() || '5000' },
        { key: 'gallery_story_enabled', value: form.gallery_story_enabled },
        { key: 'gallery_story_autoplay', value: form.gallery_story_autoplay },
        { key: 'gallery_story_interval_ms', value: form.gallery_story_interval_ms.trim() || '4500' },
        { key: 'gallery_about_enabled', value: form.gallery_about_enabled },
        { key: 'gallery_about_autoplay', value: form.gallery_about_autoplay },
        { key: 'gallery_about_interval_ms', value: form.gallery_about_interval_ms.trim() || '4500' },
      ]
      for (const row of rows) {
        const table = supabase.from('site_settings') as any
        const { error } = await table.upsert(
          { key: row.key, value: row.value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
        if (error) throw error
      }
      await reloadSettings()
      showToast('success', 'Conteúdo salvo com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao salvar conteúdo')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Conteúdo do Site</h2>
          <p className="text-sm text-brown-500 mt-1">
            Textos, fotos, identidade visual, rodapé, depoimentos e galeria
          </p>
        </div>
        <button onClick={handleSave} disabled={saving || settingsLoading} className="btn-primary">
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="space-y-5">
        <input type="file" accept="image/*" className="hidden" ref={heroFileInputRef}
          onChange={(e) => {
            const files = e.target.files
            if (files && files[0]) handleHeroImageUpload(files[0])
            if (heroFileInputRef.current) heroFileInputRef.current.value = ''
          }} />
        <input type="file" accept="image/*" className="hidden" ref={aboutFileInputRef}
          onChange={(e) => {
            const files = e.target.files
            if (files && files[0]) handleAboutImageUpload(files[0])
            if (aboutFileInputRef.current) aboutFileInputRef.current.value = ''
          }} />
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef}
          onChange={(e) => {
            const files = e.target.files
            if (files && files[0]) handleLogoUpload(files[0])
            if (fileInputRef.current) fileInputRef.current.value = ''
          }} />
        <input type="file" accept="image/*" className="hidden" ref={footerImageInputRef}
          onChange={(e) => {
            const files = e.target.files
            if (files && files[0]) handleFooterImageUpload(files[0])
            if (footerImageInputRef.current) footerImageInputRef.current.value = ''
          }} />
        <input type="file" accept="image/*" className="hidden" ref={footerMobileImageInputRef}
          onChange={(e) => {
            const files = e.target.files
            if (files && files[0]) handleFooterMobileImageUpload(files[0])
            if (footerMobileImageInputRef.current) footerMobileImageInputRef.current.value = ''
          }} />
        <input type="file" accept="image/x-icon,image/vnd.microsoft.icon,image/*" className="hidden" ref={faviconFileInputRef}
          onChange={(e) => {
            const files = e.target.files
            if (files && files[0]) handleFaviconUpload(files[0])
            if (faviconFileInputRef.current) faviconFileInputRef.current.value = ''
          }} />
        <input type="file" accept="image/*" className="hidden" ref={testimonialPhotoInputRef}
          onChange={(e) => {
            const files = e.target.files
            if (files && files[0]) handleTestimonialPhotoUpload(files[0])
            if (testimonialPhotoInputRef.current) testimonialPhotoInputRef.current.value = ''
          }} />
        <input type="file" accept="image/*" className="hidden" ref={galleryImageInputRef}
          onChange={(e) => {
            const files = e.target.files
            if (files && files[0]) handleGalleryImageUpload(files[0])
            if (galleryImageInputRef.current) galleryImageInputRef.current.value = ''
          }} />

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-cream-200">
            <div className="w-10 h-10 rounded-lg bg-honey-100 text-honey-700 flex items-center justify-center"><Home size={20} /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">Página Inicial — Hero</h3>
              <p className="text-xs text-brown-500">Textos da seção principal do topo</p>
            </div>
          </div>
          <div>
            <label className="label">Título Principal</label>
            <input type="text" className="input" value={form.home_title}
              onChange={(e) => setForm({ ...form, home_title: e.target.value })}
              placeholder="Título grande de destaque" />
            <p className="text-xs text-brown-500 mt-1">{form.home_title.length} caracteres</p>
          </div>
          <div>
            <label className="label">Subtítulo</label>
            <input type="text" className="input" value={form.home_subtitle}
              onChange={(e) => setForm({ ...form, home_subtitle: e.target.value })}
              placeholder="Frase de apoio abaixo do título" />
          </div>
          <div>
            <label className="label">Chamada para Ação (CTA)</label>
            <input type="text" className="input" value={form.home_cta}
              onChange={(e) => setForm({ ...form, home_cta: e.target.value })}
              placeholder="Ex: Experimente o sabor autêntico!" />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-cream-200">
            <div className="w-10 h-10 rounded-lg bg-brown-100 text-brown-700 flex items-center justify-center"><FileText size={20} /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">Página Inicial — Textos</h3>
              <p className="text-xs text-brown-500">Seções "Sobre" e "Nossa História"</p>
            </div>
          </div>
          <div>
            <label className="label">Sobre Nós</label>
            <textarea className="input min-h-[140px] resize-y" value={form.home_about}
              onChange={(e) => setForm({ ...form, home_about: e.target.value })}
              placeholder="Conte um pouco sobre a marca, missão e valores..." />
            <p className="text-xs text-brown-500 mt-1">{form.home_about.length} caracteres</p>
          </div>
          <div>
            <label className="label">Nossa História</label>
            <textarea className="input min-h-[180px] resize-y" value={form.home_story}
              onChange={(e) => setForm({ ...form, home_story: e.target.value })}
              placeholder="Conte a história da empresa, origem, tradição..." />
            <p className="text-xs text-brown-500 mt-1">{form.home_story.length} caracteres</p>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-cream-200">
            <div className="w-10 h-10 rounded-lg bg-brown-700 text-cream-50 flex items-center justify-center"><FileText size={20} /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">Rodapé</h3>
              <p className="text-xs text-brown-500">Texto exibido no rodapé de todas as páginas</p>
            </div>
          </div>
          <div>
            <label className="label">Texto do Rodapé</label>
            <textarea className="input min-h-[100px] resize-y" value={form.footer_text}
              onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
              placeholder="Copyright, informações legais, etc." />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-cream-200">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center"><ImageIcon size={20} /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">Foto do Hero (Página Inicial)</h3>
              <p className="text-xs text-brown-500">Imagem em destaque na seção principal do topo</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex-shrink-0 w-40 h-40 rounded-xl border-2 border-cream-200 bg-white flex items-center justify-center overflow-hidden">
              {form.hero_image ? (
                <img src={form.hero_image} alt="Foto do Hero" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-cream-400 p-3 text-center">
                  <ImageIcon size={32} className="mb-2" />
                  <p className="text-xs">Sem imagem</p>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-brown-800">Visualização atual</p>
                <p className="text-xs text-brown-500 mt-0.5">{form.hero_image ? 'Usando imagem personalizada' : 'Usando placeholder padrão'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => heroFileInputRef.current?.click()} disabled={uploading} className="btn-outline py-2 px-4 text-sm">
                  <Upload size={14} /> {uploading ? 'Enviando...' : 'Enviar Imagem'}
                </button>
                {form.hero_image && (
                  <button type="button" onClick={handleHeroImageRemove} disabled={uploading} className="btn-ghost py-2 px-4 text-sm text-red-600 hover:bg-red-50 hover:text-red-700">
                    <Trash2 size={14} /> Remover Imagem
                  </button>
                )}
              </div>
              <div className="mt-2 p-3 rounded-lg bg-honey-50 border border-honey-200 space-y-1.5">
                <p className="text-sm text-brown-800">📏 <strong className="font-semibold">Tamanho Recomendado: 1920px × 1200px</strong> <span className="text-brown-600">(Proporção 16:10 - paisagem)</span>.</p>
                <p className="text-sm text-brown-700">Para aparecer <strong className="font-semibold">100% completa sem cortes e sem zoom</strong> edite sua foto em um editor (Canva/Photoshop) deixando exatamente nessas dimensões antes de enviar.</p>
                <p className="text-sm text-brown-700">✅ <strong className="font-semibold">Formato ideal:</strong> JPG ou PNG. Tamanho máximo do arquivo: 1MB para carregar rápido.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-cream-200">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><ImageIcon size={20} /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">Foto do Quem Somos / Sobre Nós</h3>
              <p className="text-xs text-brown-500">Imagem exibida ao lado do texto "Quem somos"</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex-shrink-0 w-40 h-40 rounded-xl border-2 border-cream-200 bg-white flex items-center justify-center overflow-hidden">
              {form.about_image ? (
                <img src={form.about_image} alt="Foto do Quem Somos" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-cream-400 p-3 text-center">
                  <ImageIcon size={32} className="mb-2" />
                  <p className="text-xs">Sem imagem</p>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-brown-800">Visualização atual</p>
                <p className="text-xs text-brown-500 mt-0.5">{form.about_image ? 'Usando imagem personalizada' : 'Exibindo apenas texto'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => aboutFileInputRef.current?.click()} disabled={uploading} className="btn-outline py-2 px-4 text-sm">
                  <Upload size={14} /> {uploading ? 'Enviando...' : 'Enviar Imagem'}
                </button>
                {form.about_image && (
                  <button type="button" onClick={handleAboutImageRemove} disabled={uploading} className="btn-ghost py-2 px-4 text-sm text-red-600 hover:bg-red-50 hover:text-red-700">
                    <Trash2 size={14} /> Remover Imagem
                  </button>
                )}
              </div>
              <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
                <p className="text-sm text-brown-800">📏 <strong className="font-semibold">Tamanho Recomendado: 1200px × 900px</strong> <span className="text-brown-600">(Proporção 4:3 - paisagem quadrada)</span>.</p>
                <p className="text-sm text-brown-700">Para aparecer <strong className="font-semibold">100% completa sem cortes e sem zoom</strong> edite a foto nessas dimensões antes de enviar.</p>
                <p className="text-sm text-brown-700">✅ <strong className="font-semibold">Formato ideal:</strong> JPG ou PNG. Tamanho máximo do arquivo: 1MB.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          {/* ============== SEÇÃO: IDENTIDADE (Logo + Favicon) ============== */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center"><ImageIcon size={20} /></div>
              <div>
                <h3 className="font-display text-lg font-semibold">Logo do Site</h3>
                <p className="text-xs text-brown-500">Logotipo personalizado exibido no cabeçalho e rodapé</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex-shrink-0 w-36 h-36 flex items-center justify-center">
                {form.site_logo_url ? (
                  <img src={form.site_logo_url} alt="Logo do site" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-honey-100 via-honey-200 to-honey-100 animate-pulse rounded-xl">
                    <span className="font-display font-bold text-4xl text-honey-700">M</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-brown-800">Visualização atual</p>
                  <p className="text-xs text-brown-500 mt-0.5">{form.site_logo_url ? 'Usando logo personalizado' : 'Usando logo padrão (letra M)'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-outline py-2 px-4 text-sm">
                    <Upload size={14} /> {uploading ? 'Enviando...' : 'Enviar Logo'}
                  </button>
                  {form.site_logo_url && (
                    <button type="button" onClick={handleLogoRemove} disabled={uploading} className="btn-ghost py-2 px-4 text-sm text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 size={14} /> Remover Logo
                    </button>
                  )}
                </div>
                <p className="text-xs text-brown-400 leading-relaxed">
                  <strong>Formato recomendado:</strong> PNG com fundo transparente ou SVG (melhor qualidade).<br />
                  <strong>Dica de tamanho:</strong> Envie a logo <strong>o maior possível</strong> (ex: 512×512px ou mais).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-dashed border-cream-300 space-y-4">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center"><ImageIcon size={20} /></div>
              <div>
                <h3 className="font-display text-lg font-semibold">Favicon da Aba</h3>
                <p className="text-xs text-brown-500">Ícone exibido APENAS na aba do navegador (independente da logo do site)</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex-shrink-0">
                <div className="w-full sm:w-64 rounded-xl border-2 border-cream-200 bg-gradient-to-r from-gray-50 to-white shadow-sm">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-cream-200">
                    <div className="flex -space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="ml-2 flex-1 h-6 bg-white border border-cream-200 rounded-md flex items-center gap-2 px-2 text-[10px] text-brown-500">
                      <span className="w-4 h-4 flex-shrink-0 rounded-md bg-honey-100 flex items-center justify-center overflow-hidden border border-cream-200">
                        {form.site_favicon_url ? (<img src={form.site_favicon_url} alt="Favicon preview" className="w-full h-full object-cover" />) : (<span className="font-bold text-[8px] text-honey-600">M</span>)}
                      </span>
                      <span className="truncate">melliliam.com.br</span>
                    </div>
                  </div>
                  <div className="px-5 py-6 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-cream-200">
                      {form.site_favicon_url ? (<img src={form.site_favicon_url} alt="Favicon" className="w-12 h-12 object-cover" />) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-honey-100 via-honey-200 to-honey-100 animate-pulse flex items-center justify-center">
                          <span className="font-display font-bold text-xl text-honey-700">M</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-brown-800">Visualização atual</p>
                  <p className="text-xs text-brown-500 mt-0.5">{form.site_favicon_url ? 'Usando favicon personalizado' : 'Usando logo do site como favicon (se existir)'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => faviconFileInputRef.current?.click()} disabled={uploading} className="btn-outline py-2 px-4 text-sm">
                    <Upload size={14} /> {uploading ? 'Enviando...' : 'Enviar Favicon'}
                  </button>
                  {form.site_favicon_url && (
                    <button type="button" onClick={handleFaviconRemove} disabled={uploading} className="btn-ghost py-2 px-4 text-sm text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 size={14} /> Remover Favicon
                    </button>
                  )}
                </div>
                <p className="text-xs text-brown-400 leading-relaxed"><strong>Formato recomendado:</strong> PNG 64×64 / 128×128 / 512×512px.</p>
              </div>
            </div>
          </div>

          {/* ============== SEÇÃO: RODAPÉ (imagens desktop + mobile + preview) ============== */}
          <div className="pt-6 mt-6 border-t border-dashed border-cream-300 space-y-5">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><ImageIcon size={20} /></div>
              <div>
                <h3 className="font-display text-lg font-semibold">Imagens do Rodapé</h3>
                <p className="text-xs text-brown-500 mt-1">Textura leve de fundo do rodapé (versão Desktop + versão Mobile exclusiva).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-1">
                  <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center"><Monitor size={18} /></div>
                  <div>
                    <h4 className="font-display text-base font-semibold text-brown-800">Versão Desktop</h4>
                    <p className="text-xs text-brown-500">Recomendado: <strong>1920 × 800 px</strong> (2.4 : 1)</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-shrink-0 w-full sm:w-56 h-36 rounded-xl border-2 border-cream-200 overflow-hidden bg-brown-800 relative">
                    {form.footer_image_url ? (<img src={form.footer_image_url} alt="Fundo rodapé desktop" className="w-full h-full object-cover" />) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brown-800 to-brown-900">
                        <div className="text-center text-brown-400 text-sm"><ImageIcon size={28} className="mx-auto mb-2 opacity-50" /><p>Sem imagem</p></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <p className="text-xs text-brown-500">{form.footer_image_url ? 'Usando imagem personalizada' : 'Padrão: favos de mel sutil'}</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => footerImageInputRef.current?.click()} disabled={uploading} className="btn-outline py-2 px-4 text-sm"><Upload size={14} />{uploading ? 'Enviando...' : 'Enviar Imagem'}</button>
                      {form.footer_image_url && (<button type="button" onClick={handleFooterImageRemove} disabled={uploading} className="btn-ghost py-2 px-4 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 size={14} /> Remover</button>)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-1">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center"><Package size={18} /></div>
                  <div>
                    <h4 className="font-display text-base font-semibold text-brown-800">Versão Mobile (Celular)</h4>
                    <p className="text-xs text-brown-500">Recomendado: <strong>1080 × 1920 px</strong> (9 : 16 retrato)</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-shrink-0 w-40 h-64 rounded-xl border-2 border-cream-200 overflow-hidden bg-brown-800 relative">
                    {form.footer_mobile_image_url ? (<img src={form.footer_mobile_image_url} alt="Fundo rodapé mobile" className="w-full h-full object-cover" />) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brown-800 to-brown-900">
                        <div className="text-center text-brown-400 text-xs px-2"><ImageIcon size={24} className="mx-auto mb-2 opacity-50" /><p>Sem imagem mobile</p><p className="mt-1 opacity-70 text-[10px]">(usa desktop)</p></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <p className="text-xs text-brown-500">{form.footer_mobile_image_url ? 'Usando imagem exclusiva mobile' : 'Sem envio: versão desktop adaptada.'}</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => footerMobileImageInputRef.current?.click()} disabled={uploading} className="btn-outline py-2 px-4 text-sm"><Upload size={14} />{uploading ? 'Enviando...' : 'Enviar Mobile'}</button>
                      {form.footer_mobile_image_url && (<button type="button" onClick={handleFooterMobileImageRemove} disabled={uploading} className="btn-ghost py-2 px-4 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 size={14} /> Remover</button>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prévia rodapé */}
            <div className="space-y-3 pt-2">
              <h4 className="font-display font-semibold text-brown-800">Prévia do Rodapé</h4>
              <div className="grid grid-cols-1 md:grid-cols-[3fr,2fr] gap-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-brown-500 uppercase tracking-wider pl-1">Desktop (ex.: notebook)</p>
                  <div className="relative overflow-hidden rounded-2xl bg-brown-800 text-cream-100" style={{ aspectRatio: '1920/800', maxHeight: 320 }}>
                    {form.footer_image_url ? (<img src={form.footer_image_url} className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />) : (
                      <>
                        <BeeHiveDecor variant="honeycomb" className="absolute -top-4 -right-4 w-24 h-24 text-honey-400 rotate-12 opacity-25" />
                        <BeeHiveDecor variant="honeycomb" className="absolute -bottom-8 -left-8 w-32 h-32 text-honey-300 -rotate-12 opacity-25" />
                      </>
                    )}
                    <div className="relative z-10 h-full px-4 py-4 sm:px-6 sm:py-5 max-w-7xl mx-auto flex flex-col">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 flex-1 min-h-0">
                        <div className="md:col-span-2 min-h-0">
                          <div className="flex items-center gap-3 mb-2">
                            {form.site_logo_url ? (<img src={form.site_logo_url} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0" />) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-honey-100 via-honey-200 to-honey-100 animate-pulse flex items-center justify-center flex-shrink-0"><span className="font-display font-bold text-lg sm:text-xl text-honey-700">M</span></div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-display font-bold text-sm sm:text-base text-honey-300 truncate">{settings.company_name || 'MEL LILIAM'}</h3>
                              <p className="text-[10px] sm:text-xs text-brown-300">Mel Artesanal, Puro e 100% Orgânico</p>
                            </div>
                          </div>
                          <p className="text-brown-200 text-[10px] sm:text-xs leading-relaxed line-clamp-3 sm:line-clamp-4">
                            {form.home_about || '[Edite este texto no painel administrativo] A MEL LILIAM é uma pequena empresa familiar com produção artesanal de mel.'}
                          </p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                            {settings.whatsapp && (<span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-green-500 text-white rounded-md font-medium text-[10px] sm:text-xs shadow-sm pointer-events-none"><MessageCircle size={12} /> WhatsApp</span>)}
                            {settings.instagram && (<span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-md font-medium text-[10px] sm:text-xs shadow-sm pointer-events-none"><InstagramIcon size={12} /> Instagram</span>)}
                          </div>
                        </div>
                        <div className="min-h-0">
                          <h4 className="font-display font-bold text-honey-300 text-xs sm:text-sm mb-2">Links úteis</h4>
                          <ul className="space-y-1">
                            {['Início', 'Produtos', 'Carrinho', 'Acompanhar pedido'].map((label) => (
                              <li key={label}><span className="inline-flex items-center gap-0.5 text-brown-200 text-[10px] sm:text-xs pointer-events-none"><ChevronRight size={10} className="text-honey-300" /> {label}</span></li>
                            ))}
                          </ul>
                        </div>
                        <div className="min-h-0">
                          <h4 className="font-display font-bold text-honey-300 text-xs sm:text-sm mb-2">Atendimento</h4>
                          <ul className="space-y-1.5 text-[10px] sm:text-xs text-brown-200">
                            {settings.whatsapp && (
                              <li className="flex items-start gap-1.5">
                                <MessageCircle size={12} className="text-honey-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0"><p className="text-brown-100 font-medium">WhatsApp</p><span className="truncate block">{settings.whatsapp}</span></div>
                              </li>
                            )}
                            <li className="flex items-start gap-1.5">
                              <Package size={12} className="text-honey-400 mt-0.5 flex-shrink-0" />
                              <div><p className="text-brown-100 font-medium">Pedidos</p><span>Acompanhe seu pedido</span></div>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="border-t border-brown-700 mt-3 pt-2 text-center text-brown-300 text-[9px] sm:text-[11px]">
                        <p>{form.footer_text || '© MEL LILIAM - Todos os direitos reservados.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mx-auto md:mx-0 w-full max-w-[220px]">
                  <p className="text-xs font-semibold text-brown-500 uppercase tracking-wider pl-1">Mobile (ex.: celular)</p>
                  <div className="relative overflow-hidden rounded-2xl bg-brown-800 text-cream-100 border-8 border-brown-900/60 shadow-xl" style={{ aspectRatio: '9/16' }}>
                    {form.footer_mobile_image_url ? (<img src={form.footer_mobile_image_url} className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />) : form.footer_image_url ? (<img src={form.footer_image_url} className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />) : (
                      <>
                        <BeeHiveDecor variant="honeycomb" className="absolute -top-2 -right-2 w-16 h-16 text-honey-400 rotate-12 opacity-25" />
                        <BeeHiveDecor variant="honeycomb" className="absolute -bottom-6 -left-4 w-24 h-24 text-honey-300 -rotate-12 opacity-25" />
                      </>
                    )}
                    <div className="relative z-10 h-full p-3 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        {form.site_logo_url ? (<img src={form.site_logo_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />) : (
                          <div className="w-9 h-9 rounded-lg bg-honey-500 flex items-center justify-center flex-shrink-0"><span className="font-display font-bold text-sm text-cream-50">M</span></div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-[13px] text-honey-300 leading-tight truncate">{settings.company_name || 'MEL LILIAM'}</h3>
                          <p className="text-[9px] text-brown-300 leading-none">Mel Artesanal</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-[10px]">
                        <h4 className="font-display font-bold text-honey-300 text-xs">Links úteis</h4>
                        <p className="text-brown-200/90">Início</p>
                        <p className="text-brown-200/90">Produtos</p>
                        <p className="text-brown-200/90">Carrinho</p>
                        <p className="text-brown-200/90">Acompanhar pedido</p>
                      </div>
                      <div className="mt-auto">
                        <div className="flex flex-wrap gap-1.5">
                          {settings.whatsapp && (<div className="px-2 py-0.5 bg-green-500/90 text-white rounded text-[9px] font-medium">WhatsApp</div>)}
                          {settings.instagram && (<div className="px-2 py-0.5 bg-pink-500/90 text-white rounded text-[9px] font-medium">Instagram</div>)}
                        </div>
                        <div className="border-t border-brown-700/80 mt-2 pt-1.5 text-center text-[8px] text-brown-300 leading-tight">
                          <p className="line-clamp-2">{form.footer_text || '© MEL LILIAM'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============== SEÇÃO: DEPOIMENTOS ============== */}
          <div className="pt-8 mt-8 border-t border-dashed border-cream-300 space-y-4">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-lg bg-honey-100 text-honey-700 flex items-center justify-center"><MessageSquareHeart size={20} /></div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-brown-900">Depoimentos de Clientes</h3>
                <p className="text-xs text-brown-500">Feedbacks exibidos na página inicial após os produtos em destaque</p>
              </div>
              <div className="flex items-center gap-2 pl-4 border-l border-cream-200">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.testimonials_enabled === 'true'}
                    onChange={(e) => setForm({ ...form, testimonials_enabled: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 accent-honey-500" />
                  <span className="text-sm font-medium text-brown-700">Ativar no site</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Título da seção</label>
                <input type="text" className="input" value={form.testimonials_title}
                  onChange={(e) => setForm({ ...form, testimonials_title: e.target.value })}
                  placeholder="Ex: O que nossos clientes dizem" />
              </div>
              <div>
                <label className="label">Subtítulo da seção</label>
                <input type="text" className="input" value={form.testimonials_subtitle}
                  onChange={(e) => setForm({ ...form, testimonials_subtitle: e.target.value })}
                  placeholder="Deixe vazio se não quiser subtítulo" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white rounded-xl border border-cream-200 p-4">
              <div className="flex flex-col gap-2">
                <label className="label !mb-0">Passar automaticamente (auto-play)</label>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.testimonials_autoplay === 'true'}
                    onChange={(e) => setForm({ ...form, testimonials_autoplay: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 accent-honey-500" />
                  <span className="text-sm font-medium text-brown-700">Ativar</span>
                </label>
                <p className="text-xs text-brown-400">Os depoimentos passarão sozinhos no tempo abaixo.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Intervalo entre depoimentos (milissegundos)</label>
                <input type="number" className="input" min={1500} step={500}
                  value={form.testimonials_interval_ms}
                  onChange={(e) => setForm({ ...form, testimonials_interval_ms: e.target.value })}
                  placeholder="Ex: 5000 = 5 segundos" />
                <p className="text-xs text-brown-400 mt-1">Padrão: 5000ms (5 segundos). Mínimo: 1500ms.</p>
              </div>
            </div>

            <div className="rounded-xl border border-cream-200 bg-cream-50/50 overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-3 p-4 border-b border-cream-200 bg-white/60">
                <div>
                  <h4 className="font-display font-semibold text-brown-800 text-sm">Depoimentos cadastrados</h4>
                  <p className="text-xs text-brown-500 mt-0.5">{loadingTestimonials ? 'Carregando...' : `${filteredTestimonials.length} resultado(s)`} — são exibidos no site apenas os marcados como "Ativo"</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brown-400" />
                    <input type="text" className="input pl-8 py-2 text-sm w-48 sm:w-64" placeholder="Buscar por nome ou texto..."
                      value={testimonialSearch} onChange={(e) => setTestimonialSearch(e.target.value)} />
                  </div>
                  <button type="button" onClick={() => openTestimonialModal()} className="btn-primary py-2 px-3 text-sm whitespace-nowrap">
                    <Plus size={14} /> Adicionar depoimento
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream-100/80 text-brown-600 text-xs uppercase tracking-wide">
                      <th className="text-left font-semibold px-4 py-3">Cliente</th>
                      <th className="text-left font-semibold px-4 py-3">Nota</th>
                      <th className="text-left font-semibold px-4 py-3">Ordem</th>
                      <th className="text-left font-semibold px-4 py-3">Status</th>
                      <th className="text-right font-semibold px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    {loadingTestimonials ? (
                      <tr><td colSpan={5} className="text-center py-8 text-brown-500">Carregando...</td></tr>
                    ) : filteredTestimonials.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-brown-500">
                        <Quote size={28} className="mx-auto mb-2 text-honey-300 opacity-60" />
                        <p className="text-sm">{testimonialSearch.trim() ? 'Nenhum depoimento encontrado na busca.' : 'Nenhum depoimento cadastrado ainda.'}</p>
                        <p className="text-xs mt-1 opacity-70">Clique em "Adicionar depoimento" para começar.</p>
                      </td></tr>
                    ) : (filteredTestimonials.map((t) => (
                      <tr key={t.id} className="hover:bg-cream-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-cream-200 flex-shrink-0 flex items-center justify-center text-brown-500">
                              {t.photo_url ? (<img src={t.photo_url} alt={t.name} className="w-full h-full object-cover" />) : (<UserRound size={18} />)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-brown-800 truncate">{t.name}</p>
                              {t.role && (<p className="text-xs text-brown-500 truncate">{t.role}</p>)}
                              <p className="text-xs text-brown-500/80 truncate max-w-xs line-clamp-1 mt-0.5">{t.text}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= t.rating ? 'text-honey-500 fill-honey-500' : 'text-brown-300'} />)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-brown-600 font-mono text-xs w-20">{t.order_index || 0}</td>
                        <td className="px-4 py-3 w-28">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${t.active ? 'bg-green-100 text-green-700' : 'bg-brown-100 text-brown-600'}`}>{t.active ? 'Ativo' : 'Inativo'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => openTestimonialModal(t)} className="p-2 rounded-lg text-brown-600 hover:bg-cream-100 hover:text-brown-900" title="Editar"><Pencil size={14} /></button>
                            <button type="button" onClick={() => setTestimonialDeleteConfirm(t.id)} className="p-2 rounded-lg text-brown-600 hover:bg-red-50 hover:text-red-700" title="Excluir"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            {testimonialDeleteConfirm && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Trash2 size={16} /></div>
                  <div>
                    <p className="font-semibold text-red-800 text-sm">Confirmar exclusão?</p>
                    <p className="text-xs text-red-600/90">Esta ação é irreversível — o depoimento e a foto (se houver) serão permanentemente removidos.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setTestimonialDeleteConfirm(null)} className="btn-outline py-2 px-4 text-sm">Cancelar</button>
                  <button type="button" onClick={() => { const t = testimonials.find(x => x.id === testimonialDeleteConfirm); if (t) void handleDeleteTestimonial(t) }} className="btn-primary py-2 px-4 text-sm !bg-red-500 hover:!bg-red-600">Sim, excluir</button>
                </div>
              </div>
            )}
          </div>

          {/* ============== SEÇÃO: GALERIA DE FOTOS ============== */}
          <div className="pt-8 mt-8 border-t border-dashed border-cream-300 space-y-4">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-lg bg-honey-100 text-honey-700 flex items-center justify-center"><Images size={20} /></div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-brown-900">Galeria de Fotos (Quem Somos + Nossa História)</h3>
                <p className="text-xs text-brown-500">Carrosséis de fotos exibidos na página inicial dentro das seções Quem Somos (Sobre) e Nossa História</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 pl-4 border-l border-cream-200 max-w-lg">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.gallery_about_enabled === 'true'}
                      onChange={(e) => setForm({ ...form, gallery_about_enabled: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 accent-honey-500" />
                    <span className="text-sm font-medium text-brown-700">Exibir no Sobre</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.gallery_story_enabled === 'true'}
                      onChange={(e) => setForm({ ...form, gallery_story_enabled: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 accent-honey-500" />
                    <span className="text-sm font-medium text-brown-700">Exibir na História</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-cream-200 p-4 bg-white space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-display font-semibold text-brown-800 text-sm">🖼️ Carrossel do Quem Somos (Sobre)</h4>
                    <p className="text-xs text-brown-500 mt-0.5">Fotos com seção = Sobre. Se não houver fotos, usará a foto única do Sobre (acima) como fallback.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.gallery_about_autoplay === 'true'}
                      onChange={(e) => setForm({ ...form, gallery_about_autoplay: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 accent-honey-500" />
                    <span className="text-sm font-medium text-brown-700">Auto-play</span>
                  </label>
                </div>
                <div>
                  <label className="label">Intervalo entre fotos <span className="text-xs font-normal text-brown-500">(ms)</span></label>
                  <input type="number" min={1000} step={500} className="input"
                    value={form.gallery_about_interval_ms}
                    onChange={(e) => setForm({ ...form, gallery_about_interval_ms: e.target.value })}
                    placeholder="4500" />
                  <p className="text-[11px] text-brown-500 mt-1">Mínimo 1000ms. Padrão: 4500ms (4,5s).</p>
                </div>
              </div>

              <div className="rounded-xl border border-cream-200 p-4 bg-white space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-display font-semibold text-brown-800 text-sm">📖 Carrossel da Nossa História</h4>
                    <p className="text-xs text-brown-500 mt-0.5">Fotos com seção = História. Se não houver fotos, o carrossel não é exibido.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.gallery_story_autoplay === 'true'}
                      onChange={(e) => setForm({ ...form, gallery_story_autoplay: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 accent-honey-500" />
                    <span className="text-sm font-medium text-brown-700">Auto-play</span>
                  </label>
                </div>
                <div>
                  <label className="label">Intervalo entre fotos <span className="text-xs font-normal text-brown-500">(ms)</span></label>
                  <input type="number" min={1000} step={500} className="input"
                    value={form.gallery_story_interval_ms}
                    onChange={(e) => setForm({ ...form, gallery_story_interval_ms: e.target.value })}
                    placeholder="4500" />
                  <p className="text-[11px] text-brown-500 mt-1">Mínimo 1000ms. Padrão: 4500ms (4,5s).</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-cream-200 bg-cream-50/50 overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-3 p-4 border-b border-cream-200 bg-white/60">
                <div>
                  <h4 className="font-display font-semibold text-brown-800 text-sm">Fotos da galeria</h4>
                  <p className="text-xs text-brown-500 mt-0.5">{loadingGallery ? 'Carregando...' : `${filteredGallery.length} resultado(s)`} — quantas fotos quiser, sem limite.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brown-400" />
                    <input type="text" className="input pl-8 py-2 text-sm w-48 sm:w-64" placeholder="Buscar por título/seção..."
                      value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)} />
                  </div>
                  <button type="button" onClick={() => openGalleryModal()} className="btn-primary py-2 px-3 text-sm whitespace-nowrap"><Plus size={14} /> Adicionar foto</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream-100/80 text-brown-600 text-xs uppercase tracking-wide">
                      <th className="text-left font-semibold px-4 py-3">Foto</th>
                      <th className="text-left font-semibold px-4 py-3">Seção</th>
                      <th className="text-left font-semibold px-4 py-3">Título / Descrição</th>
                      <th className="text-left font-semibold px-4 py-3">Ordem</th>
                      <th className="text-left font-semibold px-4 py-3">Status</th>
                      <th className="text-right font-semibold px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    {loadingGallery ? (
                      <tr><td colSpan={6} className="text-center py-8 text-brown-500">Carregando...</td></tr>
                    ) : filteredGallery.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-brown-500">
                        <Images size={28} className="mx-auto mb-2 text-honey-300 opacity-60" />
                        <p className="text-sm">{gallerySearch.trim() ? 'Nenhuma foto encontrada na busca.' : 'Nenhuma foto cadastrada ainda.'}</p>
                        <p className="text-xs mt-1 opacity-70">Clique em "Adicionar foto" para começar a montar sua galeria.</p>
                      </td></tr>
                    ) : (filteredGallery.map((g) => (
                      <tr key={g.id} className="hover:bg-cream-50/70">
                        <td className="px-4 py-3 w-24">
                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                            {g.image_url ? (<img src={g.image_url} alt={g.title || 'foto'} className="w-full h-full object-cover" />) : (
                              <div className="w-full h-full flex items-center justify-center text-brown-400"><ImageIcon size={16} /></div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 w-28">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-honey-100 text-honey-800">{sectionLabel(g.section)}</span>
                        </td>
                        <td className="px-4 py-3 min-w-0">
                          <p className="font-semibold text-brown-800 truncate">{g.title || <span className="text-brown-400 italic font-normal">(sem título)</span>}</p>
                          {g.description && (<p className="text-xs text-brown-500 truncate max-w-sm line-clamp-1 mt-0.5">{g.description}</p>)}
                        </td>
                        <td className="px-4 py-3 text-brown-600 font-mono text-xs w-20">{g.order_index || 0}</td>
                        <td className="px-4 py-3 w-28">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${g.active ? 'bg-green-100 text-green-700' : 'bg-brown-100 text-brown-600'}`}>{g.active ? 'Ativo' : 'Inativo'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => openGalleryModal(g)} className="p-2 rounded-lg text-brown-600 hover:bg-cream-100 hover:text-brown-900" title="Editar"><Pencil size={14} /></button>
                            <button type="button" onClick={() => setGalleryDeleteConfirm(g.id)} className="p-2 rounded-lg text-brown-600 hover:bg-red-50 hover:text-red-700" title="Excluir"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            {galleryDeleteConfirm && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Trash2 size={16} /></div>
                  <div>
                    <p className="font-semibold text-red-800 text-sm">Confirmar exclusão da foto?</p>
                    <p className="text-xs text-red-600/90">A foto será removida da galeria e apagada do armazenamento permanentemente.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setGalleryDeleteConfirm(null)} className="btn-outline py-2 px-4 text-sm">Cancelar</button>
                  <button type="button" onClick={() => { const g = gallery.find(x => x.id === galleryDeleteConfirm); if (g) void handleDeleteGallery(g) }} className="btn-primary py-2 px-4 text-sm !bg-red-500 hover:!bg-red-600">Sim, excluir</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving || settingsLoading} className="btn-primary">
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Conteúdo'}
        </button>
      </div>

      {/* ============== Modal: adicionar/editar depoimento ============== */}
      {testimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 bg-gradient-to-r from-honey-50 to-amber-50">
              <h3 className="font-display text-lg font-bold text-brown-900">{testimonialForm.id ? 'Editar depoimento' : 'Adicionar depoimento'}</h3>
              <button type="button" onClick={closeTestimonialModal} disabled={testimonialFormSubmitting} className="p-1.5 rounded-lg hover:bg-white/60 text-brown-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-cream-200 border-2 border-cream-200 flex items-center justify-center text-brown-400">
                    {testimonialForm.photo_url ? (<img src={testimonialForm.photo_url} alt="" className="w-full h-full object-cover" />) : (<UserRound size={32} />)}
                  </div>
                  <div className="flex flex-col gap-1 mt-2 w-full">
                    <button type="button" onClick={() => testimonialPhotoInputRef.current?.click()} disabled={uploading} className="btn-outline py-1.5 px-2 text-xs w-full">
                      <Upload size={12} /> {uploading ? 'Enviando...' : 'Foto cliente'}
                    </button>
                    {testimonialForm.photo_url && (
                      <button type="button" onClick={() => setTestimonialForm({ ...testimonialForm, photo_url: '' })} className="btn-ghost py-1.5 px-2 text-xs w-full text-red-600 hover:bg-red-50 hover:text-red-700">
                        <Trash2 size={12} /> Remover foto
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="label">Nome do cliente <span className="text-red-500">*</span></label>
                    <input type="text" className="input" value={testimonialForm.name}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                      placeholder="Ex: Mariana Souza" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Cargo / Relacionamento <span className="text-xs text-brown-500 font-normal">(opcional)</span></label>
                    <input type="text" className="input" value={testimonialForm.role}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, role: e.target.value })}
                      placeholder="Ex: Cliente desde 2023, Família Silva" />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Nota <span className="text-red-500">*</span> <span className="text-xs text-brown-500 font-normal ml-2">(clique nas estrelas)</span></label>
                <div className="flex items-center gap-1 bg-cream-50 rounded-xl p-3 border border-cream-200">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setTestimonialForm({ ...testimonialForm, rating: n })} className="p-1.5 rounded-lg transition-transform hover:scale-110">
                      <Star size={24} className={n <= testimonialForm.rating ? 'text-honey-500 fill-honey-500 drop-shadow-sm' : 'text-brown-300 hover:text-honey-300'} />
                    </button>
                  ))}
                  <span className="ml-3 text-sm font-semibold text-brown-700">{testimonialForm.rating} de 5 estrelas</span>
                </div>
              </div>
              <div>
                <label className="label">Texto do depoimento <span className="text-red-500">*</span>
                  <span className="text-xs text-brown-500 font-normal ml-2">({testimonialForm.text.length}/500)</span>
                </label>
                <textarea rows={5} maxLength={500} className="input resize-none" value={testimonialForm.text}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, text: e.target.value.slice(0, 500) })}
                  placeholder="Escreva aqui o depoimento do cliente sobre o mel..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ordem de exibição</label>
                  <input type="number" className="input" value={testimonialForm.order_index}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, order_index: Number(e.target.value) || 0 })}
                    placeholder="0" />
                  <p className="text-[11px] text-brown-500 mt-1">Números MENORES aparecem PRIMEIRO.</p>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-3 pt-2 bg-cream-50 rounded-xl p-3 border border-cream-200 w-full h-full">
                    <input id="testimonial_active_content" type="checkbox" checked={testimonialForm.active}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, active: e.target.checked })}
                      className="w-5 h-5 accent-honey-500 cursor-pointer" />
                    <label htmlFor="testimonial_active_content" className="cursor-pointer select-none">
                      <p className="font-semibold text-brown-800 text-sm">Depoimento ativo</p>
                      <p className="text-xs text-brown-500">Desmarcado não aparece no site.</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-cream-200 bg-cream-50/50">
              <button type="button" onClick={closeTestimonialModal} disabled={testimonialFormSubmitting} className="btn-outline py-2 text-sm">Cancelar</button>
              <button type="button" onClick={handleSaveTestimonial} disabled={testimonialFormSubmitting} className="btn-primary py-2 text-sm">
                {testimonialFormSubmitting ? 'Salvando...' : testimonialForm.id ? 'Salvar alterações' : 'Adicionar depoimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============== Modal: adicionar/editar foto galeria ============== */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 bg-gradient-to-r from-honey-50 to-amber-50">
              <h3 className="font-display text-lg font-bold text-brown-900">{galleryForm.id ? 'Editar foto da galeria' : 'Adicionar foto da galeria'}</h3>
              <button type="button" onClick={closeGalleryModal} disabled={galleryFormSubmitting} className="p-1.5 rounded-lg hover:bg-white/60 text-brown-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <label className="label">Foto <span className="text-red-500">*</span></label>
                  <div className="w-full aspect-[21/9] rounded-xl overflow-hidden border-2 border-cream-200 bg-cream-100 flex items-center justify-center">
                    {galleryForm.image_url ? (<img src={galleryForm.image_url} alt="" className="w-full h-full object-cover" />) : (
                      <div className="text-center text-brown-400 text-xs px-2">
                        <Images size={32} className="mx-auto mb-1 opacity-60" />
                        <p>Sem foto</p>
                        <p className="opacity-70 text-[10px]">Clique abaixo p/ enviar</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => galleryImageInputRef.current?.click()} disabled={uploading} className="btn-outline py-2 px-3 text-sm flex-1">
                      <Upload size={14} /> {uploading ? 'Enviando...' : galleryForm.image_url ? 'Trocar foto' : 'Enviar foto'}
                    </button>
                    {galleryForm.image_url && (
                      <button type="button" onClick={() => setGalleryForm({ ...galleryForm, image_url: '' })} className="btn-ghost py-2 px-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700">
                        <Trash2 size={14} /> Remover
                      </button>
                    )}
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 text-xs text-blue-900 p-3 flex gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                    </svg>
                    <p><strong>Dica:</strong> use fotos na proporção <strong>21:9</strong> (panorâmica horizontal) para o carrossel ficar alinhado sem cortes. Ex: 1680×720 px.</p>
                  </div>
                </div>
                <div className="md:col-span-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Seção de destino</label>
                      <select className="input" value={galleryForm.section}
                        onChange={(e) => setGalleryForm({ ...galleryForm, section: e.target.value as GallerySection })}>
                        <option value="story">Nossa História</option>
                        <option value="about">Quem Somos</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Ordem de exibição</label>
                      <input type="number" className="input" value={galleryForm.order_index}
                        onChange={(e) => setGalleryForm({ ...galleryForm, order_index: Number(e.target.value) || 0 })}
                        placeholder="0" />
                      <p className="text-[11px] text-brown-500 mt-1">Menores = primeiro.</p>
                    </div>
                  </div>
                  <div>
                    <label className="label">Título <span className="text-xs text-brown-500 font-normal">(opcional, aparece na foto)</span></label>
                    <input type="text" className="input" value={galleryForm.title}
                      onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                      placeholder="Ex: Nossa colmeia na serra" />
                  </div>
                  <div>
                    <label className="label">Descrição <span className="text-xs text-brown-500 font-normal">(opcional, abaixo do título)</span></label>
                    <textarea rows={3} className="input resize-none" value={galleryForm.description}
                      onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                      placeholder="Ex: Extração do mel orgânico de setembro de 2025, na região de Ubá-MG." />
                  </div>
                  <div className="flex items-center gap-3 bg-cream-50 rounded-xl p-3 border border-cream-200">
                    <input id="gallery_active_content" type="checkbox" checked={galleryForm.active}
                      onChange={(e) => setGalleryForm({ ...galleryForm, active: e.target.checked })}
                      className="w-5 h-5 accent-honey-500 cursor-pointer" />
                    <label htmlFor="gallery_active_content" className="cursor-pointer select-none">
                      <p className="font-semibold text-brown-800 text-sm">Foto ativa</p>
                      <p className="text-xs text-brown-500">Desmarcado não aparece no carrossel do site.</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-cream-200 bg-cream-50/50">
              <button type="button" onClick={closeGalleryModal} disabled={galleryFormSubmitting} className="btn-outline py-2 text-sm">Cancelar</button>
              <button type="button" onClick={handleSaveGallery} disabled={galleryFormSubmitting} className="btn-primary py-2 text-sm">
                {galleryFormSubmitting ? 'Salvando...' : galleryForm.id ? 'Salvar alterações' : 'Adicionar foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
