"use client"
import Link from 'next/link';
import { FC } from 'react';
import { useState } from 'react';
import ChevronDownSvg from './svg/ChevronDownSvg';
import ChevronUpSvg from './svg/ChevronUpSvg';
interface LeftnavProps {}
interface LeftnavElementProps {}

const LeftNavElement:FC<LeftnavElementProps> = ({}) => {
  return (
    <div className='w-1 min-w-1 shrink-0 self-stretch bg-gray-300 rounded-sm' aria-hidden />
  );
};

const Leftnav: FC<LeftnavProps> = ({ }) => {
  const [isDirectorySelected, setIsDirectorySelected] = useState(false);
  const [isContentsSelected, setIsContentsSelected] = useState(false);
  const [isManagementSelected, setIsManagementSelected] = useState(false);
  const [isInboundSelected, setIsInboundSelected] = useState(false);



  return (
    <div className='flex shrink-0 flex-col w-[230px] min-w-[230px] h-full bg-gray-100 pl-3'>
      <div className='flex flex-row mt-5 hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer' onClick={() => setIsContentsSelected(!isContentsSelected)}>
        {isContentsSelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        )}
        <p className='text-gray-500 text-md pl-4 py-4'>Contents</p>
      </div>

      {isContentsSelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/articles' className='flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer'>
            <LeftNavElement />
            <p className='pl-3'>Articles</p>
          </Link>
          <Link href='/logged/pages/publications' className='flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer'>
            <LeftNavElement />
            <p className='pl-3'>Publications</p>
          </Link>
          <Link href='/logged/pages/events' className='flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer'>
            <LeftNavElement />
            <p className='pl-3'>Events</p>
          </Link>
        </div>
      )}

      <div className='flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer' onClick={() => setIsManagementSelected(!isManagementSelected)}>
        {isManagementSelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        )}
        <p className='text-gray-500 text-md pl-4 py-4'>Management</p>
      </div>

      {isManagementSelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/banners' className='flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer'>
            <LeftNavElement />
            <p className='pl-3'>Banners</p>
          </Link>
          <Link href='/logged/pages/users' className='flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer'>
            <LeftNavElement />
            <p className='pl-3'>Users</p>
          </Link>
        </div>
      )}

      <div className='flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer' onClick={() => setIsInboundSelected(!isInboundSelected)}>
        {isInboundSelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        )}
        <p className='text-gray-500 text-md pl-4 py-4'>Inbound</p>
      </div>

      {isInboundSelected && (
        <div className='flex flex-col px-5 text-sm'>
          {/* <Link href='/logged/pages/quotations' className='flex flex-row  hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer'>
        <p>Quotations</p>
      </Link> */}
          <Link href='/logged/pages/advertisement' className='flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer'>
            <LeftNavElement />
            <p className='pl-3'>Advertisement</p>
          </Link>
        </div>
      )}

      <div className='flex flex-row hover:bg-gray-200/50 hover:text-gray-900 cursor-pointer' onClick={() => setIsDirectorySelected(!isDirectorySelected)}>
        {isDirectorySelected ? (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronUpSvg size={16} />
          </div>
        ) : (
          <div className='text-gray-500 text-md pl-4 py-4 flex items-center'>
            <ChevronDownSvg size={16} />
          </div>
        )}
        <p className='text-gray-500 text-md pl-4 py-4'>Directory</p>
      </div>

      {isDirectorySelected && (
        <div className='flex flex-col px-5 text-sm'>
          <Link href='/logged/pages/directory/companies' className='flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer'>
            <LeftNavElement />
            <p className='pl-3'>Companies</p>
          </Link>
          <Link href='/logged/pages/directory/products' className='flex flex-row items-stretch hover:bg-gray-200/50 hover:text-gray-900 pl-4 py-4 cursor-pointer'>
            <LeftNavElement />
            <p className='pl-3'>Products</p>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Leftnav;