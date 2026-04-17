import React, { useState } from "react";
import { motion } from "framer-motion";
import { auth, provider } from "../utils/firebase";
import { signInWithPopup } from "firebase/auth";
import toast from "react-hot-toast";

const Login = () => {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await signInWithPopup(auth, provider);
            toast.success("Access Granted 🚀");
        } catch (err) {
            console.error(err);
            toast.error("Authentication Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">

            {/* Glow Background */}
            <div className="absolute w-[400px] h-[400px] bg-cyan-500/20 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 p-10 rounded-xl w-[350px]"
            >
                <h1 className="text-2xl font-bold text-cyan-400 tracking-widest text-center">
                    SECURE LOGIN
                </h1>

                <p className="text-xs text-slate-400 text-center mt-2">
                    Tactical Access Required
                </p>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="mt-6 w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded font-bold uppercase tracking-widest transition"
                >
                    {loading ? "Authorizing..." : "Login with Google"}
                </button>

                <p className="text-[10px] text-center text-slate-500 mt-4">
                    RCR Secure Gateway v1.0
                </p>
            </motion.div>
        </div>
    );
};

export default Login;