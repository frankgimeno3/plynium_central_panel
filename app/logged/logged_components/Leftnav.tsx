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
  const [isProjectManagementSelected, setIsProjectManagementSelected] = useState(false);
  const [isRequestsSelected, setIsRequestsSelected] = useState(false);

  const inContents = pathname.startsWith('/logged/pages/contents');
  const inProjectManagement = pathname.startsWith('/logged/pages/pm');
  const inRequests = pathname.startsWith('/logged/pages/requests');
  const inPlyniumNetwork = pathname.startsWith('/logged/pages/users') || pathname.startsWith('/logged/pages/directory') || pathname.startsWith('/logged/pages/portals');

  useEffect(() => {
    setIsContentsSelected(inContents);
    setIsProjectManagementSelected(inProjectManagement);
    setIsRequestsSelected(inRequests);
    setIsDirectorySelected(inPlyniumNetwork);
  }, [pathname, inContents, inProjectManagement, inRequests, inPlyniumNetwork]);



  return (
    <div className='flex shrink-0 flex-col w-[280px] min-w-[280px] h-full bg-gray-100 pl-3'>
      <div className={`flex flex-row mt-5 hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer ${inContents ? 'bg-gray-200/70 text-gray-900' : ''}`} onClick={() => setIsContentsSelected(!isContentsSelected)}>
        {isContentsSelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        )}
        <p className={`text-md pl-4 py-4 ${inContents ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Contents</p>
      </div>

      {isContentsSelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/contents/articles' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/contents/articles') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/contents/articles')} />
            <p className='pl-3'>Articles</p>
          </Link>
          <Link href='/logged/pages/contents/banners' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/contents/banners') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/contents/banners')} />
            <p className='pl-3'>Banners</p>
          </Link>
          <Link href='/logged/pages/contents/events' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/contents/events') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/contents/events')} />
            <p className='pl-3'>Events</p>
          </Link>
          <Link href='/logged/pages/contents/publications' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/contents/publications') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/contents/publications')} />
            <p className='pl-3'>Publications</p>
          </Link>
        </div>
      )}

      <div className={`flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer ${inProjectManagement ? 'bg-gray-200/70 text-gray-900' : ''}`} onClick={() => setIsProjectManagementSelected(!isProjectManagementSelected)}>
        {isProjectManagementSelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        )}
        <p className={`text-md pl-4 py-4 ${inProjectManagement ? 'text-gray-900 font-medium' : 'text-gray-500'}`} suppressHydrationWarning>Project Management</p>
      </div>

      {isProjectManagementSelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/pm' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname === '/logged/pages/pm' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname === '/logged/pages/pm'} />
            <p className='pl-3'>Dashboard</p>
          </Link>
          <Link href='/logged/pages/pm/contracts' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/pm/contracts') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/pm/contracts')} />
            <p className='pl-3'>Contracts</p>
          </Link>
          <Link href='/logged/pages/pm/projects' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/pm/projects') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/pm/projects')} />
            <p className='pl-3'>Projects</p>
          </Link>
          <Link href='/logged/pages/pm/proposals' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/pm/proposals') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/pm/proposals')} />
            <p className='pl-3'>Proposals</p>
          </Link>
          <Link href='/logged/pages/pm/customers_db' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/pm/customers_db') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/pm/customers_db')} />
            <p className='pl-3'>Customers DB</p>
          </Link>
        </div>
      )}

      <div className={`flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer ${inRequests ? 'bg-gray-200/70 text-gray-900' : ''}`} onClick={() => setIsRequestsSelected(!isRequestsSelected)}>
        {isRequestsSelected ? (
          <div className="text-gray-500 text-md pl-4 py-4 flex items-center">
            <ChevronUpSvg size={16} />
          </div>
        ) : (
          <div className="text-gray-500 text-md pl-4 py-4 flex items-center">
            <ChevronDownSvg size={16} />
          </div>
        )}
        <p className={`text-md pl-4 py-4 ${inRequests ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Requests</p>
      </div>

      {isRequestsSelected && (
        <div className="flex flex-col px-5 text-sm">
          <Link href='/logged/pages/requests/quotations' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/requests/quotations') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/requests/quotations')} />
            <p className='pl-3'>Advertisement quotations</p>
          </Link>
          <Link href='/logged/pages/requests/company' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/requests/company') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/requests/company')} />
            <p className='pl-3'>Company</p>
          </Link>
          <Link href='/logged/pages/requests/requests' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/requests/requests') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/requests/requests')} />
            <p className='pl-3'>Other</p>
          </Link>
        </div>
      )}

      <div className={`flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer ${inPlyniumNetwork ? 'bg-gray-200/70 text-gray-900' : ''}`} onClick={() => setIsDirectorySelected(!isDirectorySelected)}>
        {isDirectorySelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        )}
        <p className={`text-md pl-4 py-4 ${inPlyniumNetwork ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Plynium Network</p>
      </div>

      {isDirectorySelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/directory/companies' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/directory/companies') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/directory/companies')} />
            <p className='pl-3'>Companies</p>
          </Link>
          <Link href='/logged/pages/directory/products' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/directory/products') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/directory/products')} />
            <p className='pl-3'>Products</p>
          </Link>
          <Link href='/logged/pages/portals' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/portals') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/portals')} />
            <p className='pl-3'>Portals</p>
          </Link>
          <Link href='/logged/pages/users' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/users') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/users')} />
            <p className='pl-3'>Users</p>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Leftnav;