import React, { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const Signup = () => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(form);

        toast.success("User Registered (Demo)");
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">

            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/60 border border-cyan-500/20 backdrop-blur-xl p-10 rounded-xl w-[350px]"
            >
                <h1 className="text-2xl font-bold text-cyan-400 tracking-widest text-center">
                    CREATE ACCOUNT
                </h1>

                <div className="mt-6 space-y-4">

                    <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full bg-transparent border border-white/10 px-4 py-2 text-sm outline-none focus:border-cyan-400"
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full bg-transparent border border-white/10 px-4 py-2 text-sm outline-none focus:border-cyan-400"
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full bg-transparent border border-white/10 px-4 py-2 text-sm outline-none focus:border-cyan-400"
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />

                    <button
                        type="submit"
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 font-bold uppercase tracking-widest"
                    >
                        Register
                    </button>

                </div>

                <p className="text-[10px] text-slate-500 text-center mt-4">
                    Secure Node Registration
                </p>
            </motion.form>
        </div>
    );
};

export default Signup;