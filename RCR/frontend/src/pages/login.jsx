import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Shield, LogIn as LogInIcon } from 'lucide-react';
import { signInWithGoogle } from '../utils/firebase';
import toast from 'react-hot-toast';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    const toggleAuth = () => setIsLogin(!isLogin);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            toast.error("Auth failed. Check API keys.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#060B13] flex items-center justify-center p-4 font-sans overflow-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-5xl min-h-[600px] bg-[#0B121D] border border-cyan-500/20 flex flex-col md:flex-row shadow-[0_0_60px_rgba(6,182,212,0.1)] overflow-hidden z-10"
            >
                {/* DESKTOP ONLY: Sliding Overlay Panel */}
                <motion.div 
                    animate={{ x: isLogin ? '100%' : '0%' }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    className="hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-cyan-600 to-cyan-900 z-30 flex-col items-center justify-center text-white p-12 text-center"
                >
                    <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">
                        {isLogin ? "Welcome Back!" : "Stay Secured!"}
                    </h2>
                    <p className="text-cyan-100/70 text-xs mb-8 font-bold tracking-[0.2em] uppercase">
                        {isLogin ? "Access tactical dashboard" : "Establish operative credentials"}
                    </p>
                    <button onClick={toggleAuth} className="px-10 py-3 border-2 border-white/30 hover:border-white hover:bg-white hover:text-cyan-950 transition-all font-black uppercase text-[10px] tracking-[0.3em]">
                        {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                </motion.div>

                {/* LOGIN FORM - Static Positioned for Desktop, Toggleable for Mobile */}
                <div className={`w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 transition-opacity duration-300 ${!isLogin && 'hidden md:flex md:opacity-20 pointer-events-none'}`}>
                    <h3 className="text-3xl md:text-2xl font-black text-white mb-8 tracking-[0.2em] uppercase flex items-center gap-3">
                        <LogInIcon className="text-cyan-400" size={24} /> Login
                    </h3>
                    <div className="space-y-6 md:space-y-5">
                        <InputField icon={User} placeholder="OPERATIVE_ID" type="text" />
                        <InputField icon={Lock} placeholder="ACCESS_KEY" type="password" />
                        <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#060B13] py-5 md:py-4 font-black uppercase text-sm md:text-xs tracking-[0.2em] transition-all">
                            Initiate_Auth
                        </button>
                        <button 
                            onClick={handleGoogleLogin} 
                            className="w-full border border-slate-800 text-white py-4 flex items-center justify-center gap-3 text-[12px] md:text-[10px] uppercase font-bold tracking-widest bg-slate-900/40"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5 md:w-4 md:h-4" alt="G" />
                            {loading ? "..." : "Google Login"}
                        </button>
                    </div>
                    {/* Mobile Only: Sign Up link to match your image */}
                    <div className="md:hidden mt-10 text-center">
                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Need an account?</p>
                        <button onClick={toggleAuth} className="text-cyan-400 text-[12px] font-black tracking-widest uppercase underline mt-1">Sign Up</button>
                    </div>
                </div>

                {/* REGISTER FORM - Static Positioned for Desktop, Toggleable for Mobile */}
                <div className={`w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 transition-opacity duration-300 ${isLogin && 'hidden md:flex md:opacity-20 pointer-events-none'}`}>
                    <h3 className="text-3xl md:text-2xl font-black text-white mb-8 tracking-[0.2em] uppercase flex items-center gap-3">
                        <Shield className="text-cyan-400" size={24} /> Register
                    </h3>
                    <div className="space-y-5">
                        <InputField icon={User} placeholder="USERNAME" type="text" />
                        <InputField icon={Mail} placeholder="EMAIL" type="email" />
                        <InputField icon={Lock} placeholder="PASSWORD" type="password" />
                        <button className="w-full bg-slate-100 hover:bg-white text-slate-900 py-5 md:py-4 font-black uppercase text-sm md:text-xs tracking-[0.2em] transition-all">
                            Establish_Operative
                        </button>
                    </div>
                    {/* Mobile Only: Sign In link */}
                    <div className="md:hidden mt-10 text-center">
                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Already registered?</p>
                        <button onClick={toggleAuth} className="text-cyan-400 text-[12px] font-black tracking-widest uppercase underline mt-1">Sign In</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const InputField = ({ icon: Icon, ...props }) => (
    <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
        <input {...props} className="w-full bg-slate-900/60 border border-slate-800 focus:border-cyan-500/50 outline-none py-5 md:py-4 pl-14 md:pl-12 pr-4 text-white text-sm font-mono rounded-none" />
    </div>
);

export default Login;