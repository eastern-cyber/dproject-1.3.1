//src/app/referrer/confirm/page.tsx
"use client";

import { client } from "@/lib/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import WalletConnect from "../../../components/WalletConnect";
import { useActiveAccount } from "thirdweb/react";
import dprojectIcon from "../../../../public/DProjectLogo_650x600.svg";
import { defineChain, getContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import Footer from "@/components/Footer";
import { prepareContractCall, toWei, sendTransaction, readContract } from "thirdweb";
import { PlanAConfirmModal } from "@/components/planAconfirmModal";

// Constants
const RECIPIENT_ADDRESS = "0x3BBf139420A8Ecc2D06c64049fE6E7aE09593944";
const EXCHANGE_RATE_REFRESH_INTERVAL = 300000; // 5 minutes in ms
const MEMBERSHIP_FEE_THB = 400;
const EXCHANGE_RATE_BUFFER = 0.1; // 0.1 THB buffer to protect against fluctuations

type UserData = {
  var1: string;
  var2: string;
  var3: string;
  var4: string;
};

type TransactionStatus = {
  firstTransaction: boolean;
  secondTransaction: boolean;
  error?: string;
};

// Add this type definition near the top of the file, after the existing types
type PlanAData = {
  dateTime: string;
  POL: string;
  rateTHBPOL: string;
  seventyPOL: string;
  thirtyPOL: string;
  seventyTxHash: string;
  thirtyTxHash: string;
  linkIPFS: string;
};

type DatabaseUserData = {
  user_id: string;
  referrer_id: string;
  plan_a: PlanAData;
};

const ConfirmPage = () => {
  // Tracking transaction completion
  const [isTransactionComplete, setIsTransactionComplete] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    firstTransaction: false,
    secondTransaction: false
  });
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);

  const [data, setData] = useState<UserData | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [adjustedExchangeRate, setAdjustedExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [polBalance, setPolBalance] = useState<string>("0");
  const [isMember, setIsMember] = useState(false);
  const [loadingMembership, setLoadingMembership] = useState(false);
  const account = useActiveAccount();

  // Fetch wallet balance when account changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) {
        setPolBalance("0");
        return;
      }
      
      try {
        const balanceResult = await readContract({
          contract: getContract({
            client,
            chain: defineChain(polygon),
            address: "0x0000000000000000000000000000000000001010"
          }),
          method: {
            type: "function",
            name: "balanceOf",
            inputs: [{ type: "address", name: "owner" }],
            outputs: [{ type: "uint256" }],
            stateMutability: "view"
          },
          params: [account.address]
        });

        const balanceInPOL = Number(balanceResult) / 10**18;
        setPolBalance(balanceInPOL.toFixed(4));
      } catch (err) {
        console.error("Error fetching balance:", err);
        setPolBalance("0");
      }
    };

    fetchBalance();
  }, [account]);

  // Fetch THB to POL exchange rate and calculate adjusted rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=thb"
        );
        if (!response.ok) throw new Error("Failed to fetch exchange rate");
        
        const data = await response.json();
        const currentRate = data["matic-network"].thb;
        const adjustedRate = Math.max(0.01, currentRate - EXCHANGE_RATE_BUFFER);
        
        setExchangeRate(currentRate);
        setAdjustedExchangeRate(adjustedRate);
        setError(null);
      } catch (err) {
        setError("ไม่สามารถโหลดอัตราแลกเปลี่ยนได้");
        console.error("Error fetching exchange rate:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, EXCHANGE_RATE_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Retrieve stored data when page loads
  useEffect(() => {
    const storedData = sessionStorage.getItem("mintingsData");
    if (storedData) {
      try {
        setData(JSON.parse(storedData));
      } catch (err) {
        console.error("Error parsing stored data:", err);
      }
    }
  }, []);

  // Check membership status from PostgreSQL
  useEffect(() => {
    const checkMembership = async () => {
      if (!account?.address) {
        setIsMember(false);
        return;
      }

      setLoadingMembership(true);
      try {
        const response = await fetch(`/api/check-membership?walletAddress=${account.address}`);
        if (!response.ok) throw new Error("Failed to fetch membership data");
        
        const result = await response.json();
        setIsMember(result.isMember);
      } catch (error) {
        console.error("Error checking membership:", error);
        setIsMember(false);
      } finally {
        setLoadingMembership(false);
      }
    };

    checkMembership();
  }, [account?.address]);

  const calculatePolAmount = () => {
    if (!adjustedExchangeRate) return null;
    const polAmount = MEMBERSHIP_FEE_THB / adjustedExchangeRate;
    return polAmount.toFixed(4);
  };

  // IPFS Storage Function
  const storeReportInIPFS = async (report: unknown) => {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
        },
        body: JSON.stringify({
          pinataContent: report,
          pinataMetadata: {
            name: `membership-payment-${Date.now()}.json`
          }
        })
      });

      if (!response.ok) throw new Error('Failed to store report in IPFS');
      
      const data = await response.json();
      return data.IpfsHash;
    } catch (error) {
      console.error("Error storing report in IPFS:", error);
      throw error;
    }
  };

  // Add user to PostgreSQL database
  // Update the addUserToDatabase function to accept the new type
