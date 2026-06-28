import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, Eye } from "lucide-react";

export default function Login() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090616] via-[#100b2a] to-[#1c1145] flex flex-col items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Background abstract glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      {/* Decorative elements for outer div */}
      <div className="absolute top-12 right-12 grid grid-cols-6 gap-3 opacity-15 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
        ))}
      </div>
      <div className="absolute -bottom-40 -right-8 w-96 h-96 border-[0.5px] border-white/10 rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-16 w-80 h-80 border-[0.5px] border-white/10 rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-[960px] bg-[#120e26]/60 backdrop-blur-[12px] rounded-[28px] shadow-[0_25px_60px_rgba(168,85,247,0.15),0_10px_30px_rgba(0,0,0,0.4)] overflow-hidden border-[1px] border-[#a855f7]/25 flex flex-col md:flex-row min-h-[600px] relative z-10">
        
        {/* Left Section (Branding Panel) */}
        <div className="relative w-full md:w-[50%] p-12 flex flex-col justify-center overflow-hidden">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.55), rgba(79, 70, 229, 0.45))' }}></div>
            
            {/* Dot pattern decorative element */}
            <div className="absolute bottom-12 left-12 grid grid-cols-6 gap-3 opacity-15">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
              ))}
            </div>
            
            {/* Soft decorative circles */}
            <div className="absolute -top-32 -left-16 w-80 h-80 border-[0.5px] border-white/10 rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-40 -right-8 w-96 h-96 border-[0.5px] border-white/10 rounded-full pointer-events-none"></div>
          </div>
          
          <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
            <div className="absolute top-0 left-0">
               <Shield className="w-[48px] h-[48px] text-white" />
               <Eye className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]" />
            </div>
            
            <div className="flex flex-col items-center">
              <h1 className="text-[40px] font-bold text-white mb-3 tracking-tight drop-shadow-md">CivicEye</h1>
              <p className="text-white/85 text-[15px] font-medium leading-[1.6] max-w-[280px] drop-shadow-sm">
                Empowering citizens to report and resolve community infrastructure issues.
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Section (Login Panel) */}
        <div className="relative w-full md:w-[50%] p-10 md:p-16 flex flex-col justify-center bg-[#0a0716]/40">
          <div className="relative z-10 max-w-md mx-auto w-full flex flex-col justify-center h-full">
            <div className="mb-12">
              <h2 className="text-[32px] md:text-[36px] font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-white/70 text-[15px]">
                Sign in to continue to your dashboard.
              </p>
            </div>
            
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-[#1f1f1f] font-semibold py-[14px] px-[20px] rounded-[12px] transition-all shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.3)] mb-8"
            >
              <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <p className="text-white/50 text-[12px] leading-[1.5] text-center w-full px-4">
              By continuing, you agree to our Terms of Service and Privacy Policy. Secure and encrypted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
