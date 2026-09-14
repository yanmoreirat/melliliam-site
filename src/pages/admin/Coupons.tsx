import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, Tag, Percent, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatShortDate } from '@/utils/formatters'
import type { Coupon, CouponType } from '@/types'

interface Toast {
  type: 'success' | 'error'
  message: string
}

interface CouponFormData {
  id?: string
  code: string
  type: CouponType
  value: number
  active: boolean
  expires_at: string
}

const EMPTY_FORM: CouponFormData = {
  code: '',
  type: 'percent',
  value: 0,
  active: true,
  expires_at: '',
}

export default function AdminCoupons() {
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [toast, setToast] = useState<Toast | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CouponFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const isEdit = !!form.id

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadCoupons = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCoupons((data || []) as Coupon[])
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao carregar cupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (coupon: Coupon) => {
    setForm({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      active: coupon.active,
      expires_at: coupon.expires_at
        ? coupon.expires_at.slice(0, 10)
        : '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    try {
      if (!form.code.trim()) {
        showToast('error', 'Código do cupom é obrigatório')
        return
      }
      if (form.value <= 0) {
        showToast('error', 'Valor deve ser maior que zero')
        return
      }
      if (form.type === 'percent' && form.value > 100) {
        showToast('error', 'Desconto percentual não pode ultrapassar 100%')
        return
      }

      setSaving(true)

      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
        active: !!form.active,
        expires_at: form.expires_at || null,
      }

      if (isEdit) {
        const table = supabase.from('coupons') as any
        const { error } = await table
          .update(payload)
          .eq('id', form.id!)
        if (error) throw error
        showToast('success', 'Cupom atualizado com sucesso!')
      } else {
        const table = supabase.from('coupons') as any
        const { error } = await table.insert(payload)
        if (error) throw error
        showToast('success', 'Cupom criado com sucesso!')
      }

      closeModal()
      await loadCoupons()
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao salvar cupom')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (coupon: Coupon) => {
    try {
      setTogglingId(coupon.id)
      const table = supabase.from('coupons') as any
      const { error } = await table
        .update({ active: !coupon.active })
        .eq('id', coupon.id)
      if (error) throw error
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
      )
      showToast('success', 'Status atualizado!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao atualizar')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (coupon: Coupon) => {
    if (
      !confirm(
        `Deseja realmente excluir o cupom "${coupon.code}"? Essa ação não pode ser desfeita.`
      )
    ) {
      return
    }
    try {
      setDeletingId(coupon.id)
      const table = supabase.from('coupons') as any
      const { error } = await table.delete().eq('id', coupon.id)
      if (error) throw error
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id))
      showToast('success', 'Cupom excluído com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao excluir')
    } finally {
      setDeletingId(null)
    }
  }

  const formatValue = (type: CouponType, value: number) => {
    if (type === 'percent') return `${value}%`
    return formatCurrency(value)
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
          <h2 className="font-display text-2xl font-bold">Cupons</h2>
          <p className="text-sm text-brown-500 mt-1">
            {coupons.length} {coupons.length === 1 ? 'cupom' : 'cupons'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadCoupons}
            className="btn-outline text-sm py-2 px-4"
          >
            Atualizar
          </button>
          <button onClick={openNew} className="btn-primary">
            <Plus size={16} /> Novo Cupom
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brown-500">Carregando...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
              <Tag size={28} className="text-brown-400" />
            </div>
            <p className="text-brown-500 mb-4">Nenhum cupom cadastrado.</p>
            <button onClick={openNew} className="btn-primary">
              <Plus size={16} /> Criar primeiro cupom
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Ativo
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Expira em
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {coupons.map((coupon) => {
                  const expired =
                    coupon.expires_at &&
                    new Date(coupon.expires_at) < new Date()
                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-cream-50 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-honey-50 border border-honey-200 text-honey-800 font-mono font-bold text-sm">
                          <Tag size={14} /> {coupon.code}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {coupon.type === 'percent' ? (
                          <span className="badge bg-purple-100 text-purple-800 flex items-center gap-1 w-fit">
                            <Percent size={12} /> Percentual
                          </span>
                        ) : (
                          <span className="badge bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                            <DollarSign size={12} /> Valor Fixo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-brown-900">
                        {formatValue(coupon.type, coupon.value)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggle(coupon)}
                          disabled={togglingId === coupon.id}
                          className={`inline-flex items-center h-6 rounded-full w-11 transition-colors relative ${
                            coupon.active && !expired
                              ? 'bg-green-500'
                              : 'bg-brown-300'
                          }`}
                        >
                          <span
                            className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform shadow ${
                              coupon.active && !expired
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        {expired && (
                          <p className="text-xs text-red-600 mt-1">Expirado</p>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        {coupon.expires_at ? (
                          <span
                            className={
                              expired ? 'text-red-600' : 'text-brown-700'
                            }
                          >
                            {formatShortDate(coupon.expires_at)}
                          </span>
                        ) : (
                          <span className="text-brown-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(coupon)}
                            title="Editar"
                            className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            disabled={deletingId === coupon.id}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="font-display text-xl font-bold">
                {isEdit ? 'Editar Cupom' : 'Novo Cupom'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-cream-100 text-brown-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Código *</label>
                <input
                  type="text"
                  className="input uppercase"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="Ex: MEL10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo de Desconto *</label>
                  <select
                    className="input"
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as CouponType })
                    }
                  >
                    <option value="percent">Percentual (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    Valor *
                    {form.type === 'percent' ? ' (%)' : ' (R$)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={form.type === 'percent' ? 100 : undefined}
                    step={form.type === 'percent' ? 1 : 0.01}
                    className="input"
                    value={form.value}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        value: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="label">Data de Expiração</label>
                <input
                  type="date"
                  className="input"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                />
                <p className="text-xs text-brown-500 mt-1">
                  Deixe em branco para o cupom nunca expirar
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`inline-flex items-center h-7 rounded-full w-12 transition-colors relative ${
                    form.active ? 'bg-green-500' : 'bg-brown-300'
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform shadow ${
                      form.active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label
                  className="label !mb-0 cursor-pointer"
                  onClick={() => setForm({ ...form, active: !form.active })}
                >
                  Cupom ativo
                </label>
              </div>

              <div className="pt-4 border-t border-cream-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                >
                  <Save size={16} />
                  {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Cupom'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
