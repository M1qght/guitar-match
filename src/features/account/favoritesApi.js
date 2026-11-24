import { getSupabase } from '../../shared/supabase';
import { SUMMARY, toProduct } from '../catalog/catalogApi';

export async function fetchFavorite(userId, productId, signal) {
  const { data, error } = await getSupabase().from('favorites').select('product_id')
    .eq('user_id', userId).eq('product_id', productId).abortSignal(signal).maybeSingle();
  if (error) throw new Error('Не удалось проверить избранное.');
  return Boolean(data);
}

export async function setFavorite(userId, productId, saved) {
  const table = getSupabase().from('favorites');
  const { error } = await (saved
    ? table.upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
    : table.delete().eq('user_id', userId).eq('product_id', productId));
  if (error) throw new Error('Не удалось изменить избранное. Попробуйте ещё раз.');
}

export async function fetchFavorites(userId, kind, signal) {
  const client = getSupabase();
  let query = client.from('favorites')
    .select(`product:products!inner(${SUMMARY})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('product_id')
    .order('sort_order', { referencedTable: 'product.product_images' })
    .limit(1, { referencedTable: 'product.product_images' });
  if (kind) query = query.eq('product.kind', kind);
  const { data, error } = await query.abortSignal(signal);
  if (error) throw new Error('Не удалось загрузить избранное.');
  return data.map(({ product }) => toProduct(product, client));
}
