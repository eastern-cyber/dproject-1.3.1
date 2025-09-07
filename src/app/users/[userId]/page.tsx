//src/app/users/[userId]/page.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Fixed: changed from next/router
import { useEffect, useState } from "react";
import dprojectIcon from "../../../../public/DProjectLogo_650x600.svg";
import WalletConnect from "@/components/WalletConnect";
import Footer from "@/components/Footer";

interface UserData {
  user_id?: string;
  email?: string;
  name?: string;
  token_id?: string;
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
                
                const response = await fetch(`/api/user/${resolvedParams.userId}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.error) {
                    setError(data.error);
                } else {
                    setUserData(data);
                    // Set referrer data if needed
                    setReferrerData({
                        var1: data.user_id || '',
                        var2: data.email || '',
                        var3: data.name || '',
                        var4: data.token_id || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setLoading(false);
            }
        };

        if (resolvedParams.userId) {
            fetchUserData();
        }
    }, [resolvedParams.userId]);

    return (
        <main className="p-4 pb-10 min-h-[100vh] flex flex-col items-center">
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
                <h1 className="p-4 md:text-2xl text-2xl font-semibold md:font-bold tracking-tighter">
                    สมัครใช้งาน
                </h1>
                <div className="flex justify-center m-5">
                    <WalletConnect />
                </div>
                <div className="flex flex-col items-center justify-center p-2 m-2">
                    <p className="flex flex-col items-center justify-center text-[20px] m-2 text-center break-word">
                        <b>ขอแสดงความยืนดี กระบวนการยืนยันสมาชิกภาพของท่าน เสร็จสมบูรณ์แล้ว ภายใต้การแนะนำของ</b>
                    </p>
                    
                    {loading ? (
                        <p className="text-gray-400 text-sm mt-2">กำลังโหลดข้อมูล...</p>
                    ) : error ? (
                        <p className="text-red-400 text-sm mt-2">{error}</p>
                    ) : referrerData ? (
                        <div className="mt-4 text-center gap-6 bg-gray-900 p-4 border border-1 border-gray-400">
                            <p className="text-lg text-gray-300">
                                <b>เลขกระเป๋าผู้แนะนำ:</b> {referrerData.var1 ? `${referrerData.var1.slice(0, 6)}...${referrerData.var1.slice(-4)}` : "ไม่พบกระเป๋า"}<br />
                            </p>
                            <p className="text-lg text-gray-300">
                                <b>อีเมล:</b> {referrerData.var2}
                            </p>
                            <p className="text-lg text-gray-300 mt-1">
                                <b>ชื่อ:</b> {referrerData.var3}
                            </p>
                            <p className="text-lg text-red-600 mt-1">
                                <b>Token ID: {referrerData.var4} </b>
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm mt-2">ไม่พบข้อมูลผู้ใช้งาน</p>
                    )}
                    
                    <div className="items-centerflex border border-gray-400 bg-[#2b2b59] p-2.5 mt-5 w-full">
                        <p className="text-[18px] break-all">
                            <center>
                            {resolvedParams.userId ? `${resolvedParams.userId}` : "ไม่พบกระเป๋า"}
                            </center>
                        </p>
                    </div>
                </div>
                
                {!loading && !error && referrerData && (
                    <div className="flex flex-col items-center mb-6">
                        {/* <button 
                            onClick={navigateToConfirmPage} 
                            className="flex flex-col mt-1 border border-zinc-100 px-4 py-3 rounded-lg bg-red-700 hover:bg-zinc-800 transition-colors hover:border-zinc-400"
                        >
                            ดำเนินการต่อ
                        </button> */}
                        aaa
                    </div>
                )}
            </div>
            <div className='px-1 w-full'>
                <Footer />
            </div>
        </main>
    );
}