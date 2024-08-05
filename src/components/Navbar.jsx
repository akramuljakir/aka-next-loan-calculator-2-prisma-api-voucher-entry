"use client";

import Link from "next/link";
import React from "react";


const links = [
  {
    id: 1,
    title: "Home",
    url: "/",
  },
  {
    id: 2,
    title: "Loans",
    url: "/loans",
  },
  {
    id: 3,
    title: "Combined",
    url: "/combined",
  },
];

const Navbar = () => {
  return (
    <div className='h-[100px] flex justify-around items-center'>
      <Link href="/" className='font-bold text-[22px]'>
        Akramul Jakir
      </Link>
      <div className='flex items-center gap-[20px]'>
        {links.map((link) => (
          <Link key={link.id} href={link.url} className='flex items-center gap-[20px]'>
            {link.title}
          </Link>
        ))}

      </div>
    </div>
  );
};

export default Navbar;
