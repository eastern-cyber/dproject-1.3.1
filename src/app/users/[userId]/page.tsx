//src/app/users/[userId]/page.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dprojectIcon from "../../../../public/DProjectLogo_650x600.svg";
import WalletConnect from "@/components/WalletConnect";
import Footer from "@/components/Footer";

interface UserData {
  user_id?: string;
  email?: string;
  name?: string;
  token_id?: string;
  referrer_id?: string;
}

type ReferrerData = {
  var1: string;
  var2: string;
  var3: string;
  var4: string;
};

export default function UserDetails({ params }: { params: Promise<{ userId: string }> }) {
    const [resolvedParams, setResolvedParams] = useState<{ userId: string }>({ userId: '' });
    const [referrerData, setReferrerData] = useState<ReferrerData | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const resolveParams = async () => {
            const resolved = await params;
            setResolvedParams(resolved);
        };
        resolveParams();
    }, [params]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!resolvedParams.userId) return;

            try {
                setLoading(true);
                setError(null);
                
                // Try to get data from sessionStorage first (from the previous page)
                const storedData = sessionStorage.getItem("mintingsData");
                
                if (storedData) {
                    try {
                        const parsedData = JSON.parse(storedData);
                        setReferrerData({
                            var1: parsedData.var1 || '',
                            var2: parsedData.var2 || '',
                            var3: parsedData.var3 || '',
                            var4: parsedData.var4 || ''
                        });
                        
                        // Also set user data from the URL params and session data
                        setUserData({
                            user_id: resolvedParams.userId,
                            email: parsedData.userEmail || parsedData.var2 || "ไม่พบข้อมูล",
                            name: parsedData.userName || parsedData.var3 || "ไม่พบข้อมูล",
                            token_id: parsedData.userTokenId || parsedData.var4 || "ไม่พบข้อมูล",
                            referrer_id: parsedData.var1
                        });
                        
                        setLoading(false);
                        return;
                    } catch (parseError) {
                        console.error("Error parsing session data:", parseError);
                    }
                }

                // If no session data, try to fetch from API
                try {
                    const response = await fetch(`/api/user/${resolvedParams.userId}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.error) {
                            setError(data.error);
                        } else {
                            setUserData(data);
                            // If the API returns referrer data, use it
                            if (data.referrer_id) {
                                setReferrerData({
                                    var1: data.referrer_id,
                                    var2: data.referrer_email || "ไม่พบข้อมูล",
                                    var3: data.referrer_name || "ไม่พบข้อมูล",
                                    var4: data.referrer_token_id || "ไม่พบข้อมูล"
                                });
                            }
                        }
                    }
                } catch (apiError) {
                    console.error("API fetch error:", apiError);
                    // If API fails, set basic user data from URL
                    setUserData({
                        user_id: resolvedParams.userId,
                        email: "ไม่พบข้อมูล",
                        name: "ไม่พบข้อมูล",
                        token_id: "ไม่พบข้อมูล"
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
                
                // Fallback: at least show the wallet address from URL
                setUserData({
                    user_id: resolvedParams.userId,
                    email: "ไม่สามารถโหลดข้อมูล",
                    name: "ไม่สามารถโหลดข้อมูล",
                    token_id: "ไม่สามารถโหลดข้อมูล"
                });
            } finally {
                setLoading(false);
            }
        };

        if (resolvedParams.userId) {
            fetchUserData();
        }
    }, [resolvedParams.userId]);

    // Function to format wallet address
    const formatWalletAddress = (address: string) => {
        if (!address) return "ไม่พบกระเป๋า";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <main className="p-4 pb-10 min-h-[100vh] flex flex-col items-center bg-gray-950">
            <div className="flex flex-col items-center justify-center p-6 md:p-10 m-2 md:m-5 border border-gray-800 rounded-lg max-w-md w-full">
                <Link href="/" passHref>
                    <Image
                        src={dprojectIcon}
                        alt="DProject Logo"
                        className="mb-4 size-[80px] md:size-[100px]"
                        style={{
                            filter: "drop-shadow(0px 0px 24px #a726a9a8)",
                        }}
                    />
                </Link>
                <h1 className="p-4 text-2xl font-semibold md:font-bold tracking-tighter text-center">
                    สมัครใช้งาน
                </h1>
                <div className="flex justify-center m-3">
                    <WalletConnect />
                </div>
                <div className="flex flex-col items-center justify-center p-2 m-2">
                    <p className="flex flex-col items-center justify-center text-[18px] m-2 text-center">
                        <b>ขอแสดงความยินดี กระบวนการยืนยันสมาชิกภาพของท่าน เสร็จสมบูรณ์แล้ว</b>
                    </p>
                    
                    {loading ? (
                        <p className="text-gray-400 text-sm mt-2">กำลังโหลดข้อมูล...</p>
                    ) : error ? (
                        <p className="text-red-400 text-sm mt-2">{error}</p>
                    ) : referrerData ? (
                        <>
                            <p className="text-[16px] text-center mb-4 text-gray-300">
                                ภายใต้การแนะนำของ
                            </p>
                            <div className="mt-2 text-center bg-gray-900 p-4 border border-gray-600 rounded-lg w-full">
                                <p className="text-lg text-gray-300">
                                    <b>เลขกระเป๋าผู้แนะนำ:</b> {formatWalletAddress(referrerData.var1)}<br />
                                </p>
                                <p className="text-lg text-gray-300 mt-2">
                                    <b>อีเมล:</b> {referrerData.var2}
                                </p>
                                <p className="text-lg text-gray-300 mt-2">
                                    <b>ชื่อ:</b> {referrerData.var3}
                                </p>
                                <p className="text-lg text-red-500 mt-2">
                                    <b>Token ID: {referrerData.var4}</b>
                                </p>
                            </div>
                        </>
                    ) : userData?.referrer_id ? (
                        <>
                            <p className="text-[16px] text-center mb-4 text-gray-300">
                                ภายใต้การแนะนำของ
                            </p>
                            <div className="mt-2 text-center bg-gray-900 p-4 border border-gray-600 rounded-lg w-full">
                                <p className="text-lg text-gray-300">
                                    <b>เลขกระเป๋าผู้แนะนำ:</b> {formatWalletAddress(userData.referrer_id)}<br />
                                </p>
                                <p className="text-lg text-gray-300 mt-2">
                                    <b>อีเมล:</b> {userData.email || "ไม่พบข้อมูล"}
                                </p>
                                <p className="text-lg text-gray-300 mt-2">
                                    <b>ชื่อ:</b> {userData.name || "ไม่พบข้อมูล"}
                                </p>
                                <p className="text-lg text-red-500 mt-2">
                                    <b>Token ID: {userData.token_id || "ไม่พบข้อมูล"}</b>
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-400 text-sm mt-2">ไม่พบข้อมูลผู้แนะนำ</p>
                    )}
                    
                    {/* Display current user's wallet address and information */}
                    <div className="mt-6 p-4 border border-gray-600 bg-gray-800 rounded-lg w-full">
                        <p className="text-[16px] text-center text-gray-300 mb-4">
                            <b>ข้อมูลสมาชิกใหม่</b>
                        </p>
                        
                        <div className="space-y-3">
                            <p className="text-[15px] text-gray-300">
                                <b>เลขกระเป๋าของคุณ:</b>
                                <span className="text-green-400 ml-2 break-all block mt-1">
                                    {resolvedParams.userId || "ไม่พบกระเป๋า"}
                                </span>
                            </p>
                            
                            <p className="text-[15px] text-gray-300">
                                <b>อีเมล:</b>
                                <span className="text-blue-400 ml-2 block mt-1">
                                    {userData?.email || "ไม่พบข้อมูล"}
                                </span>
                            </p>
                            
                            <p className="text-[15px] text-gray-300">
                                <b>ชื่อ:</b>
                                <span className="text-yellow-400 ml-2 block mt-1">
                                    {userData?.name || "ไม่พบข้อมูล"}
                                </span>
                            </p>
                            
                            <p className="text-[15px] text-gray-300">
                                <b>Token ID:</b>
                                <span className="text-red-400 ml-2 block mt-1">
                                    {userData?.token_id || "ไม่พบข้อมูล"}
                                </span>
                            </p>
                            
                            <div className="pt-3 border-t border-gray-600">
                                <p className="text-[15px] text-gray-300 mb-2">
                                    <b>ลิ้งค์แนะนำของท่าน:</b>
                                </p>
                                <div className="bg-gray-700 p-2 rounded border border-gray-500">
                                    <p className="text-[13px] text-blue-300 break-all text-center">
                                        https://dfi.fund/referrer/{resolvedParams.userId || "ไม่พบกระเป๋า"}
                                    </p>
                                    <button
                                        onClick={() => {
                                            const link = `https://dfi.fund/referrer/${resolvedParams.userId}`;
                                            navigator.clipboard.writeText(link);
                                            alert('คัดลอกลิ้งค์เรียบร้อยแล้ว!');
                                        }}
                                        className="w-full mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[12px] rounded"
                                    >
                                        คัดลอกลิ้งค์
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {!loading && (
                    <div className="flex flex-col items-center mt-6">
                        <Link 
                            href="/"
                            className="px-6 py-3 border border-zinc-100 rounded-lg bg-red-700 hover:bg-red-800 transition-colors hover:border-zinc-400 text-center"
                        >
                            กลับสู่หน้าหลัก
                        </Link>
                    </div>
                )}
            </div>
            <div className='w-full mt-8'>
                <Footer />
            </div>
        </main>
    );
}