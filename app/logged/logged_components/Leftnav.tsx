"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC, useState, useEffect } from 'react';
import ChevronDownSvg from './svg/ChevronDownSvg';
import ChevronUpSvg from './svg/ChevronUpSvg';

interface LeftnavProps {}
interface LeftnavElementProps { active?: boolean }

const LeftNavElement: FC<LeftnavElementProps> = ({ active }) => {
  return (
    <div className={`w-1 min-w-1 shrink-0 self-stretch rounded-sm ${active ? 'bg-blue-600' : 'bg-gray-300'}`} aria-hidden />
  );
};

const Leftnav: FC<LeftnavProps> = ({ }) => {
  const pathname = usePathname();
  const [isDirectorySelected, setIsDirectorySelected] = useState(false);
  const [isContentsSelected, setIsContentsSelected] = useState(false);
  const [isAccountManagementSelected, setIsAccountManagementSelected] = useState(false);
  const [isProductionSelected, setIsProductionSelected] = useState(false);
  const [isRequestsSelected, setIsRequestsSelected] = useState(false);
  const [isAdministrationSelected, setIsAdministrationSelected] = useState(false);

  const inContents = pathname.startsWith('/logged/pages/network/contents');
  const inAccountManagement = pathname.startsWith('/logged/pages/account-management');
  const inProduction = pathname.startsWith('/logged/pages/production');
  const inRequests = pathname.startsWith('/logged/pages/network/requests');
  const inAdministration = pathname.startsWith('/logged/pages/administration');
  const inNetwork = pathname.startsWith('/logged/pages/network');
  const inPlyniumNetwork = inNetwork;

  useEffect(() => {
    setIsContentsSelected(inContents);
    setIsAccountManagementSelected(inAccountManagement);
    setIsProductionSelected(inProduction);
    setIsRequestsSelected(inRequests);
    setIsAdministrationSelected(inAdministration);
    setIsDirectorySelected(inPlyniumNetwork);
  }, [pathname, inContents, inAccountManagement, inProduction, inRequests, inAdministration, inNetwork]);



  return (
    <div className='flex shrink-0 flex-col w-[280px] min-w-[280px] h-full bg-gray-100 pl-3'>
      {/* Network (Plynium Network) – Contents, Requests, Directory, Portals, Users */}
      <div className={`flex flex-row mt-5 hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer ${inPlyniumNetwork ? 'bg-gray-200/70 text-gray-900' : ''}`} onClick={() => setIsDirectorySelected(!isDirectorySelected)}>
        {isDirectorySelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        )}
        <p className={`text-md pl-4 py-4 ${inPlyniumNetwork ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Plynium Network</p>
      </div>

      {isDirectorySelected && (
        <div className='flex flex-col px-5 text-sm'>
          <div className={`flex flex-row hover:bg-gray-200/30 cursor-pointer pl-4 py-2 ${inContents ? 'text-gray-900' : 'text-gray-600'}`} onClick={() => setIsContentsSelected(!isContentsSelected)}>
            {isContentsSelected ? <ChevronDownSvg size={14} /> : <ChevronUpSvg size={14} />}
            <p className='pl-2 text-sm font-medium'>Contents</p>
          </div>
          {isContentsSelected && (
            <div className='flex flex-col pl-6'>
              <Link href='/logged/pages/network/contents/articles' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/contents/articles') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                <LeftNavElement active={pathname.startsWith('/logged/pages/network/contents/articles')} />
                <p className='pl-3'>Articles</p>
              </Link>
              <Link href='/logged/pages/network/contents/banners' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/contents/banners') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                <LeftNavElement active={pathname.startsWith('/logged/pages/network/contents/banners')} />
                <p className='pl-3'>Banners</p>
              </Link>
              <Link href='/logged/pages/network/contents/events' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/contents/events') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                <LeftNavElement active={pathname.startsWith('/logged/pages/network/contents/events')} />
                <p className='pl-3'>Events</p>
              </Link>
              <Link href='/logged/pages/network/contents/publications' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/contents/publications') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                <LeftNavElement active={pathname.startsWith('/logged/pages/network/contents/publications')} />
                <p className='pl-3'>Publications</p>
              </Link>
            </div>
          )}

          <div className={`flex flex-row hover:bg-gray-200/30 cursor-pointer pl-4 py-2 ${inRequests ? 'text-gray-900' : 'text-gray-600'}`} onClick={() => setIsRequestsSelected(!isRequestsSelected)}>
            {isRequestsSelected ? <ChevronDownSvg size={14} /> : <ChevronUpSvg size={14} />}
            <p className='pl-2 text-sm font-medium'>Requests</p>
          </div>
          {isRequestsSelected && (
            <div className='flex flex-col pl-6'>
              <Link href='/logged/pages/network/requests/quotations' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/requests/quotations') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                <LeftNavElement active={pathname.startsWith('/logged/pages/network/requests/quotations')} />
                <p className='pl-3'>Advertisement quotations</p>
              </Link>
              <Link href='/logged/pages/network/requests/company' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/requests/company') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                <LeftNavElement active={pathname.startsWith('/logged/pages/network/requests/company')} />
                <p className='pl-3'>Company creation</p>
              </Link>
              <Link href='/logged/pages/network/requests/requests' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/requests/requests') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                <LeftNavElement active={pathname.startsWith('/logged/pages/network/requests/requests')} />
                <p className='pl-3'>Other</p>
              </Link>
            </div>
          )}

          <Link href='/logged/pages/network/directory/companies' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/directory/companies') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/network/directory/companies')} />
            <p className='pl-3'>Published Companies</p>
          </Link>
          <Link href='/logged/pages/network/directory/products' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/directory/products') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/network/directory/products')} />
            <p className='pl-3'>Published Products</p>
          </Link>
          <Link href='/logged/pages/network/portals' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/portals') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/network/portals')} />
            <p className='pl-3'>Published Portals</p>
          </Link>
          <Link href='/logged/pages/network/users' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-3 cursor-pointer ${pathname.startsWith('/logged/pages/network/users') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/network/users')} />
            <p className='pl-3'>Registered Users</p>
          </Link>
        </div>
      )}

      <div className={`flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer ${inAccountManagement ? 'bg-gray-200/70 text-gray-900' : ''}`} onClick={() => setIsAccountManagementSelected(!isAccountManagementSelected)}>
        {isAccountManagementSelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        )}
        <p className={`text-md pl-4 py-4 ${inAccountManagement ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Account Management</p>
      </div>

      {isAccountManagementSelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/account-management/customers_db' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/account-management/customers_db') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/account-management/customers_db')} />
            <p className='pl-3'>Customers DB</p>
          </Link>
          <Link href='/logged/pages/account-management/contacts_db' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/account-management/contacts_db') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/account-management/contacts_db')} />
            <p className='pl-3'>Contacts DB</p>
          </Link>
          <Link href='/logged/pages/account-management/proposals' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/account-management/proposals') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/account-management/proposals')} />
            <p className='pl-3'>Proposals</p>
          </Link>
          <Link href='/logged/pages/account-management/contracts' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/account-management/contracts') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/account-management/contracts')} />
            <p className='pl-3'>Contracts</p>
          </Link>
        </div>
      )}

      <div className={`flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer ${inProduction ? 'bg-gray-200/70 text-gray-900' : ''}`} onClick={() => setIsProductionSelected(!isProductionSelected)}>
        {isProductionSelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        )}
        <p className={`text-md pl-4 py-4 ${inProduction ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Production</p>
      </div>

      {isProductionSelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/production/projects' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/production/projects') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/production/projects')} />
            <p className='pl-3'>Projects</p>
          </Link>
          <Link href='/logged/pages/production/services' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/production/services') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/production/services')} />
            <p className='pl-3'>Services</p>
          </Link>
          <Link href='/logged/pages/production/newsletter_management' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/production/newsletter_management') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/production/newsletter_management')} />
            <p className='pl-3'>Newsletter Management</p>
          </Link>
          <Link href='/logged/pages/production/publications_management' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/production/publications_management') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/production/publications_management')} />
            <p className='pl-3'>Publications Management</p>
          </Link>
        </div>
      )}

      <div className={`flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer ${inAdministration ? 'bg-gray-200/70 text-gray-900' : ''}`} onClick={() => setIsAdministrationSelected(!isAdministrationSelected)}>
        {isAdministrationSelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        )}
        <p className={`text-md pl-4 py-4 ${inAdministration ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Administration</p>
      </div>

      {isAdministrationSelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/administration' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname === '/logged/pages/administration' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname === '/logged/pages/administration'} />
            <p className='pl-3'>Orders</p>
          </Link>
          <Link href='/logged/pages/administration/banks' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/administration/banks') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/administration/banks')} />
            <p className='pl-3'>Banks</p>
          </Link>
          <Link href='/logged/pages/administration/issued-invoices' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/administration/issued-invoices') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/administration/issued-invoices')} />
            <p className='pl-3'>Issued invoices</p>
          </Link>
          <Link href='/logged/pages/administration/provider-invoices' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/administration/provider-invoices') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/administration/provider-invoices')} />
            <p className='pl-3'>Provider invoices</p>
          </Link>
          <Link href='/logged/pages/administration/providers' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/administration/providers') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/administration/providers')} />
            <p className='pl-3'>Providers</p>
          </Link>
          <Link href='/logged/pages/administration/agents' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/administration/agents') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/administration/agents')} />
            <p className='pl-3'>Agents</p>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Leftnav;
