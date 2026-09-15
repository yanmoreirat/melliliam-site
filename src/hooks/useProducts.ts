import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, ProductImage } from '@/types'

const getImageUrl = (storagePath: string) => {
  if (!storagePath) return ''
  if (storagePath.startsWith('http')) return storagePath
  const { data } = supabase.storage.from('product_images').getPublicUrl(storagePath)
  return data?.publicUrl || ''
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true })

      const prodsTyped = (prods || []) as Array<{
        id: string
        name: string
        slug: string
        description: string
        size: string
        price: number
        discount_percent: number
        is_available: boolean
        is_visible: boolean
        display_order: number
        created_at: string
        updated_at: string
      }>

      if (prodsTyped.length === 0) {
        setProducts([])
        return
      }

      const { data: imgs } = await supabase.from('product_images').select('*')
      const imgsTyped = (imgs || []) as Array<{
        id: string
        product_id: string
        storage_path: string
        display_order: number
        created_at: string
      }>

      const prodsWithImages: Product[] = prodsTyped.map((p) => {
        const prodImages: ProductImage[] = imgsTyped
          .filter((i) => i.product_id === p.id)
          .sort((a, b) => a.display_order - b.display_order)
          .map((i) => ({ ...i, public_url: getImageUrl(i.storage_path) }))
        return { ...p, images: prodImages }
      })

      setProducts(prodsWithImages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return { products, loading, reloadProducts: loadProducts }
}

export function useProductBySlug(slug: string) {
  const { products } = useProducts()
  return products.find((p) => p.slug === slug)
}