const addUserToDatabase = async (userData: DatabaseUserData) => {
  try {
    const response = await fetch('/api/add-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Database error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding user to database:', error);
    throw error;
  }
};

  const executeTransaction = async (to: string, amountWei: bigint) => {
    try {
      const transaction = prepareContractCall({
        contract: getContract({
          client,
          chain: defineChain(polygon),
          address: "0x0000000000000000000000000000000000001010"
        }),
        method: {
          type: "function",
          name: "transfer",
          inputs: [
            { type: "address", name: "to" },
            { type: "uint256", name: "value" }
          ],
          outputs: [{ type: "bool" }],
          stateMutability: "payable"
        },
        params: [to, amountWei],
        value: amountWei
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account: account!
      });

      return { success: true, transactionHash };
    } catch (error) {
      console.error("Transaction failed:", error);
      return { success: false, error: (error as Error).message };
    }
  };

  // ... (previous imports and constants remain the same)

const handleConfirmTransaction = async () => {
    if (!account || !adjustedExchangeRate || !data?.var1) return;
    
    setIsProcessing(true);
    setTransactionStatus({ firstTransaction: false, secondTransaction: false });

    try {
        const totalPolAmount = calculatePolAmount();
        if (!totalPolAmount) throw new Error("Unable to calculate POL amount");

        const totalAmountWei = toWei(totalPolAmount);
        const seventyPercentWei = BigInt(Math.floor(Number(totalAmountWei) * 0.7));
        const thirtyPercentWei = BigInt(totalAmountWei) - seventyPercentWei;

        let firstTxHash = "";
        let secondTxHash = "";

        // Execute first transaction (70% to fixed recipient)
        const firstTransaction = await executeTransaction(RECIPIENT_ADDRESS, seventyPercentWei);
        
        if (!firstTransaction.success) {
            throw new Error(`First transaction failed: ${firstTransaction.error}`);
        }
        firstTxHash = firstTransaction.transactionHash!;
        setTransactionStatus(prev => ({ ...prev, firstTransaction: true }));

        // Execute second transaction (30% to referrer)
        const secondTransaction = await executeTransaction(data.var1, thirtyPercentWei);
        
        if (!secondTransaction.success) {
            throw new Error(`Second transaction failed: ${secondTransaction.error}`);
        }
        secondTxHash = secondTransaction.transactionHash!;
        setTransactionStatus(prev => ({ ...prev, secondTransaction: true }));

        // Get current time in Bangkok timezone
        const now = new Date();
        const formattedDate = now.toLocaleString('en-GB', {
            timeZone: 'Asia/Bangkok',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');

        // Store report in IPFS first to get the hash
        const report = {
            senderAddress: account.address,
            dateTime: formattedDate,
            timezone: "Asia/Bangkok (UTC+7)",
            referrer: data.var1,
            currentExchangeRate: exchangeRate,
            adjustedExchangeRate: adjustedExchangeRate,
            exchangeRateBuffer: EXCHANGE_RATE_BUFFER,
            transactions: [
                {
                    recipient: RECIPIENT_ADDRESS,
                    amountPOL: (Number(seventyPercentWei) / 10**18).toFixed(4),
                    amountTHB: (MEMBERSHIP_FEE_THB * 0.7).toFixed(2),
                    transactionHash: firstTxHash
                },
                {
                    recipient: data.var1,
                    amountPOL: (Number(thirtyPercentWei) / 10**18).toFixed(4),
                    amountTHB: (MEMBERSHIP_FEE_THB * 0.3).toFixed(2),
                    transactionHash: secondTxHash
                }
            ],
            totalAmountPOL: totalPolAmount,
            totalAmountTHB: MEMBERSHIP_FEE_THB
        };

        const ipfsHash = await storeReportInIPFS(report);
        setIpfsHash(ipfsHash);
        const ipfsLink = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        // Add user to PostgreSQL database with referrer_id and transaction details
        // Replace the addUserToDatabase function call with:
        const newUser: DatabaseUserData = {
          user_id: account.address,
          referrer_id: data.var1,
          plan_a: {
            dateTime: formattedDate,
            POL: totalPolAmount,
            rateTHBPOL: adjustedExchangeRate!.toFixed(4),
            seventyPOL: (Number(seventyPercentWei) / 10**18).toFixed(4),
            thirtyPOL: (Number(thirtyPercentWei) / 10**18).toFixed(4),
            seventyTxHash: firstTxHash,
            thirtyTxHash: secondTxHash,
            linkIPFS: ipfsLink
          }
        };

        await addUserToDatabase(newUser);

        alert(`การชำระเงินเรียบร้อยแล้ว! รายงานถูกเก็บไว้ใน IPFS`);
        setIsTransactionComplete(true);

    } catch (err) {
        console.error("Transaction process failed:", err);
        
        // Show specific error message based on which transaction failed
        if (transactionStatus.firstTransaction && !transactionStatus.secondTransaction) {
            alert("การทำรายการล้มเหลว: การโอน 30% ไปยังผู้แนะนำไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } else {
            alert("การทำรายการล้มเหลว: " + (err as Error).message);
        }
    } finally {
        setIsProcessing(false);
        setShowConfirmationModal(false);
    }
};

  // ... (rest of the component remains the same, including PaymentButton and return statement)
    const PaymentButton = () => {
    if (loadingMembership) {
      return (
        <div className="flex justify-center py-4">
          <p className="text-gray-400">กำลังตรวจสอบสถานะสมาชิก...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 md:gap-8">
        <p className="mt-4 text-center text-[18px]">
          <b>ค่าสมาชิก: <p className="text-yellow-500 text-[22px]">{MEMBERSHIP_FEE_THB} THB
          {adjustedExchangeRate && (
            <>
                &nbsp; ( ≈ {calculatePolAmount()} POL )
            </>
          )}
          </p></b>
          {exchangeRate && adjustedExchangeRate && (
            <>
              <span className="text-[17px] text-green-400">
                อัตราแลกเปลี่ยน: {adjustedExchangeRate.toFixed(2)} THB/POL
              </span><br />
            </>
          )}
          {loading && !error && (
            <span className="text-sm text-gray-400">กำลังโหลดอัตราแลกเปลี่ยน...</span>
          )}
          {error && (
            <span className="text-sm text-red-500">{error}</span>
          )}
        </p>
        <div className="flex flex-col gap-2 md:gap-4">
          {isMember ? (
            <button
              className="flex flex-col mt-1 border border-zinc-100 px-4 py-3 rounded-lg bg-gray-600 cursor-not-allowed"
              disabled
            >
              <span className="text-[18px]">ท่านเป็นสมาชิกอยู่แล้ว</span>
            </button>
          ) : (
            <button
              className={`flex flex-col mt-1 border border-zinc-100 px-4 py-3 rounded-lg transition-colors ${
                !account || !adjustedExchangeRate || isProcessing
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-red-700 hover:bg-red-800 hover:border-zinc-400"
              }`}
              onClick={() => setShowConfirmationModal(true)}
              disabled={!account || !adjustedExchangeRate || isProcessing}
            >
              <span className="text-[18px]">
                {!account ? "กรุณาเชื่อมต่อกระเป๋า" : "ดำเนินการต่อ"}
              </span>
            </button>
          )}
        </div>
        <p className="text-center text-[18px]">
          <p>
          เพื่อสนับสนุน <b>แอพพลิเคชั่น <span className="text-[26px] text-red-600">ก๊อกๆๆ</span></b> <br />
          ถือเป็นการยืนยันสถานภาพ
          </p>
          <span className="text-yellow-500 text-[22px]">
            <b>&quot;สมาชิกพรีเมี่ยม&quot;</b>
          </span><br />
          ภายใต้การแนะนำของ<br />
        </p>
        {data && (
          <div className="text-center text-[18px] bg-gray-900 p-4 border border-zinc-300 rounded-lg">
            <p className="text-lg text-gray-300">
              <b>เลขกระเป๋าผู้แนะนำ:</b> {data.var1.slice(0, 6)}...{data.var1.slice(-4)}
            </p>
            <p className="text-lg text-gray-300 mt-2">
              <b>อีเมล:</b> {data.var2}
            </p>
            <p className="text-lg text-gray-300 mt-2">
              <b>ชื่อ:</b> {data.var3}
            </p>
            <p className="text-lg text-red-500 mt-2">
              <b>Token ID: {data.var4}</b>
            </p>            
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex flex-col items-center bg-gray-950">
      <div className="flex flex-col items-center justify-center p-6 md:p-10 m-2 md:m-5 border border-gray-800 rounded-lg max-w-md w-full">
        <Image
          src={dprojectIcon}
          alt="DProject Logo"
          className="mb-4 size-[80px] md:size-[100px]"
          style={{
            filter: "drop-shadow(0px 0px 24px #a726a9a8"
          }}
          priority
        />
        <h1 className="p-4 text-2xl font-semibold md:font-bold tracking-tighter text-center">
          ยืนยันการเป็นสมาชิก
        </h1>
        
        <WalletConnect />
        
        {data ? (
          <>
            <div className="flex flex-col items-center justify-center w-full p-2 m-2">
              <PaymentButton />
              
              {/* Confirmation Modal */}
              {showConfirmationModal && (
                <PlanAConfirmModal onClose={() => setShowConfirmationModal(false)}>
                  <div className="p-6 bg-gray-900 rounded-lg border border-gray-700 max-w-md">
                    <h3 className="text-xl font-bold mb-4 text-center">ยืนยันการชำระ</h3>
                    <div className="mb-6 text-center">
                      <p className="text-[18px]">
                        ค่าสมาชิกจำนวน<br />
                        <span className="text-yellow-500 text-[22px] font-bold">
                          {MEMBERSHIP_FEE_THB} THB (≈ {calculatePolAmount()} POL)
                        </span>
                        <p className="text-yellow-500 text-2xl font-bold">
                          <ul className="text-[18px] mt-1 mb-4">
                            <li>{(MEMBERSHIP_FEE_THB * 0.7).toFixed(2)} THB เข้าระบบ</li>
                            <li>{(MEMBERSHIP_FEE_THB * 0.3).toFixed(2)} THB เข้าผู้แนะนำ (PR Bonus)</li>
                          </ul>
                        </p>
                      </p>
                      {exchangeRate && adjustedExchangeRate && (
                        <div className="mt-3 text-sm text-gray-300">
                          <p>อัตราแลกเปลี่ยน: {adjustedExchangeRate.toFixed(4)} THB/POL</p>
                        </div>
                      )}
                      {account && (
                        <p className="mt-3 text-[16]">
                          POL ในกระเป๋าของคุณ: <span className="text-green-400">{polBalance}</span>
                        </p>
                      )}
                      {account && parseFloat(polBalance) < parseFloat(calculatePolAmount() || "0") && (
                        <p className="mt-2 text-red-400 text-sm">
                          ⚠️ จำนวน POL ในกระเป๋าของคุณไม่เพียงพอ
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        className={`px-6 py-3 rounded-lg font-medium ${
                          !account || parseFloat(polBalance) < parseFloat(calculatePolAmount() || "0")
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                        onClick={handleConfirmTransaction}
                        disabled={!account || isProcessing || parseFloat(polBalance) < parseFloat(calculatePolAmount() || "0")}
                      >
                        {isProcessing ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
                      </button>
                      <button
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg"
                        onClick={() => setShowConfirmationModal(false)}
                        disabled={isProcessing}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                </PlanAConfirmModal>
              )}
            </div>
            <div className="w-full text-center flex flex-col items-center justify-center p-3 m-2 border border-gray-800 rounded-lg break-all">
              <p className="mb-4 font-medium"><u>ข้อมูลเพื่อการตรวจสอบระบบ</u></p> 
              <p className="mb-3">เลขกระเป๋าผู้แนะนำ:<br /> {data.var1}</p>
              <p className="mb-3">อีเมล: {data.var2}</p>
              <p className="mb-3">ชื่อ: {data.var3}</p>
              <p>TokenId: {data.var4}</p>
            </div>
          </>
        ) : (
          <p className="text-red-400 py-4">ไม่พบข้อมูลผู้แนะนำ</p>
        )}

        {isTransactionComplete && ipfsHash && (
          <div className="mt-4 p-4 bg-green-900 border border-green-400 rounded-lg">
            <p className="text-green-200 text-center">
              รายงานถูกเก็บไว้ใน IPFS สำเร็จ!
            </p>
            <p className="text-green-200 text-sm text-center mt-2">
              Hash: {ipfsHash.slice(0, 12)}...{ipfsHash.slice(-8)}
            </p>
            <a
              href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-blue-300 underline mt-2"
            >
              ดูรายงานใน IPFS
            </a>
          </div>
        )}
      </div>
      <div className='w-full mt-8'>
        <Footer />
      </div>
    </main>
  );
};

export default ConfirmPage;