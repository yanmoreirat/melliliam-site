import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Save,
  ArrowLeft,
  Upload,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/utils/formatters'
import type { Product, ProductImage } from '@/types'

interface Toast {
  type: 'success' | 'error'
  message: string
}

interface ImageFormItem {
  id?: string
  tempId: string
  file?: File
  previewUrl: string
  storage_path?: string
  display_order: number
  existing?: boolean
  removed?: boolean
}

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [discount_percent, setDiscountPercent] = useState<number>(0)
  const [is_available, setIsAvailable] = useState(true)
  const [is_visible, setIsVisible] = useState(true)
  const [display_order, setDisplayOrder] = useState<number>(0)

  const [images, setImages] = useState<ImageFormItem[]>([])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadProduct = async () => {
    if (!id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          images:product_images(*)
        `
        )
        .eq('id', id)
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (!data) {
        showToast('error', 'Produto não encontrado')
        navigate('/admin/produtos')
        return
      }
      const p = data as Product & { images?: ProductImage[] }
      setName(p.name)
      setSlug(p.slug)
      setDescription(p.description)
      setSize(p.size || '')
      setPrice(p.price)
      setDiscountPercent(p.discount_percent || 0)
      setIsAvailable(p.is_available)
      setIsVisible(p.is_visible !== undefined ? !!p.is_visible : true)
      setDisplayOrder(p.display_order || 0)

      const existing = ((p.images || []) as ProductImage[])
        .sort((a, b) => a.display_order - b.display_order)
        .map((img, idx) => {
          const { data: urlData } = supabase.storage
            .from('product_images')
            .getPublicUrl(img.storage_path)
          return {
            id: img.id,
            tempId: `existing-${idx}-${img.id}`,
            previewUrl: urlData?.publicUrl || '',
            storage_path: img.storage_path,
            display_order: img.display_order,
            existing: true,
          } as ImageFormItem
        })
      setImages(existing)
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao carregar produto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEdit) {
      loadProduct()
    } else {
      setLoading(false)
    }
  }, [id])

  const handleGenerateSlug = () => {
    setSlug(slugify(name))
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newItems: ImageFormItem[] = []
    let order =
      images.length > 0
        ? Math.max(...images.map((i) => i.display_order)) + 1
        : 0
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const previewUrl = URL.createObjectURL(file)
      newItems.push({
        tempId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl,
        display_order: order++,
      })
    })
    setImages((prev) => [...prev, ...newItems])
  }

  const removeImage = (tempId: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.tempId === tempId)
      if (!item) return prev
      if (!item.existing) {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl)
        }
        return prev.filter((i) => i.tempId !== tempId)
      }
      return prev.map((i) =>
        i.tempId === tempId ? { ...i, removed: true } : i
      )
    })
  }

  const moveImage = (tempId: string, direction: -1 | 1) => {
    setImages((prev) => {
      const sorted = [...prev].sort(
        (a, b) => a.display_order - b.display_order
      )
      const idx = sorted.findIndex((i) => i.tempId === tempId)
      const newIdx = idx + direction
      if (idx < 0 || newIdx < 0 || newIdx >= sorted.length) return prev
      const temp = sorted[idx].display_order
      sorted[idx] = {
        ...sorted[idx],
        display_order: sorted[newIdx].display_order,
      }
      sorted[newIdx] = { ...sorted[newIdx], display_order: temp }
      return [...sorted]
    })
  }

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        showToast('error', 'Nome do produto é obrigatório')
        return
      }
      const finalSlug = slug.trim() || slugify(name)
      if (!finalSlug) {
        showToast('error', 'Slug inválido')
        return
      }

      setSaving(true)

      const productData = {
        name: name.trim(),
        slug: finalSlug,
        description: description || '',
        size: size || '',
        price: Number(price) || 0,
        discount_percent: Number(discount_percent) || 0,
        is_available: !!is_available,
        is_visible: !!is_visible,
        display_order: Number(display_order) || 0,
        updated_at: new Date().toISOString(),
      }

      let productId = id || ''

      if (isEdit) {
        const table = supabase.from('products') as any
        const { error } = await table
          .update(productData)
          .eq('id', id!)
        if (error) throw error
        productId = id!
      } else {
        const table = supabase.from('products') as any
        const { data: insertData, error } = await table
          .insert(productData)
          .select()
          .single()
        if (error) throw error
        productId = (insertData as any).id
      }

      const imagesToDelete = images.filter((i) => i.existing && i.removed)
      if (imagesToDelete.length > 0) {
        const paths = imagesToDelete
          .map((i) => i.storage_path)
          .filter(Boolean) as string[]
        try {
          if (paths.length > 0) {
            await supabase.storage.from('product_images').remove(paths)
          }
        } catch {
          // ignore
        }
        const idsToDelete = imagesToDelete
          .map((i) => i.id)
          .filter(Boolean) as string[]
        if (idsToDelete.length > 0) {
          try {
            await supabase
              .from('product_images')
              .delete()
              .in('id', idsToDelete)
          } catch {
            // ignore
          }
        }
      }

      const newImages = images.filter((i) => !i.existing && !i.removed)
      if (newImages.length > 0) {
        setUploading(true)
        for (let idx = 0; idx < newImages.length; idx++) {
          const img = newImages[idx]
          if (!img.file) continue
          const fileExt =
            img.file.name.split('.').pop()?.toLowerCase() || 'jpg'
          const uniqueName = `${productId}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}.${fileExt}`
          const storagePath = `products/${productId}/${uniqueName}`

          // TODO: otimizar/compress imagem antes upload

          const { error: uploadError } = await supabase.storage
            .from('product_images')
            .upload(storagePath, img.file, {
              cacheControl: '3600',
              upsert: true,
            })
          if (uploadError) {
            console.error('upload error', uploadError)
            continue
          }

          const table = supabase.from('product_images') as any
          await table.insert({
            product_id: productId,
            storage_path: storagePath,
            display_order: img.display_order,
          })
        }
        setUploading(false)
      }

      const updatedExisting = images.filter(
        (i) => i.existing && !i.removed && i.id
      )
      for (const img of updatedExisting) {
        try {
          const table = supabase.from('product_images') as any
          await table
            .update({ display_order: img.display_order })
            .eq('id', img.id!)
        } catch {
          // ignore
        }
      }

      showToast('success', 'Produto salvo com sucesso!')
      navigate('/admin/produtos')
    } catch (err: any) {
      console.error(err)
      showToast('error', err.message || 'Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  const visibleImages = images.filter((i) => !i.removed)

  if (loading) {
    return (
      <div className="space-y-5">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}
        <div className="card p-12 text-center text-brown-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/admin/produtos"
            className="p-2 rounded-lg bg-white border border-cream-300 text-brown-700 hover:bg-cream-50 transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="font-display text-2xl font-bold">
              {isEdit ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <p className="text-sm text-brown-500 mt-0.5">
              {isEdit ? 'Atualize as informações do produto' : 'Cadastre um novo produto'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5 space-y-4">
            <h3 className="font-display text-lg font-semibold">
              Informações Básicas
            </h3>

            <div>
              <label className="label">Nome *</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do produto"
                required
              />
            </div>

            <div>
              <label className="label">Slug (URL)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="nome-do-produto"
                />
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="btn-outline py-2 px-4 flex-shrink-0"
                >
                  <RefreshCw size={14} /> Gerar
                </button>
              </div>
              {slug && (
                <p className="text-xs text-brown-500 mt-1.5">
                  URL: /produto/{slug}
                </p>
              )}
            </div>

            <div>
              <label className="label">Descrição</label>
              <textarea
                className="input min-h-[140px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o produto detalhadamente..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Tamanho / Peso</label>
                <input
                  type="text"
                  className="input"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Ex: 500g, 1kg, 30ml..."
                />
              </div>
              <div>
                <label className="label">Ordem de Exibição</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={display_order}
                  onChange={(e) =>
                    setDisplayOrder(Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">Desconto (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  className="input"
                  value={discount_percent}
                  onChange={(e) =>
                    setDiscountPercent(Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsVisible(!is_visible)}
                  className={`inline-flex items-center h-7 rounded-full w-12 transition-colors relative ${
                    is_visible ? 'bg-green-500' : 'bg-brown-300'
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform shadow ${
                      is_visible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label
                  className="label !mb-0 cursor-pointer"
                  onClick={() => setIsVisible(!is_visible)}
                >
                  Exibir na página de vendas (clientes veem o produto)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAvailable(!is_available)}
                  className={`inline-flex items-center h-7 rounded-full w-12 transition-colors relative ${
                    is_available ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform shadow ${
                      is_available ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label
                  className="label !mb-0 cursor-pointer"
                  onClick={() => setIsAvailable(!is_available)}
                >
                  Disponível para venda (se desligado, mostra etiqueta "ESGOTADO" em vermelho)
                </label>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-display text-lg font-semibold">
                Imagens do Produto
              </h3>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-outline py-2 px-4 text-sm"
              >
                <Upload size={14} /> Adicionar Imagens
              </button>
            </div>

            <p className="text-sm text-brown-500">
              Você pode adicionar múltiplas imagens, reordenar e remover. A
              primeira imagem é a capa do produto.
            </p>

            {visibleImages.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-10 border-2 border-dashed border-cream-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-honey-400 hover:bg-honey-50/40 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-cream-100 flex items-center justify-center">
                  <ImageIcon size={24} className="text-brown-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-brown-700">
                    Clique para adicionar imagens
                  </p>
                  <p className="text-xs text-brown-500 mt-1">
                    JPG, PNG, WEBP — múltiplas permitido
                  </p>
                </div>
              </button>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {visibleImages
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((img, idx) => (
                    <div
                      key={img.tempId}
                      className="relative group rounded-xl overflow-hidden border border-cream-200 bg-cream-50 aspect-square"
                    >
                      <img
                        src={img.previewUrl}
                        alt={`imagem ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-honey-500 text-white text-xs font-semibold shadow">
                          Capa
                        </div>
                      )}
                      <div className="absolute inset-0 bg-brown-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveImage(img.tempId, -1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-md bg-white/90 text-brown-800 hover:bg-white disabled:opacity-40"
                            title="Mover para frente"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(img.tempId, 1)}
                            disabled={idx === visibleImages.length - 1}
                            className="p-1.5 rounded-md bg-white/90 text-brown-800 hover:bg-white disabled:opacity-40"
                            title="Mover para trás"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(img.tempId)}
                          className="p-1.5 rounded-md bg-red-500 text-white hover:bg-red-600"
                          title="Remover imagem"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-cream-300 flex flex-col items-center justify-center gap-2 text-brown-500 hover:border-honey-400 hover:text-honey-600 hover:bg-honey-50/40 transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-xs font-medium">Adicionar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <h3 className="font-display text-lg font-semibold">
              Resumo e Ações
            </h3>

            <div className="space-y-3 text-sm pt-2">
              <div className="flex justify-between">
                <span className="text-brown-500">Preço de tabela</span>
                <span className="font-semibold text-brown-900 line-through">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(price) || 0)}
                </span>
              </div>
              {discount_percent > 0 && (
                <div className="flex justify-between">
                  <span className="text-brown-500">
                    Desconto ({discount_percent}%)
                  </span>
                  <span className="font-semibold text-red-600">
                    -
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(
                      (Number(price) || 0) * (Number(discount_percent) / 100)
                    )}
                  </span>
                </div>
              )}
              <div className="pt-3 mt-2 border-t border-cream-200 flex justify-between items-center">
                <span className="font-semibold text-brown-900">Preço final</span>
                <span className="font-display text-2xl font-bold text-honey-700">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(
                    (Number(price) || 0) *
                      (1 - (Number(discount_percent) || 0) / 100)
                  )}
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploading}
                className="btn-primary w-full"
              >
                <Save size={16} />
                {saving
                  ? 'Salvando...'
                  : uploading
                  ? 'Enviando imagens...'
                  : isEdit
                  ? 'Salvar Alterações'
                  : 'Cadastrar Produto'}
              </button>
              <Link
                to="/admin/produtos"
                className="btn-ghost w-full"
              >
                Cancelar
              </Link>
            </div>
          </div>

          <div className="card p-5 space-y-3 text-sm">
            <h3 className="font-display text-lg font-semibold mb-2">Dicas</h3>
            <ul className="space-y-2 text-brown-600 list-disc list-inside">
              <li>Use nomes claros e descritivos.</li>
              <li>A primeira imagem é a capa do produto.</li>
              <li>Defina a ordem para controlar a listagem.</li>
              <li>Desative em vez de excluir, se possível.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
