"use client";
import { useTheme } from '@/context/ThemeContext';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import dprojectIcon from "../../../../public/DProjectLogo_650x600.svg";
import WalletConnect from "@/components/WalletConnect";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

interface ReferrerData {
  user_id?: string;
  email?: string;
  name?: string;
  token_id?: string;
}

interface DropdownOption {
  id: string;
  label: string;
  value: string;
  amountTHB: number;
}

export default function ReferrerDetails({ params }: { params: Promise<{ referrerId: string }> }) {
    const [resolvedParams, setResolvedParams] = useState<{ referrerId: string }>({ referrerId: '' });
    const [referrerData, setReferrerData] = useState<ReferrerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string>('400');
    const [customReferrerId, setCustomReferrerId] = useState<string>('');
    const router = useRouter();
    const { theme } = useTheme();

    // Package options
    const packageOptions: DropdownOption[] = [
        { id: '400', label: '400 THB - Member Package', value: '400', amountTHB: 400 },
        { id: '800', label: '800 THB - Upstar Package', value: '800', amountTHB: 800 },
    ];

    useEffect(() => {
        const resolveParams = async () => {
            const resolved = await params;
            setResolvedParams(resolved);
        };
        resolveParams();
    }, [params]);

    useEffect(() => {
        const fetchReferrerData = async () => {
            if (!resolvedParams.referrerId) return;

            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(`/api/referrer/${resolvedParams.referrerId}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("ไม่พบข้อมูลผู้แนะนำ");
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.error) {
                    setError(data.error);
                } else {
                    setReferrerData(data);
                }
            } catch (error) {
                console.error("Error fetching referrer data:", error);
                setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setLoading(false);
            }
        };

        if (resolvedParams.referrerId) {
            fetchReferrerData();
        }
    }, [resolvedParams.referrerId]);

    const navigateToConfirmPage = () => {
        // Get selected package details
        const selectedPackageDetails = packageOptions.find(pkg => pkg.value === selectedPackage);
        
        if (!selectedPackageDetails) {
            setError("กรุณาเลือกแพ็กเกจ");
            return;
        }

        let referrerInfo;

        // Use the original referrer from URL
        referrerInfo = {
            var1: resolvedParams.referrerId || "N/A",
            var2: referrerData?.email || "N/A",
            var3: referrerData?.name || "N/A",
            var4: referrerData?.token_id || "N/A",
            package: selectedPackageDetails.value,
            amountTHB: selectedPackageDetails.amountTHB,
            option: 'original-referrer'
        };

        sessionStorage.setItem("mintingsData", JSON.stringify(referrerInfo));
        router.push("/referrer/confirm");
    };

    const formatWalletAddress = (address: string) => {
        if (!address) return "ไม่พบกระเป๋า";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <main className="p-4 pb-10 min-h-[100vh] flex flex-col items-center">
        <div className={theme === 'dark' ? 'bg-[#110030] text-gray-200' : 'bg-white text-gray-800'}>
            <div className="flex flex-col items-center justify-center p-10 m-5 border border-gray-800 rounded-lg">
                <Link href="/" passHref>
                    <Image
                        src={dprojectIcon}
                        alt="DProject Logo"
                        className="mb-4 size-[100px] md:size-[100px]"
                        style={{
                            filter: "drop-shadow(0px 0px 24px #a726a9a8",
                        }}
                    />
                </Link>
                <p className="p-4 text-2xl {theme === 'dark' ? 'text-amber-200' : ' text-gray-800'} font-semibold md:font-bold tracking-tighter text-center">
                    สมัครใช้งาน
                </p>
                <div className="flex justify-center m-5">
                    <WalletConnect />
                </div>
                <div className="flex flex-col items-center justify-center p-2 m-2">
                    <p className="flex flex-col items-center justify-center text-[20px] m-2 text-center break-word">
                        <b>ขณะนี้ ท่านกำลังดำเนินการสมัครสมาชิก ภายใต้การแนะนำของ</b>
                    </p>
                    
                    {loading ? (
                        <p className="text-gray-400 text-sm mt-2">กำลังโหลดข้อมูล...</p>
                    ) : error ? (
                        <p className="text-red-400 text-sm mt-2">{error}</p>
                    ) : referrerData ? (
                        <div className="mt-4 text-center gap-6 bg-gray-900 p-4 border border-1 border-gray-400 rounded-lg">
                            <p className="text-lg text-gray-300">
                                <b>เลขกระเป๋าผู้แนะนำ:</b> {formatWalletAddress(resolvedParams.referrerId)}<br />
                            </p>
                            <p className="text-lg text-gray-300">
                                <b>อีเมล:</b> {referrerData.email}
                            </p>
                            <p className="text-lg text-gray-300 mt-1">
                                <b>ชื่อ:</b> {referrerData.name}
                            </p>
                            <p className="text-lg text-red-600 mt-1">
                                <b>Token ID: {referrerData.token_id} </b>
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm mt-2">ไม่พบข้อมูลผู้แนะนำ</p>
                    )}
                    
                    <div className="items-center flex border border-gray-900 bg-gray-500 p-2.5 mt-5 w-full rounded-lg">
                        <p className="text-[18px] break-all text-center w-full">
                            {resolvedParams.referrerId ? formatWalletAddress(resolvedParams.referrerId) : "ไม่พบกระเป๋า"}
                        </p>
                    </div>

                    {/* Package Selection Dropdown */}
                    <div className="w-full mt-6">
                        <label htmlFor="package-select" className="block text-lg font-medium mb-2">
                            เลือกแพ็กเกจสมาชิก:
                        </label>
                        <select
                            id="package-select"
                            value={selectedPackage}
                            onChange={(e) => setSelectedPackage(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                        >
                            {packageOptions.map((option) => (
                                <option key={option.id} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Package Description */}
                    <div className="w-full mt-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">
                            {selectedPackage === '400' ? 'Member Package (400 THB)' : 'Upstar Package (800 THB)'}
                        </h3>
                        <ul className="text-sm list-disc list-inside space-y-1">
                            {selectedPackage === '400' ? (
                                <>
                                    <li>สิทธิ์การเป็นสมาชิกพรีเมี่ยม</li>
                                    <li>เข้าถึงแอปพลิเคชั่นก๊อกๆๆ</li>
                                    <li>ส่วนลดพิเศษสำหรับสมาชิก</li>
                                    <li>การสนับสนุนจากระบบแนะนำ</li>
                                </>
                            ) : (
                                <>
                                    <li>สิทธิ์ทั้งหมดของ Member Package</li>
                                    <li>โบนัสเพิ่มเติมสำหรับ Upstar</li>
                                    <li>อัตราค่าตอบแทนที่สูงขึ้น</li>
                                    <li>สิทธิพิเศษระดับ VIP</li>
                                    <li>การสนับสนุนแบบพิเศษ</li>
                                </>
                            )}
                        </ul>
                        <p className="mt-2 text-lg font-bold text-green-600 dark:text-green-400">
                            ราคา: {selectedPackage === '400' ? '400' : '800'} THB
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col items-center mb-6 hover:text-amber-100">
                    <button 
                        onClick={navigateToConfirmPage} 
                        className="dark:text-amber-100 flex flex-col mt-1 border border-zinc-100 px-4 py-3 rounded-lg dark:bg-red-500 bg-red-700 hover:bg-zinc-800 hover:text-amber-100 transition-colors hover:border-zinc-400 cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? 'กำลังโหลด...' : 'ดำเนินการต่อ'}
                    </button>
                </div>
            </div>
            <div className='px-1 w-full'>
                <Footer />
            </div>
        </div>
        </main>
    );
}