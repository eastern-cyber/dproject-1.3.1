// src/app/plan-b/page.tsx

"use client";
import React, { useEffect, useState } from 'react'
import Image from "next/image";
import { useActiveAccount } from "thirdweb/react";
import dprojectIcon from "../../../public/DProjectLogo_650x600.svg";
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import Footer from '@/components/Footer';

interface UserData {
  id: number;
  user_id: string;
  referrer_id: string | null;
  email: string | null;
  name: string | null;
  token_id: string | null;
  plan_a: {
    dateTime?: string;
    POL?: number;
    rateTHBPOL?: number;
    txHash?: string;
    joined?: boolean;
  } | null;
  plan_b: {
    dateTime?: string;
    POL?: number;
    rateTHBPOL?: number;
    txHash?: string;
    joined?: boolean;
  } | null;
  created_at: string;
  updated_at: string;
}

export default function PremiumArea() {
  const account = useActiveAccount();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!account?.address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching user data for wallet:', account.address);
        
        // Use the same API endpoint as the admin dashboard
        const response = await fetch(`/api/users?user_id=${account.address}`);
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          // Try to parse the error response as JSON first
          try {
            const errorData = await response.json();
            console.error('API error response (JSON):', errorData);
            
            if (errorData.error === 'User not found') {
              setError('ไม่พบข้อมูลผู้ใช้ในระบบ - กรุณาตรวจสอบว่าท่านได้ลงทะเบียนแล้วหรือยัง');
              return;
            }
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          } catch (jsonError) {
            // If JSON parsing fails, fall back to text
            const errorText = await response.text();
            console.error('API error response (text):', errorText);
            throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();
        console.log('API response data:', data);
        
        setUserData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [account?.address]);

  // Check if user is in Plan A
  const isPlanA = userData?.plan_a !== null && userData?.plan_a !== undefined;

  // Check if user is in Plan B
  const isPlanB = userData?.plan_b !== null && userData?.plan_b !== undefined;

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'ไม่มีข้อมูล';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format number for display
  const formatNumber = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '0.00';
    
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex flex-col items-center">
      <div className="flex flex-col items-center justify-center p-5 m-5 border border-gray-800 rounded-lg">
        <Link href="/" passHref>
          <Image
            src={dprojectIcon}
            alt=""
            className="mb-4 size-[100px] md:size-[100px]"
            style={{
              filter: "drop-shadow(0px 0px 24px #a726a9a8"
            }}
          />
        </Link>

        <h1 className="p-4 text-1xl md:text-3xl text-2xl font-semibold md:font-bold tracking-tighter">
          ยืนยันการเข้าร่วม Plan B
        </h1>
        <div className="flex justify-center mb-2">
          <WalletConnect />
        </div>

        {loading && account?.address && (
          <div className="flex flex-col items-center justify-center p-5 border border-gray-800 rounded-lg text-[19px] text-center font-bold mt-10">
            <p>กำลังโหลดข้อมูล...</p>
            <p className="text-sm mt-2">Wallet: {account.address.substring(0, 10)}...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-5 border border-gray-800 rounded-lg text-[19px] text-center font-bold mt-10">
            <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
            {account?.address && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-sm font-mono break-all">
                  Wallet: {account.address}
                </p>
              </div>
            )}
            <p className="text-sm mt-4">
              หากท่านเป็นสมาชิกใหม่ กรุณาติดต่อผู้ดูแลระบบเพื่อลงทะเบียน
            </p>
          </div>
        )}

        {userData && (
          <div className="flex flex-col items-center justify-center p-5 border border-gray-800 rounded-lg text-[19px] text-center mt-10">
            <span className="m-2 text-[#eb1c24] text-[22px] animate-blink font-bold">
              {isPlanB ? "Plan B Member" : "Not a Plan B Member"}
            </span>
            <div className="flex flex-col m-2 text-gray-200 text-[16px] text-left ">
            <p className="text-underline text-[20px] text-bold">รายละเอียดสมาชิก</p>
            เลขกระเป๋า: {userData.user_id}<br />
            อีเมล: {userData.email || 'ไม่มีข้อมูล'}<br />
            ชื่อ: {userData.name || 'ไม่มีข้อมูล'}<br />
            เข้า Plan A: {isPlanA ? "ใช่" : "ไม่ใช่"}<br />
            Token ID: {userData.token_id || 'ไม่มีข้อมูล'}<br />
            PR by: {userData.referrer_id || "ไม่มี"}<br />
            {/* วันที่สมัคร: {formatDate(userData.created_at)}<br />
            อัปเดตล่าสุด: {formatDate(userData.updated_at)}<br /> */}
            </div>
            {/* Display Plan A details if available */}
            {isPlanA && userData.plan_a && (
              <div className="w-full mt-4 p-3 border border-blue-500 rounded-lg">
                <h3 className="p-4 text-blue-400 text-[24px]">รายละเอียด Plan A</h3>
                <p>POL: {formatNumber(userData.plan_a.POL)}</p>
                <p>Rate: {formatNumber(userData.plan_a.rateTHBPOL)} THB/POL</p>
                <p>วันที่: {userData.plan_a.dateTime ? formatDate(userData.plan_a.dateTime) : 'N/A'}</p>
                {userData.plan_a.txHash && (
                  <p className="text-xs font-mono">Tx: {userData.plan_a.txHash.substring(0, 20)}...</p>
                )}
              </div>
            )}
            
            {/* Display Plan B details if available */}
            {isPlanB && userData.plan_b && (
              <div className="w-full mt-4 p-3 border border-green-500 rounded-lg">
                <h3 className="p-4 text-[24px] text-green-400">ยอดสะสม Plan B</h3>
                <p>POL: {formatNumber(userData.plan_b.POL)}</p>
                <p>Rate: {formatNumber(userData.plan_b.rateTHBPOL)} THB/POL</p>
                <p>วันที่: {userData.plan_b.dateTime ? formatDate(userData.plan_b.dateTime) : 'N/A'}</p>
                {userData.plan_b.txHash && (
                  <p className="text-xs font-mono">Tx: {userData.plan_b.txHash.substring(0, 20)}...</p>
                )}
              </div>
            )}
            
            <p className="mt-4">สิทธิพิเศษ<br />สำหรับสมาชิก</p>
            <span className="mt-2 text-[#eb1c24] text-3xl animate-blink">D1</span>
          </div>
        )}

        {!account?.address && (
          <div className="flex flex-col items-center justify-center p-5 border border-gray-800 rounded-lg text-[19px] text-center font-bold mt-10">
            <p>กรุณาเชื่อมต่อกระเป๋าเงินเพื่อดูข้อมูล</p>
          </div>
        )}
        
        <div className="flex flex-col items-center mb-6">
          <WalletPublicKey walletAddress={account?.address || ""}/>
        </div>

      </div>
      <div className='px-1 w-full'>
        <Footer />
      </div>
      <div className="flex flex-col items-center">
        <Link 
          className="flex flex-col mt-4 border border-zinc-500 px-4 py-3 rounded-lg hover:bg-zinc-800 transition-colors hover:border-zinc-800"
          href="/"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </main>
  )
}

type walletAddresssProps = {
  walletAddress?: string;
};

const WalletPublicKey: React.FC<walletAddresssProps> = ({ walletAddress }) => {
  const handleCopy = () => {
    const link = `https://dfi.fund/referrer/${walletAddress}`;
    navigator.clipboard.writeText(link);
    alert("ลิ้งค์ถูกคัดลอกไปยังคลิปบอร์ดแล้ว!");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div 
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          fontSize: "24px",
          justifyContent: "center",
          paddingTop: "15px",
        }}
      >
        <span className="mt-4 text-[22px]">ลิ้งค์แนะนำของท่าน</span>
        <div 
          style={{border: "1px solid #dfea08", background: "#2b2b59", padding: "4px 8px", margin: "6px", cursor: "pointer"}} 
          onClick={handleCopy}
        >
          <p className="text-[16px] break-all">
            {walletAddress ? `https://dfi.fund/referrer/${walletAddress}` : "ยังไม่ได้เชื่อมกระเป๋า !"}
          </p>    
        </div>
        <span className="text-center mt-4 text-[20px] break-words">เพื่อส่งให้ผู้มุ่งหวัง ที่ท่านต้องการแนะนำ</span>
      </div>
    </div>
  )
};