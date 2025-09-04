import { Facebook, Instagram, Youtube } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#110030] text-white py-6 mt-8">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo & Description */}
        <div className="flex flex-col w-full justify-top items-right">
          <h2 className="text-[24px] text-yellow-500 font-bold hover:text-red-500">
            <Link href="/">DFI.Fund</Link>
        </h2>
          <p className="mt-3 text-[18px] text-gray-300">
          <b>D</b>Project<br /> <b>F</b>inancial<br /> <b>I</b>nnovation<br />
          </p>
          <p className="mt-3 text-[14px] text-gray-500">Version 1.3.0</p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col justify-top md:items-center">
          <h3 className="text-[18px] font-semibold text-yellow-500 mb-4">Navigation</h3>
          <ul className="space-y-2 text-[15px] text-gray-300">
            <li className="hover:text-blue-300 hover:font-semibold"><Link href="/">Home - หน้าแรก</Link></li>
            <li className="hover:text-blue-300 hover:font-semibold"><Link href="/about">About - ข้อมูลโครงการ</Link></li>
            <li className="hover:text-blue-300 hover:font-semibold"><Link href="/timeline">Timeline - ความคืบหน้า</Link></li>
            <li className="hover:text-blue-300 hover:font-semibold"><Link href="/member-area/">MemberArea - พื้นที่สมาชิก</Link></li>
            <li className="hover:text-blue-300 hover:font-semibold"><Link href="http://www.dpjdd.com/">DOS - ตรวจสอบส่วนแบ่งรายได้</Link></li>
          </ul>
        </div>

        {/* Social Icons */}
        <div className="flex flex-col justify-top items-center">
          <h3 className="flex text-[18px] font-semibold text-yellow-500 mb-4">Follow DProject</h3>
          <div className="flex space-x-5 items-center">
            <Link href="https://www.facebook.com/people/KOK-KOK-KOK/61573998052437/" target="_blank" aria-label="Facebook"><Facebook className="w-6 h-6 -gray-300 hover:text-blue-500" /></Link>
            <Link href="#" target="_blank" aria-label="X (formerly Twitter)"><span className="text-[23px] font-bold text-gray-300 hover:text-yellow-400">X</span></Link>
            <Link href="https://www.youtube.com/@DProject-w5z" target="_blank" aria-label="YouTube Channel"><Youtube className="w-7 h-7 text-gray-300 hover:text-red-500" /></Link>            
            <Link href="https://www.instagram.com/kokkokkok.3k?igsh=emNrZ2tta2drdzV2" target="_blank" aria-label="Instagram"><Instagram className="w-6 h-6 text-gray-300 hover:text-orange-500" /></Link>
            <Link href="https://lin.ee/xGUnJcK" target="_blank" aria-label="Line App"><span className="text-[22px] font-bold text-gray-300 hover:text-yellow-400">Line</span></Link>
          </div>
          <Link target="_blank" href="https://3k.dfi.fund/templates/index.html"><p className="text-[20px] font-bold mt-4"><span className="text-red-500">Kok</span><span className="text-yellow-500">Kok</span><span className="text-green-500">Kok</span><sup className="text-[10px] font-bold">TM</sup></p></Link>
          <p className="text-[16px] text-gray-200 mt-0"><b>Web3 SuperApp</b> for the Future.</p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-6 border-t border-gray-700 px-2 pt-4 text-center text-[15px] text-gray-500">
        &copy; {new Date().getFullYear()} <b>DFI.Fund</b> All rights reserved.
      </div>
    </footer>
  );
}