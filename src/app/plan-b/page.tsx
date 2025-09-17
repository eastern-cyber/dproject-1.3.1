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
  created_at: string;
  updated_at: string;
}

interface PlanBData {
  id: number;
  user_id: string;
  pol: number;
  date_time: string;
  link_ipfs: string;
  rate_thb_pol: number;
  cumulative_pol: number;
  append_pol: number;
  append_tx_hash: string;
  created_at: string;
  updated_at: string;
}

interface BonusData {
  id: number;
  user_id: string;
  pr_a: number;
  pr_b: number;
  cr: number;
  rt: number;
  ar: number;
  bonus_date: string;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export default function PremiumArea() {
  const account = useActiveAccount();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [planBData, setPlanBData] = useState<PlanBData | null>(null);
  const [bonusData, setBonusData] = useState<BonusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

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
        
        // Fetch user data
        const userResponse = await fetch(`/api/users?user_id=${account.address}`);
        
        console.log('API response status:', userResponse.status);
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          console.error('API error response:', errorData);
          
          if (errorData.error === 'User not found') {
            setError('ไม่พบข้อมูลผู้ใช้ในระบบ - กรุณาตรวจสอบว่าท่านได้ลงทะเบียนแล้วหรือยัง');
            return;
          }
          throw new Error(errorData.error || `HTTP error! status: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        console.log('User data:', userData);
        setUserData(userData);

        // Fetch Plan B data
        try {
          const planBResponse = await fetch(`/api/plan-b?user_id=${account.address}`);
          if (planBResponse.ok) {
            const planBData = await planBResponse.json();
            console.log('Plan B data:', planBData);
            setPlanBData(planBData);
          }
        } catch (planBError) {
          console.log('No Plan B data found or error fetching:', planBError);
        }

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

  const fetchBonusData = async () => {
    if (!account?.address) return;

    try {
      setModalLoading(true);
      const bonusResponse = await fetch(`/api/bonus?user_id=${account.address}`);
      
      if (bonusResponse.ok) {
        const bonusData = await bonusResponse.json();
        console.log('Raw bonus API response:', bonusData);
        
        // Convert all numeric fields to numbers to ensure proper calculation
        const processedBonusData = bonusData.map((bonus: BonusData) => ({
          ...bonus,
          pr_a: Number(bonus.pr_a),
          pr_b: Number(bonus.pr_b),
          cr: Number(bonus.cr),
          rt: Number(bonus.rt),
          ar: Number(bonus.ar)
        }));
        
        console.log('Processed bonus data:', processedBonusData);
        
        // Debug: check individual values
        processedBonusData.forEach((bonus: BonusData, index: number) => {
          console.log(`Bonus ${index}:`, {
            pr_a: bonus.pr_a,
            pr_b: bonus.pr_b,
            cr: bonus.cr,
            rt: bonus.rt,
            ar: bonus.ar,
            total: bonus.pr_a + bonus.pr_b + bonus.cr + bonus.rt + bonus.ar
          });
        });
        
        setBonusData(processedBonusData);
      } else {
        console.log('No bonus data found');
        setBonusData([]);
      }
    } catch (bonusError) {
      console.error('Error fetching bonus data:', bonusError);
      setBonusData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoinPlanB = () => {
    setShowModal(true);
    fetchBonusData();
  };

  const confirmJoinPlanB = async () => {
    // Add your logic here to handle Plan B confirmation
    // This would typically involve making a POST request to an API endpoint
    // that creates a new Plan B record for the user
    alert('ยืนยันการเข้าร่วม Plan B - ฟังก์ชันนี้จะถูกพัฒนาต่อไป');
    setShowModal(false);
  };

  // Check if user is in Plan A
  const isPlanA = userData?.plan_a !== null && userData?.plan_a !== undefined;

  // Check if user is in Plan B (using the separate plan_b table)
  const isPlanB = planBData !== null;



  // Calculate total bonus - sum of ALL bonus components
  const totalBonus = bonusData.reduce((total, bonus) => {
    return total + 
          (Number(bonus.pr_a) || 0) + 
          (Number(bonus.pr_b) || 0) + 
          (Number(bonus.cr) || 0) + 
          (Number(bonus.rt) || 0) + 
          (Number(bonus.ar) || 0);
  }, 0);

  const netBonus = totalBonus * 0.05; // 5% of total bonus

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
              {isPlanB ? "ท่านเป็นสมาชิก Plan B เรียบร้อยแล้ว" : "ท่านยังไม่ได้เป็นสมาชิก Plan B"}
            </span>
            <div className="flex flex-col m-2 text-gray-200 text-[16px] text-left ">
            <p className="text-underline text-[20px] text-bold">รายละเอียดสมาชิก</p>
            เลขกระเป๋า: {userData.user_id}<br />
            อีเมล: {userData.email || 'ไม่มีข้อมูล'}<br />
            ชื่อ: {userData.name || 'ไม่มีข้อมูล'}<br />
            เข้า Plan A: {isPlanA ? "ใช่" : "ไม่ใช่"}<br />
            Token ID: {userData.token_id || 'ไม่มีข้อมูล'}<br />
            PR by: {userData.referrer_id || "ไม่มี"}<br />
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
            {isPlanB && planBData && (
              <div className="w-full mt-4 p-3 border border-green-500 rounded-lg">
                <h3 className="p-4 text-[24px] text-green-400">ยอดสะสม Plan B</h3>
                <p>POL: {formatNumber(planBData.pol)}</p>
                <p>Rate: {formatNumber(planBData.rate_thb_pol)} THB/POL</p>
                <p>วันที่: {formatDate(planBData.date_time)}</p>
                <p>Cumulative POL: {formatNumber(planBData.cumulative_pol)}</p>
                <p>Append POL: {formatNumber(planBData.append_pol)}</p>
                {planBData.append_tx_hash && (
                  <p className="text-xs font-mono">Tx: {planBData.append_tx_hash.substring(0, 20)}...</p>
                )}
              </div>
            )}

            {/* Show Join Plan B button if user is not in Plan B */}
            {!isPlanB && userData && (
              <div className="w-full mt-6">
                <button
                  onClick={handleJoinPlanB}
                  className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                >
                  ยืนยันเข้าร่วม Plan B
                </button>
              </div>
            )}
            
            <p className="mt-4">สิทธิพิเศษ<br />สำหรับสมาชิก</p>
            <span className="mt-2 text-[#eb1c24] text-3xl animate-blink">D1</span>
          </div>
        )}

        {!account?.address && (
          <div className="flex flex-col items-center justify-center p-5 border border-gray-800 rounded-lg text-[19px] text-center font-bold mt-10">
            <p>กรุณาเชื่อมต่อกระเป๋า</p>
          </div>
        )}
        
        <div className="flex flex-col items-center mb-6">
          <WalletPublicKey walletAddress={account?.address || ""}/>
        </div>

      </div>

      {/* Plan B Confirmation Modal */}
      {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
      <h2 className="text-xl font-bold mb-4 text-center">ยืนยันการเข้าร่วม Plan B</h2>
      
      {modalLoading ? (
        <p className="text-center">กำลังคำนวณโบนัส...</p>
      ) : (
        <>
          <div className="mb-4">
            <p className="font-semibold">ยอดสะสมสุทธิของท่าน:</p>
            <p className="text-2xl text-green-600 font-bold">
              {formatNumber(netBonus)} POL
            </p>
            <p className="text-sm text-gray-500">
              (5% ของโบนัสทั้งหมด: {formatNumber(totalBonus)} POL)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="text-sm">PR A: {formatNumber(bonusData.reduce((sum, b) => sum + (Number(b.pr_a) || 0), 0))}</div>
            <div className="text-sm">PR B: {formatNumber(bonusData.reduce((sum, b) => sum + (Number(b.pr_b) || 0), 0))}</div>
            <div className="text-sm">CR: {formatNumber(bonusData.reduce((sum, b) => sum + (Number(b.cr) || 0), 0))}</div>
            <div className="text-sm">RT: {formatNumber(bonusData.reduce((sum, b) => sum + (Number(b.rt) || 0), 0))}</div>
            <div className="text-sm">AR: {formatNumber(bonusData.reduce((sum, b) => sum + (Number(b.ar) || 0), 0))}</div>
            <div className="text-sm col-span-2 border-t pt-2 mt-2">
              <strong>Total Bonus: {formatNumber(totalBonus)} POL</strong>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              ยกเลิก
            </button>
            <button
              onClick={confirmJoinPlanB}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              ยืนยัน
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

      <div className='px-1 w-full'>
        <Footer />
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