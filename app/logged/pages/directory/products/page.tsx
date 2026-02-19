"use client";

import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductService } from '@/app/service/ProductService';
import { CompanyService } from '@/app/service/CompanyService';
import { Product, CompanyBasic } from '@/app/contents/interfaces';

interface ProductsProps {}

const Products: FC<ProductsProps> = ({ }) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<CompanyBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    productId: '',
    productName: '',
    priceFrom: '',
    priceTo: '',
    company: ''
  });

  const fetchData = async () => {
    try {
      const [productsData, companiesData] = await Promise.all([
        ProductService.getAllProducts(),
        CompanyService.getAllCompanies(),
      ]);
      const productList = Array.isArray(productsData) ? productsData : [];
      const companyList = Array.isArray(companiesData) ? companiesData : [];
      setProducts(productList);
      setFilteredProducts(productList);
      setCompanies(companyList.map((c: { companyId: string; commercialName: string }) => ({ companyId: c.companyId, commercialName: c.commercialName })));
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
      setFilteredProducts([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (filters.productId) {
      filtered = filtered.filter(product =>
        product.productId.toLowerCase().includes(filters.productId.toLowerCase())
      );
    }

    if (filters.productName) {
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(filters.productName.toLowerCase())
      );
    }

    if (filters.priceFrom) {
      const priceFromNum = parseFloat(filters.priceFrom);
      if (!isNaN(priceFromNum)) {
        filtered = filtered.filter(product => Number(product.price) >= priceFromNum);
      }
    }

    if (filters.priceTo) {
      const priceToNum = parseFloat(filters.priceTo);
      if (!isNaN(priceToNum)) {
        filtered = filtered.filter(product => Number(product.price) <= priceToNum);
      }
    }

    if (filters.company) {
      filtered = filtered.filter(product =>
        (product.company || '').toLowerCase().includes(filters.company.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [filters, products]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.companyId === companyId);
    return company ? company.commercialName : companyId;
  };

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white relative">
        <p className="text-2xl">Products Directory</p>
        <button
          type="button"
          onClick={() => router.push('/logged/pages/directory/products/create')}
          className="absolute right-8 top-1/2 -translate-y-1/2 px-4 py-2 bg-white text-blue-950 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Create Product
        </button>
      </div>

      {/* Filters */}
      <div className="px-36 mx-7 mt-5">
        <div className="bg-white border border-gray-100 shadow-xl rounded-lg p-5 mb-5">
          <p className="text-sm font-semibold mb-4 text-gray-700">Filter Products</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Product ID</label>
              <input
                type="text"
                value={filters.productId}
                onChange={(e) => handleFilterChange('productId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Search by Product ID"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Product Name</label>
              <input
                type="text"
                value={filters.productName}
                onChange={(e) => handleFilterChange('productName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Search by Product Name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Price From</label>
              <input
                type="number"
                value={filters.priceFrom}
                onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Min Price"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Price To</label>
              <input
                type="number"
                value={filters.priceTo}
                onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Max Price"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Company</label>
              <input
                type="text"
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Search by Company"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-36 mx-7 mb-8">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300" style={{ tableLayout: 'fixed' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300" style={{ width: 84, minWidth: 84 }}>
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Product ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Categories
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No products found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.productId}
                      onClick={() => router.push(`/logged/pages/directory/products/${product.productId}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-3 py-2 border-b border-gray-200 align-middle" style={{ width: 84, minWidth: 84, verticalAlign: 'middle' }}>
                        <div
                          className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow flex items-center justify-center"
                          style={{ width: 60, height: 60, minWidth: 60, minHeight: 60, boxSizing: 'border-box' }}
                        >
                          {product.mainImageSrc ? (
                            <img
                              src={product.mainImageSrc}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{ display: 'block' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <span className={`text-gray-400 text-xs font-medium ${product.mainImageSrc ? 'hidden' : ''}`} aria-hidden>
                            —
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {product.productId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                        {product.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        ${Number(product.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {getCompanyName(product.company)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                        {(product.productCategoriesArray || []).join(', ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
