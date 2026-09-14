import { useState, useEffect } from 'react'
import { Save, Phone, AtSign, Building2, CreditCard, Truck, Plus, Pencil, X, MapPin, Trash2, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { formatCurrency } from '@/utils/formatters'
import type { ShippingRule, ShippingMode, ShippingOutsideBehavior } from '@/types'

interface Toast {
  type: 'success' | 'error'
  message: string
}

interface FormState {
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
  enable_pickup: string
  pickup_address: string
  pickup_city_state: string
  pickup_hours: string
}

interface RuleFormState {
  id?: string
  city: string
  state: string
  value: number
  delivery_estimate: string
  active: boolean
}

export default function AdminSettings() {
  const { settings, loading: settingsLoading, reloadSettings } = useSiteSettings()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [form, setForm] = useState<FormState>({
    company_name: '',
    whatsapp: '',
    instagram: '',
    pix_key: '',
    pix_recipient_name: '',
    pix_city: '',
    shipping_type: 'fixed',
    shipping_value: 0,
    shipping_mode: 'fixed',
    shipping_outside_rules_behavior: 'block',
    shipping_blocked_message:
      'No momento não entregamos em sua cidade. Consulte a opção de retirada na loja ou entre em contato pelo WhatsApp.',
    enable_pickup: 'true',
    pickup_address: '',
    pickup_city_state: '',
    pickup_hours: '',
  })
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([])
  const [loadingRules, setLoadingRules] = useState(false)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [ruleForm, setRuleForm] = useState<RuleFormState>({
    city: '',
    state: '',
    value: 0,
    delivery_estimate: '',
    active: true,
  })
  const [ruleFormSubmitting, setRuleFormSubmitting] = useState(false)
  const [ruleSearch, setRuleSearch] = useState('')

  const loadShippingRules = async () => {
    try {
      setLoadingRules(true)
      const { data, error } = await supabase
        .from('shipping_rules')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      setShippingRules((data || []) as ShippingRule[])
    } catch (err: any) {
      console.warn('[shipping_rules] load skipped:', err.message)
      setShippingRules([])
    } finally {
      setLoadingRules(false)
    }
  }

  useEffect(() => {
    loadShippingRules()
  }, [])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!settingsLoading) {
      setForm({
        company_name: settings.company_name || '',
        whatsapp: settings.whatsapp || '',
        instagram: settings.instagram || '',
        pix_key: settings.pix_key || '',
        pix_recipient_name: settings.pix_recipient_name || '',
        pix_city: settings.pix_city || '',
        shipping_type: settings.shipping_type || 'fixed',
        shipping_value: Number(settings.shipping_value) || 0,
        shipping_mode: settings.shipping_mode || 'fixed',
        shipping_outside_rules_behavior: settings.shipping_outside_rules_behavior || 'block',
        shipping_blocked_message:
          settings.shipping_blocked_message ||
          'No momento não entregamos em sua cidade. Consulte a opção de retirada na loja ou entre em contato pelo WhatsApp.',
        enable_pickup: settings.enable_pickup !== undefined ? settings.enable_pickup : 'true',
        pickup_address: settings.pickup_address || '',
        pickup_city_state: settings.pickup_city_state || '',
        pickup_hours: settings.pickup_hours || '',
      })
    }
  }, [settingsLoading, settings])

  const openRuleModal = (rule?: ShippingRule) => {
    if (rule) {
      setRuleForm({
        id: rule.id,
        city: rule.city,
        state: rule.state || '',
        value: Number(rule.value) || 0,
        delivery_estimate: rule.delivery_estimate || '',
        active: rule.active,
      })
    } else {
      setRuleForm({
        city: '',
        state: '',
        value: Number(form.shipping_value) || 0,
        delivery_estimate: '',
        active: true,
      })
    }
    setRuleModalOpen(true)
  }

  const closeRuleModal = () => {
    setRuleModalOpen(false)
    setRuleFormSubmitting(false)
  }

  const handleSaveRule = async () => {
    if (!ruleForm.city.trim()) {
      showToast('error', 'Informe o nome da cidade')
      return
    }
    if (ruleForm.value < 0) {
      showToast('error', 'Valor do frete não pode ser negativo')
      return
    }
    try {
      setRuleFormSubmitting(true)
      const payload = {
        city: ruleForm.city.trim(),
        state: (ruleForm.state || '').toUpperCase().trim().slice(0, 2),
        value: Number(ruleForm.value) || 0,
        delivery_estimate: ruleForm.delivery_estimate.trim(),
        active: ruleForm.active,
        updated_at: new Date().toISOString(),
      }
      if (ruleForm.id) {
        const tableUpdate = supabase.from('shipping_rules') as any
        const { error } = await tableUpdate
          .update(payload)
          .eq('id', ruleForm.id)
        if (error) throw error
        showToast('success', 'Regra atualizada!')
      } else {
        const tableInsert = supabase.from('shipping_rules') as any
        const { error } = await tableInsert
          .insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
        showToast('success', 'Regra adicionada!')
      }
      await loadShippingRules()
      closeRuleModal()
    } catch (err: any) {
      const msg = err?.message || 'Erro ao salvar regra'
      if (msg.includes('duplicate key') || msg.includes('idx_shipping_rules_city_state')) {
        showToast('error', 'Já existe uma regra para essa cidade/UF. Edite a existente.')
      } else {
        showToast('error', msg)
      }
    } finally {
      setRuleFormSubmitting(false)
    }
  }

  const handleDeleteRule = async (rule: ShippingRule) => {
    if (!confirm(`Excluir regra de frete para ${rule.city}${rule.state ? `/${rule.state}` : ''}?`)) {
      return
    }
    try {
      const { error } = await supabase
        .from('shipping_rules')
        .delete()
        .eq('id', rule.id)
      if (error) throw error
      await loadShippingRules()
      showToast('success', 'Regra excluída!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao excluir regra')
    }
  }

  const handleToggleRuleActive = async (rule: ShippingRule) => {
    try {
      const tableToggle = supabase.from('shipping_rules') as any
      const { error } = await tableToggle
        .update({ active: !rule.active, updated_at: new Date().toISOString() })
        .eq('id', rule.id)
      if (error) throw error
      await loadShippingRules()
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao alterar status')
    }
  }

  const filteredRules = shippingRules.filter((r) => {
    if (!ruleSearch.trim()) return true
    const q = ruleSearch.trim().toLowerCase()
    return (
      r.city.toLowerCase().includes(q) ||
      (r.state || '').toLowerCase().includes(q) ||
      r.delivery_estimate.toLowerCase().includes(q)
    )
  })

  const handleSave = async () => {
    try {
      setSaving(true)

      const rows: Array<{ key: string; value: string }> = [
        { key: 'company_name', value: form.company_name.trim() },
        { key: 'whatsapp', value: form.whatsapp.trim() },
        { key: 'instagram', value: form.instagram.trim() },
        { key: 'pix_key', value: form.pix_key.trim() },
        { key: 'pix_recipient_name', value: form.pix_recipient_name.trim() },
        { key: 'pix_city', value: form.pix_city.trim() },
        { key: 'shipping_type', value: form.shipping_type },
        { key: 'shipping_value', value: String(Number(form.shipping_value) || 0) },
        { key: 'shipping_mode', value: form.shipping_mode },
        { key: 'shipping_outside_rules_behavior', value: form.shipping_outside_rules_behavior },
        { key: 'shipping_blocked_message', value: form.shipping_blocked_message.trim() },
        { key: 'enable_pickup', value: form.enable_pickup },
        { key: 'pickup_address', value: form.pickup_address.trim() },
        { key: 'pickup_city_state', value: form.pickup_city_state.trim() },
        { key: 'pickup_hours', value: form.pickup_hours.trim() },
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
      showToast('success', 'Configurações salvas com sucesso!')
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
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
            <h2 className="font-display text-2xl font-bold">Configurações</h2>
            <p className="text-sm text-brown-500 mt-1">
              Informações técnicas da loja: dados, pagamento, frete e retirada
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || settingsLoading}
            className="btn-primary"
          >
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-cream-200">
              <div className="w-10 h-10 rounded-lg bg-honey-100 text-honey-700 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">
                  Dados da Loja
                </h3>
                <p className="text-xs text-brown-500">
                  Informações públicas da sua marca
                </p>
              </div>
            </div>

            <div>
              <label className="label">Nome da Empresa</label>
              <input
                type="text"
                className="input"
                value={form.company_name}
                onChange={(e) =>
                  setForm({ ...form, company_name: e.target.value })
                }
                placeholder="Ex: MEL LILIAM"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <Phone size={14} /> WhatsApp
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="label flex items-center gap-1.5">
                  <AtSign size={14} /> Instagram
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.instagram}
                  onChange={(e) =>
                    setForm({ ...form, instagram: e.target.value })
                  }
                  placeholder="@usuario"
                />
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-cream-200">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">
                  Dados do PIX
                </h3>
                <p className="text-xs text-brown-500">
                  Usados para gerar o QR Code de pagamento
                </p>
              </div>
            </div>

            <div>
              <label className="label">Chave PIX</label>
              <input
                type="text"
                className="input"
                value={form.pix_key}
                onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
                placeholder="CPF, CNPJ, email ou chave aleatória"
              />
            </div>

            <div>
              <label className="label">Nome do Favorecido</label>
              <input
                type="text"
                className="input"
                value={form.pix_recipient_name}
                onChange={(e) =>
                  setForm({ ...form, pix_recipient_name: e.target.value })
                }
                placeholder="Nome completo do titular"
              />
            </div>

            <div>
              <label className="label">Cidade</label>
              <input
                type="text"
                className="input"
                value={form.pix_city}
                onChange={(e) => setForm({ ...form, pix_city: e.target.value })}
                placeholder="Cidade onde a conta foi aberta"
              />
            </div>
          </div>

          <div className="card p-5 space-y-5 lg:col-span-2">
            <div className="flex items-center gap-3 pb-2 border-b border-cream-200">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Truck size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Envio</h3>
                <p className="text-xs text-brown-500">
                  Configurações de frete da loja (valor geral ou tabela por cidade)
                </p>
              </div>
            </div>

            <div>
              <label className="label">Modo de cálculo do frete</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.shipping_mode === 'fixed'
                      ? 'border-honey-500 bg-honey-50'
                      : 'border-cream-200 bg-white hover:border-cream-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping_mode"
                    value="fixed"
                    checked={form.shipping_mode === 'fixed'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        shipping_mode: e.target.value as ShippingMode,
                      })
                    }
                    className="mt-1 accent-honey-500"
                  />
                  <div>
                    <p className="font-semibold text-brown-900">Valor Geral</p>
                    <p className="text-sm text-brown-500 mt-0.5">
                      Mesma regra (grátis ou valor fixo) para todo o Brasil
                    </p>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.shipping_mode === 'rules'
                      ? 'border-honey-500 bg-honey-50'
                      : 'border-cream-200 bg-white hover:border-cream-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping_mode"
                    value="rules"
                    checked={form.shipping_mode === 'rules'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        shipping_mode: e.target.value as ShippingMode,
                      })
                    }
                    className="mt-1 accent-honey-500"
                  />
                  <div>
                    <p className="font-semibold text-brown-900">
                      Tabela por Cidade
                    </p>
                    <p className="text-sm text-brown-500 mt-0.5">
                      Valor individual por cidade (ex: Ubá = R$10, Visconde do Rio Branco = R$15)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {form.shipping_mode === 'fixed' && (
              <div className="space-y-4 border-t border-cream-100 pt-4">
                <div>
                  <label className="label">Tipo de envio geral</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.shipping_type === 'free'
                          ? 'border-honey-500 bg-honey-50'
                          : 'border-cream-200 bg-white hover:border-cream-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_type_general"
                        value="free"
                        checked={form.shipping_type === 'free'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            shipping_type: e.target.value as 'free' | 'fixed',
                          })
                        }
                        className="mt-1 accent-honey-500"
                      />
                      <div>
                        <p className="font-semibold text-brown-900">Frete Grátis</p>
                        <p className="text-sm text-brown-500 mt-0.5">
                          Sem custo para o cliente em todos os pedidos
                        </p>
                      </div>
                    </label>
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.shipping_type === 'fixed'
                          ? 'border-honey-500 bg-honey-50'
                          : 'border-cream-200 bg-white hover:border-cream-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_type_general"
                        value="fixed"
                        checked={form.shipping_type === 'fixed'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            shipping_type: e.target.value as 'free' | 'fixed',
                          })
                        }
                        className="mt-1 accent-honey-500"
                      />
                      <div>
                        <p className="font-semibold text-brown-900">Valor Fixo</p>
                        <p className="text-sm text-brown-500 mt-0.5">
                          Mesmo valor para todos os pedidos do Brasil
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {form.shipping_type === 'fixed' && (
                  <div className="sm:max-w-xs">
                    <label className="label">Valor do Frete (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input"
                      value={form.shipping_value}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          shipping_value: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {form.shipping_mode === 'rules' && (
              <div className="space-y-5 border-t border-cream-100 pt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex gap-3">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-700" />
                  <div className="space-y-1">
                    <p className="font-semibold">Como funciona a tabela por cidade?</p>
                    <p className="text-amber-800">
                      1. Cadastre abaixo cada cidade atendida com seu valor de frete e prazo.<br />
                      2. O cliente digita o CEP no checkout → sistema auto-completa a cidade e busca na tabela.<br />
                      3. Cidades <strong>não cadastradas</strong> são bloqueadas (mensagem abaixo).
                    </p>
                  </div>
                </div>

                <div>
                  <label className="label">
                    Para cidades NÃO cadastradas na tabela
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.shipping_outside_rules_behavior === 'block'
                          ? 'border-red-400 bg-red-50'
                          : 'border-cream-200 bg-white hover:border-cream-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_outside"
                        value="block"
                        checked={form.shipping_outside_rules_behavior === 'block'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            shipping_outside_rules_behavior: e.target.value as ShippingOutsideBehavior,
                          })
                        }
                        className="mt-1 accent-red-500"
                      />
                      <div>
                        <p className="font-semibold text-brown-900">
                          Bloquear entrega
                        </p>
                        <p className="text-sm text-brown-500 mt-0.5">
                          Recomendado: cliente não pode finalizar a compra com endereço não atendido
                        </p>
                      </div>
                    </label>
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.shipping_outside_rules_behavior === 'fixed_default'
                          ? 'border-honey-500 bg-honey-50'
                          : 'border-cream-200 bg-white hover:border-cream-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_outside"
                        value="fixed_default"
                        checked={form.shipping_outside_rules_behavior === 'fixed_default'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            shipping_outside_rules_behavior: e.target.value as ShippingOutsideBehavior,
                          })
                        }
                        className="mt-1 accent-honey-500"
                      />
                      <div>
                        <p className="font-semibold text-brown-900">
                          Usar valor fixo padrão
                        </p>
                        <p className="text-sm text-brown-500 mt-0.5">
                          Cidades fora usam o valor R$ {form.shipping_value ? formatCurrency(Number(form.shipping_value)) : '0,00'} como fallback
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">Mensagem exibida quando bloquear cidade</label>
                  <textarea
                    className="input min-h-[80px] resize-y"
                    value={form.shipping_blocked_message}
                    onChange={(e) =>
                      setForm({ ...form, shipping_blocked_message: e.target.value })
                    }
                    placeholder="No momento não entregamos em sua cidade. Consulte a opção de retirada na loja ou entre em contato pelo WhatsApp."
                  />
                </div>

                {form.shipping_outside_rules_behavior === 'fixed_default' && (
                  <div className="sm:max-w-xs">
                    <label className="label">Valor fallback para cidades fora (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input"
                      value={form.shipping_value}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          shipping_value: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <h4 className="font-display font-semibold text-brown-900 text-lg">
                      Cidades atendidas ({shippingRules.length})
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-72">
                        <svg
                          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brown-400"
                          fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" strokeWidth={2}
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
                        </svg>
                        <input
                          type="text"
                          value={ruleSearch}
                          onChange={(e) => setRuleSearch(e.target.value)}
                          placeholder="Buscar cidade/UF..."
                          className="input !pl-9 !py-2 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => openRuleModal()}
                        className="btn-primary !py-2 !px-3 text-sm whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar cidade
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-cream-200 rounded-xl shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-cream-50 text-brown-700 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold">Cidade / UF</th>
                          <th className="text-right px-4 py-3 font-semibold">Frete</th>
                          <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Prazo</th>
                          <th className="text-center px-4 py-3 font-semibold">Ativo</th>
                          <th className="text-right px-4 py-3 font-semibold w-[130px]">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-100 bg-white">
                        {loadingRules && (
                          <tr>
                            <td colSpan={5} className="text-center text-brown-500 py-6">
                              Carregando...
                            </td>
                          </tr>
                        )}
                        {!loadingRules && filteredRules.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center text-brown-500 py-8">
                              <div className="flex flex-col items-center gap-2">
                                <Truck className="w-8 h-8 text-brown-300" />
                                <p>Nenhuma cidade cadastrada ainda.</p>
                                <p className="text-xs text-brown-400">
                                  Clique em &quot;Adicionar cidade&quot; para criar a primeira regra
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {filteredRules.map((r) => (
                          <tr key={r.id} className="hover:bg-cream-50/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-honey-400" />
                                <span className="font-medium text-brown-900">{r.city}</span>
                                <span className="text-xs text-brown-500 font-semibold">
                                  / {r.state || '-'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-brown-800 tabular-nums">
                              {Number(r.value) === 0 ? (
                                <span className="text-green-700">Grátis</span>
                              ) : (
                                formatCurrency(Number(r.value))
                              )}
                            </td>
                            <td className="px-4 py-3 text-brown-700 hidden sm:table-cell">
                              {r.delivery_estimate || <span className="text-brown-400">-</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleRuleActive(r)}
                                className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  r.active ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                                aria-label="Alternar ativo"
                              >
                                <span
                                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                    r.active ? 'translate-x-5' : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => openRuleModal(r)}
                                  className="p-2 rounded-lg text-brown-600 hover:bg-honey-50 hover:text-honey-700"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRule(r)}
                                  className="p-2 rounded-lg text-brown-600 hover:bg-red-50 hover:text-red-700"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3 pb-2 border-b border-cream-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Package size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">
                  Retirada na Loja
                </h3>
                <p className="text-xs text-brown-500">
                  Configurações para retirada presencial do pedido
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enable_pickup"
                checked={form.enable_pickup === 'true'}
                onChange={(e) =>
                  setForm({ ...form, enable_pickup: e.target.checked ? 'true' : 'false' })
                }
                className="w-5 h-5 accent-honey-500 cursor-pointer"
              />
              <label
                htmlFor="enable_pickup"
                className="font-medium text-brown-800 cursor-pointer select-none"
              >
                Habilitar retirada na loja
              </label>
            </div>

            <div>
              <label className="label">Endereço de retirada</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={form.pickup_address}
                onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                placeholder="Rua xxx, Nº, Bairro"
              />
            </div>

            <div>
              <label className="label">Cidade / Estado</label>
              <input
                type="text"
                className="input"
                value={form.pickup_city_state}
                onChange={(e) => setForm({ ...form, pickup_city_state: e.target.value })}
                placeholder="Ex: São Paulo - SP"
              />
            </div>

            <div>
              <label className="label">Dias e horários disponíveis</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={form.pickup_hours}
                onChange={(e) => setForm({ ...form, pickup_hours: e.target.value })}
                placeholder="Ex: Seg a Sex 8h-18h, Sáb 9h-12h"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || settingsLoading}
            className="btn-primary"
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>

      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 bg-gradient-to-r from-honey-50 to-amber-50">
              <h3 className="font-display text-lg font-bold text-brown-900">
                {ruleForm.id ? 'Editar cidade atendida' : 'Adicionar cidade atendida'}
              </h3>
              <button
                type="button"
                onClick={closeRuleModal}
                disabled={ruleFormSubmitting}
                className="p-1.5 rounded-lg hover:bg-white/60 text-brown-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={ruleForm.city}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, city: e.target.value })
                    }
                    placeholder="Ex: Ubá, Visconde do Rio Branco"
                  />
                </div>
                <div>
                  <label className="label">UF (2 letras)</label>
                  <input
                    type="text"
                    maxLength={2}
                    className="input text-center uppercase tracking-widest"
                    value={ruleForm.state}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        state: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2),
                      })
                    }
                    placeholder="MG"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Valor do frete (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={ruleForm.value}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        value: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    placeholder="0.00 para gratuito"
                  />
                </div>
                <div>
                  <label className="label">Prazo de entrega</label>
                  <input
                    type="text"
                    className="input"
                    value={ruleForm.delivery_estimate}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, delivery_estimate: e.target.value })
                    }
                    placeholder="Ex: 2 dias úteis"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 bg-cream-50 rounded-xl p-3 border border-cream-200">
                <input
                  id="rule_active"
                  type="checkbox"
                  checked={ruleForm.active}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, active: e.target.checked })
                  }
                  className="w-5 h-5 accent-honey-500 cursor-pointer"
                />
                <label htmlFor="rule_active" className="cursor-pointer select-none">
                  <p className="font-semibold text-brown-800">Regra ativa</p>
                  <p className="text-xs text-brown-500">
                    Desmarque para pausar a entrega nessa cidade temporariamente sem excluir a regra
                  </p>
                </label>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 text-xs text-blue-900 p-3 flex gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </svg>
                <p>
                  Dica: use o nome da cidade exatamente como o serviço de CEP (viacep) retorna. Exemplo: em vez de &quot;V.R.B.&quot;, use &quot;Visconde do Rio Branco&quot;.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-cream-200 bg-cream-50/50">
              <button
                type="button"
                onClick={closeRuleModal}
                disabled={ruleFormSubmitting}
                className="btn-outline py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                disabled={ruleFormSubmitting}
                className="btn-primary py-2 text-sm"
              >
                {ruleFormSubmitting ? 'Salvando...' : ruleForm.id ? 'Salvar alterações' : 'Adicionar regra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
