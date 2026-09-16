import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency,
  calculateFinalPrice,
} from '@/utils/formatters'
import type { Product, ProductImage } from '@/types'

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function AdminProducts() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [toast, setToast] = useState<Toast | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadProducts = async () => {
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
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error

      const parsed = (data || []).map((p: any) => ({
        ...p,
        images: ((p.images || []) as ProductImage[]).sort(
          (a, b) => a.display_order - b.display_order
        ),
      })) as Product[]

      setProducts(parsed)
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const getImageUrl = (product: Product): string | null => {
    const first = product.images?.[0]
    if (!first) return null
    if (first.public_url) return first.public_url
    const { data } = supabase.storage
      .from('product_images')
      .getPublicUrl(first.storage_path)
    return data?.publicUrl || null
  }

  const handleToggleAvailable = async (product: Product) => {
    try {
      setTogglingId(product.id + ':av')
      const table = supabase.from('products') as any
      const { error } = await table
        .update({
          is_available: !product.is_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
      if (error) throw error
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_available: !p.is_available } : p
        )
      )
      showToast('success', 'Status atualizado com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao atualizar')
    } finally {
      setTogglingId(null)
    }
  }

  const handleToggleVisible = async (product: Product) => {
    try {
      setTogglingId(product.id + ':vis')
      const table = supabase.from('products') as any
      const { error } = await table
        .update({
          is_visible: !product.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
      if (error) throw error
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_visible: !p.is_visible } : p
        )
      )
      showToast('success', 'Status atualizado com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao atualizar')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (product: Product) => {
    if (
      !confirm(
        `Deseja realmente excluir o produto "${product.name}"? Essa ação não pode ser desfeita.`
      )
    ) {
      return
    }
    try {
      setDeletingId(product.id)

      if (product.images && product.images.length > 0) {
        const paths = product.images.map((i) => i.storage_path)
        try {
          await supabase.storage.from('product_images').remove(paths)
        } catch {
          // ignore storage errors
        }
      }

      const table = supabase.from('products') as any
      const { error } = await table
        .delete()
        .eq('id', product.id)
      if (error) throw error

      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      showToast('success', 'Produto excluído com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao excluir')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Produtos</h2>
          <p className="text-sm text-brown-500 mt-1">
            {products.length} {products.length === 1 ? 'produto' : 'produtos'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadProducts}
            className="btn-outline text-sm py-2 px-4"
          >
            Atualizar
          </button>
          <Link to="/admin/produtos/novo" className="btn-primary">
            <Plus size={16} /> Novo Produto
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brown-500">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={28} className="text-brown-400" />
            </div>
            <p className="text-brown-500 mb-4">Nenhum produto cadastrado.</p>
            <Link to="/admin/produtos/novo" className="btn-primary">
              <Plus size={16} /> Cadastrar primeiro produto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Imagem
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Desconto
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Exibir
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Disponível
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Ordem
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {products.map((product) => {
                  const imgUrl = getImageUrl(product)
                  const finalPrice = calculateFinalPrice(
                    product.price,
                    product.discount_percent
                  )
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-cream-50 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="w-14 h-14 rounded-lg bg-cream-100 flex items-center justify-center overflow-hidden border border-cream-200">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon
                              size={20}
                              className="text-brown-400"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-brown-900">
                          {product.name}
                        </p>
                        {product.size && (
                          <p className="text-xs text-brown-500 mt-0.5">
                            {product.size}
                          </p>
                        )}
                        <p className="text-xs text-brown-400 mt-0.5">
                          /produto/{product.slug}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        {product.discount_percent > 0 ? (
                          <div>
                            <p className="text-xs text-brown-400 line-through">
                              {formatCurrency(product.price)}
                            </p>
                            <p className="font-semibold text-green-700">
                              {formatCurrency(finalPrice)}
                            </p>
                          </div>
                        ) : (
                          <p className="font-semibold text-brown-900">
                            {formatCurrency(product.price)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        {product.discount_percent > 0 ? (
                          <span className="badge bg-green-100 text-green-800">
                            -{product.discount_percent}%
                          </span>
                        ) : (
                          <span className="text-brown-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleVisible(product)}
                          disabled={togglingId === product.id + ':vis'}
                          className={`inline-flex items-center h-6 rounded-full w-11 transition-colors relative ${
                            product.is_visible ? 'bg-green-500' : 'bg-brown-300'
                          }`}
                        >
                          <span
                            className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform shadow ${
                              product.is_visible
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleAvailable(product)}
                          disabled={togglingId === product.id + ':av'}
                          className={`inline-flex items-center h-6 rounded-full w-11 transition-colors relative ${
                            product.is_available ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          <span
                            className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform shadow ${
                              product.is_available
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <span className="font-mono text-sm text-brown-700">
                          {product.display_order}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/produtos/${product.id}`}
                            title="Editar"
                            className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            title="Excluir"
                            className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
