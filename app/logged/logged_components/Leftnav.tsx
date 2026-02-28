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
  const [isAdvertisementSelected, setIsAdvertisementSelected] = useState(false);
  const [isRequestsSelected, setIsRequestsSelected] = useState(false);

  const inContents = pathname.startsWith('/logged/pages/articles') || pathname.startsWith('/logged/pages/publications') || pathname.startsWith('/logged/pages/events');
  const inAdvertisement = pathname.startsWith('/logged/pages/banners');
  const inRequests = pathname.startsWith('/logged/pages/requests');
  const inPlyniumNetwork = pathname.startsWith('/logged/pages/users') || pathname.startsWith('/logged/pages/directory') || pathname.startsWith('/logged/pages/portals');

  useEffect(() => {
    setIsContentsSelected(inContents);
    setIsAdvertisementSelected(inAdvertisement);
    setIsRequestsSelected(inRequests);
    setIsDirectorySelected(inPlyniumNetwork);
  }, [pathname, inContents, inAdvertisement, inRequests, inPlyniumNetwork]);



  return (
    <div className='flex shrink-0 flex-col w-[230px] min-w-[230px] h-full bg-gray-100 pl-3'>
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
          <Link href='/logged/pages/articles' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/articles') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/articles')} />
            <p className='pl-3'>Articles</p>
          </Link>
          <Link href='/logged/pages/publications' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/publications') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/publications')} />
            <p className='pl-3'>Publications</p>
          </Link>
          <Link href='/logged/pages/events' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/events') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/events')} />
            <p className='pl-3'>Events</p>
          </Link>
        </div>
      )}

      <div className={`flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer ${inAdvertisement ? 'bg-gray-200/70 text-gray-900' : ''}`} onClick={() => setIsAdvertisementSelected(!isAdvertisementSelected)}>
        {isAdvertisementSelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        )}
        <p className={`text-md pl-4 py-4 ${inAdvertisement ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Advertisement</p>
      </div>

      {isAdvertisementSelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/banners' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/banners') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/banners')} />
            <p className='pl-3'>Banners</p>
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
          <Link href='/logged/pages/portals' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/portals') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/portals')} />
            <p className='pl-3'>Portals</p>
          </Link>
          <Link href='/logged/pages/users' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/users') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/users')} />
            <p className='pl-3'>Users</p>
          </Link>
          <Link href='/logged/pages/directory/companies' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/directory/companies') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/directory/companies')} />
            <p className='pl-3'>Companies</p>
          </Link>
          <Link href='/logged/pages/directory/products' className={`flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer ${pathname.startsWith('/logged/pages/directory/products') ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
            <LeftNavElement active={pathname.startsWith('/logged/pages/directory/products')} />
            <p className='pl-3'>Products</p>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Leftnav;