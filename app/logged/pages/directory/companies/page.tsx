"use client";

import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyService } from '@/app/service/CompanyService';
import { Company } from '@/app/contents/interfaces';

interface CompaniesProps {}

const Companies: FC<CompaniesProps> = ({ }) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    companyId: '',
    commercialName: '',
    country: '',
    category: ''
  });

  const fetchCompanies = async () => {
    try {
      const data = await CompanyService.getAllCompanies();
      const list = Array.isArray(data) ? data : [];
      setCompanies(list);
      setFilteredCompanies(list);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
      setFilteredCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    let filtered = [...companies];

    if (filters.companyId) {
      filtered = filtered.filter(company =>
        company.companyId.toLowerCase().includes(filters.companyId.toLowerCase())
      );
    }

    if (filters.commercialName) {
      filtered = filtered.filter(company =>
        company.commercialName.toLowerCase().includes(filters.commercialName.toLowerCase())
      );
    }

    if (filters.country) {
      filtered = filtered.filter(company =>
        company.country.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(company =>
        company.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    setFilteredCompanies(filtered);
  }, [filters, companies]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white relative">
        <p className="text-2xl">Companies Directory</p>
        <button
          type="button"
          onClick={() => router.push('/logged/pages/directory/companies/create')}
          className="absolute right-8 top-1/2 -translate-y-1/2 px-4 py-2 bg-white text-blue-950 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Create Company
        </button>
      </div>

      {/* Filters */}
      <div className="px-36 mx-7 mt-5">
        <div className="bg-white border border-gray-100 shadow-xl rounded-lg p-5 mb-5">
          <p className="text-sm font-semibold mb-4 text-gray-700">Filter Companies</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Company ID</label>
              <input
                type="text"
                value={filters.companyId}
                onChange={(e) => handleFilterChange('companyId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Search by Company ID"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Commercial Name</label>
              <input
                type="text"
                value={filters.commercialName}
                onChange={(e) => handleFilterChange('commercialName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Search by Commercial Name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Country</label>
              <input
                type="text"
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Search by Country"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Category</label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Search by Category"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-36 mx-7 mb-8">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading companies...</p>
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
                    Company ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Commercial Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Products Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No companies found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr
                      key={company.companyId}
                      onClick={() => router.push(`/logged/pages/directory/companies/${company.companyId}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-3 py-2 border-b border-gray-200 align-middle" style={{ width: 84, minWidth: 84, verticalAlign: 'middle' }}>
                        <div
                          className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow flex items-center justify-center"
                          style={{ width: 60, height: 60, minWidth: 60, minHeight: 60, boxSizing: 'border-box' }}
                        >
                          {company.mainImage ? (
                            <img
                              src={company.mainImage}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{ display: 'block' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <span className={`text-gray-400 text-xs font-medium ${company.mainImage ? 'hidden' : ''}`} aria-hidden>
                            —
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {company.companyId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {company.commercialName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {company.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {company.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {company.mainEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {(company.productsArray || []).length}
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

export default Companies;
