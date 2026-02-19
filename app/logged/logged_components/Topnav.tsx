"use client"
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { FC } from 'react';
import AuthenticationService from "@/app/service/AuthenticationService";

interface TopnavProps {
  
}

const Topnav: FC<TopnavProps> = ({ }) => {
    const router = useRouter()

    const handleLogout = async () => {
        await AuthenticationService.logout();
        router.replace('/');
    };

  return (
    <nav className='flex flex-row bg-blue-950 text-gray-200 justify-between p-12'>
        <Link href='/logged' className='text-3xl hover:text-white cursor-pointer'>
            Plynium Central Panel
        </Link>

        <button 
            className='bg-white text-blue-950 cursor-pointer hover:bg-gray-100/80 px-5 py-1 rounded-xl shadow-xl'
            onClick={handleLogout}
        >
        Log out
        </button>
    </nav>
  );
};

export default Topnav;