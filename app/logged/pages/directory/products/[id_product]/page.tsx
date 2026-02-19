"use client";

import React, { FC, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProductService } from '@/app/service/ProductService';
import { Product } from '@/app/contents/interfaces';

interface IdProductProps {}

const IdProduct: FC<IdProductProps> = ({ }) => {
  const params = useParams();
  const productId = params.id_product as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await ProductService.getProductById(productId);
        if (!cancelled) {
          setProduct(data);
          setFormData({ ...data });
          setInitialData({ ...data });
        }
      } catch {
        if (!cancelled) {
          setProduct(null);
          setFormData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [productId]);

  const handleInputChange = (field: keyof Product, value: string | number | string[]) => {
    if (!formData) return;

    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);

    const hasChanged = JSON.stringify(newFormData) !== JSON.stringify(initialData);
    setHasChanges(hasChanged);
  };

  const handleSave = async () => {
    if (!formData || !initialData) return;
    setSaving(true);
    try {
      await ProductService.updateProduct(productId, {
        productName: formData.productName,
        price: formData.price,
        company: formData.company,
        productDescription: formData.productDescription,
        mainImageSrc: formData.mainImageSrc,
        productCategoriesArray: formData.productCategoriesArray ?? [],
      });
      setInitialData({ ...formData });
      setHasChanges(false);
    } catch (error: unknown) {
      const msg =
        typeof error === 'string'
          ? error
          : (error as { message?: string })?.message
          || (error as { data?: { message?: string } })?.data?.message
          || 'Failed to save';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full bg-white p-8">
        <p className="text-center text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product || !formData) {
    return (
      <div className="flex flex-col w-full bg-white p-8">
        <p className="text-center text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">Product Details</p>
      </div>

      <div className="px-36 mx-7 mt-8">
        <div className="bg-white border border-gray-100 shadow-xl rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product ID
              </label>
              <input
                type="text"
                value={formData.productId}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company ID
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Description
              </label>
              <textarea
                value={formData.productDescription}
                onChange={(e) => handleInputChange('productDescription', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Main Image
              </label>
              <div className="flex flex-col gap-3">
                <div className="relative w-full max-w-md h-64 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                  {formData.mainImageSrc ? (
                    <img
                      src={formData.mainImageSrc}
                      alt="Product"
                      className="absolute inset-0 w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={`text-gray-400 text-sm ${formData.mainImageSrc ? 'hidden' : ''}`} aria-hidden>
                    No image
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image URL (editable)</label>
                  <input
                    type="text"
                    value={formData.mainImageSrc}
                    onChange={(e) => handleInputChange('mainImageSrc', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Categories Array (comma-separated)
              </label>
              <input
                type="text"
                value={(formData.productCategoriesArray || []).join(', ')}
                onChange={(e) => handleInputChange('productCategoriesArray', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Category 1, Category 2, Category 3"
              />
            </div>
          </div>
        </div>
      </div>

      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer hover:font-bold transition-all z-50 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      )}
    </div>
  );
};

export default IdProduct;
