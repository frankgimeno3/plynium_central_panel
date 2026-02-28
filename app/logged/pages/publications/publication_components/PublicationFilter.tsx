"use client";
import { FC, useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PublicationService } from '@/app/service/PublicationService';
import { PortalService } from '@/app/service/PortalService';
import { publicationInterface } from '@/app/contents/interfaces';

interface PublicationFilterProps {}

const PublicationFilterContent: FC<PublicationFilterProps> = ({ }) => {
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [revista, setRevista] = useState('');
  const [numero, setNumero] = useState('');
  const [dateFromMonth, setDateFromMonth] = useState('');
  const [dateFromYear, setDateFromYear] = useState('');
  const [dateToMonth, setDateToMonth] = useState('');
  const [dateToYear, setDateToYear] = useState('');
  const [publications, setPublications] = useState<publicationInterface[]>([]);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [portalChecklist, setPortalChecklist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PortalService.getAllPortals()
      .then((list: any[]) => {
        setPortals(
          Array.isArray(list)
            ? list.map((p) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
            : []
        );
      })
      .catch(() => setPortals([]));
  }, []);

  // Load publications from API
  useEffect(() => {
    const loadPublications = async () => {
      try {
        const apiPublications = await PublicationService.getAllPublications();
        setPublications(Array.isArray(apiPublications) ? apiPublications : []);
      } catch (error) {
        console.error("Error loading publications for filter:", error);
        setPublications([]);
      } finally {
        setLoading(false);
      }
    };
    loadPublications();
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const revistaParam = searchParams.get('revista');
    const numeroParam = searchParams.get('numero');
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const portalNamesParam = searchParams.get('portalNames');

    if (revistaParam) setRevista(revistaParam);
    if (numeroParam) setNumero(numeroParam);
    if (portalNamesParam) {
      setPortalChecklist(portalNamesParam.split(',').map((s) => s.trim()).filter(Boolean));
    }

    if (dateFromParam) {
      const [year, month] = dateFromParam.split('-');
      if (year) setDateFromYear(year);
      if (month) setDateFromMonth(month);
    }

    if (dateToParam) {
      const [year, month] = dateToParam.split('-');
      if (year) setDateToYear(year);
      if (month) setDateToMonth(month);
    }
  }, [searchParams]);

  const toggleFilter = () => {
    setIsFilterOpen(prev => !prev);
  };
  
  // Extract unique values from publications
  const { uniqueMonths, uniqueYears, uniqueRevistas, uniqueNumeros } = useMemo(() => {
    const months = new Set<string>();
    const years = new Set<string>();
    const revistas = new Set<string>();
    const numeros = new Set<string>();

    publications.forEach((pub: publicationInterface) => {
      if (pub.date) {
        const date = new Date(pub.date);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        months.add(month);
        years.add(year);
      }
      if (pub.revista) revistas.add(pub.revista);
      if (pub.número !== undefined) numeros.add(String(pub.número));
    });

    return {
      uniqueMonths: Array.from(months).sort(),
      uniqueYears: Array.from(years).sort().reverse(),
      uniqueRevistas: Array.from(revistas).sort(),
      uniqueNumeros: Array.from(numeros).sort().reverse() // Most recent first (descending order)
    };
  }, [publications]);

  const monthNames: { [key: string]: string } = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
  };

  // Check if date fields are valid (all 4 or none)
  const isDateRangeValid = () => {
    const hasFromMonth = !!dateFromMonth;
    const hasFromYear = !!dateFromYear;
    const hasToMonth = !!dateToMonth;
    const hasToYear = !!dateToYear;
    
    const hasAnyDateField = hasFromMonth || hasFromYear || hasToMonth || hasToYear;
    const hasAllDateFields = hasFromMonth && hasFromYear && hasToMonth && hasToYear;
    
    // Either all date fields are filled, or none
    return !hasAnyDateField || hasAllDateFields;
  };

  const togglePortal = (name: string) => {
    setPortalChecklist((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const getFilterHref = () => {
    const params = new URLSearchParams();

    if (revista) {
      params.set('revista', revista);
    }
    if (numero) {
      params.set('numero', numero);
    }
    if (portalChecklist.length > 0) {
      params.set('portalNames', portalChecklist.join(','));
    }
    if (dateFromMonth && dateFromYear) {
      params.set('dateFrom', `${dateFromYear}-${dateFromMonth}`);
    }
    if (dateToMonth && dateToYear) {
      params.set('dateTo', `${dateToYear}-${dateToMonth}`);
    }

    const queryString = params.toString();
    return queryString ? `/logged/pages/publications/search?${queryString}` : '/logged/pages/publications/search';
  };

  const hasAnyFilter =
    revista ||
    numero ||
    portalChecklist.length > 0 ||
    dateFromMonth ||
    dateFromYear ||
    dateToMonth ||
    dateToYear;
  const dateRangeValid = isDateRangeValid();
  const canFilter = dateRangeValid;

  return (
    <div className='px-36 mx-7'>
      <div
        className='flex flex-col border border-gray-100 shadow-xl text-center py-2 text-xs cursor-pointer hover:bg-gray-100/80'
        onClick={toggleFilter}
      >
        <p>{isFilterOpen ? 'Click to close filter' : 'Click to open filter'}</p>
      </div>
      {isFilterOpen && (
        <div className='bg-white mb-12 shadow-xl border border-gray-100 p-5'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
            {/* Portal filter */}
            <div className='lg:col-span-6'>
              <label className='block text-xs font-medium text-gray-700 mb-2'>
                Portal (by name)
              </label>
              <div className='flex flex-wrap gap-3'>
                {portals.length === 0 ? (
                  <span className='text-gray-400 text-xs'>Loading portals...</span>
                ) : (
                  portals.map((p) => (
                    <label
                      key={p.id}
                      className='flex items-center gap-2 cursor-pointer text-sm'
                    >
                      <input
                        type='checkbox'
                        checked={portalChecklist.includes(p.name)}
                        onChange={() => togglePortal(p.name)}
                        className='rounded border-gray-300'
                      />
                      <span>{p.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Magazine - Leftmost */}
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-2'>
                Magazine
              </label>
              <select
                value={revista}
                onChange={e => setRevista(e.target.value)}
                className='w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
              >
                <option value=''>Select magazine</option>
                {uniqueRevistas.map(rev => (
                  <option key={rev} value={rev}>
                    {rev}
                  </option>
                ))}
              </select>
            </div>

            {/* Exact Publication */}
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-2'>
                Exact Publication
              </label>
              <select
                value={numero}
                onChange={e => setNumero(e.target.value)}
                className='w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
              >
                <option value=''>Select exact publication</option>
                {uniqueNumeros.map(num => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by date range - From */}
            <div className='col-span-2'>
              <label className='block text-xs font-medium text-gray-700 mb-2'>
                Filter by date range - From
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <select
                  value={dateFromMonth}
                  onChange={e => setDateFromMonth(e.target.value)}
                  className='w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                >
                  <option value=''>Month</option>
                  {uniqueMonths.map(month => (
                    <option key={month} value={month}>
                      {monthNames[month] || month}
                    </option>
                  ))}
                </select>
                <select
                  value={dateFromYear}
                  onChange={e => setDateFromYear(e.target.value)}
                  className='w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                >
                  <option value=''>Year</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter by date range - To */}
            <div className='col-span-2'>
              <label className='block text-xs font-medium text-gray-700 mb-2'>
                Filter by date range - To
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <select
                  value={dateToMonth}
                  onChange={e => setDateToMonth(e.target.value)}
                  className='w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                >
                  <option value=''>Month</option>
                  {uniqueMonths.map(month => (
                    <option key={month} value={month}>
                      {monthNames[month] || month}
                    </option>
                  ))}
                </select>
                <select
                  value={dateToYear}
                  onChange={e => setDateToYear(e.target.value)}
                  className='w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                >
                  <option value=''>Year</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!dateRangeValid && (dateFromMonth || dateFromYear || dateToMonth || dateToYear) && (
            <div className='mt-2 text-xs text-red-600'>
              Please fill all date range fields (From month, From year, To month, To year) or leave them all empty.
            </div>
          )}
          <div className='flex justify-end mt-4'>
            {canFilter ? (
              <Link
                href={getFilterHref()}
                className='px-4 py-2 text-sm cursor-pointer rounded-lg shadow-xl bg-blue-950 text-white hover:bg-blue-950/80 inline-block'
              >
                Filter
              </Link>
            ) : (
              <button
                disabled
                className='px-4 py-2 text-sm rounded-lg bg-gray-200/30 text-gray-400 cursor-not-allowed'
              >
                Filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PublicationFilter: FC<PublicationFilterProps> = ({ }) => {
  return (
    <Suspense fallback={
      <div className='px-36 mx-7'>
        <div className='flex flex-col border border-gray-100 shadow-xl text-center py-2 text-xs'>
          <p>Loading filter...</p>
        </div>
      </div>
    }>
      <PublicationFilterContent />
    </Suspense>
  );
};

export default PublicationFilter;
