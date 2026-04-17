import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SwipeDispatch from "../components/SwipeDispatch";

const TacticalHUD = () => {
    const [count, setCount] = useState(0);
    const [threat, setThreat] = useState("LOW");

    // 🔁 Fake incidents counter
    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prev) => prev + Math.floor(Math.random() * 2));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // 🔁 Threat level changer
    useEffect(() => {
        const levels = ["LOW", "MEDIUM", "CRITICAL"];
        const interval = setInterval(() => {
            const random = levels[Math.floor(Math.random() * levels.length)];
            setThreat(random);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // 🚀 DISPATCH FUNCTION (FIXED)
    const handleDispatch = () => {
        console.log("🚀 Dispatch Triggered");

        const speech = new SpeechSynthesisUtterance("Emergency dispatch executed");
        speech.rate = 1;
        speech.pitch = 0.8;
        window.speechSynthesis.speak(speech);
    };

    const threatColor =
        threat === "CRITICAL"
            ? "text-red-500"
            : threat === "MEDIUM"
            ? "text-yellow-400"
            : "text-green-400";

    const threatBg =
        threat === "CRITICAL"
            ? "bg-red-500/20 border-red-500/40"
            : threat === "MEDIUM"
            ? "bg-yellow-400/20 border-yellow-400/40"
            : "bg-green-400/20 border-green-400/40";

    return (
        <div className="w-full min-h-screen bg-[#020617] text-white relative overflow-hidden flex flex-col items-center justify-center px-4">

            {/* SCANLINES */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_3px]" />

            {/* 🚨 THREAT ALERT */}
            <AnimatePresence>
                {threat === "CRITICAL" && (
                    <motion.div
                        initial={{ y: -80 }}
                        animate={{ y: 0 }}
                        exit={{ y: -80 }}
                        className="absolute top-0 left-0 w-full bg-red-600 text-center py-3 font-bold tracking-widest text-sm z-50"
                    >
                        🚨 CRITICAL THREAT DETECTED 🚨
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN GRID */}
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

                {/* LEFT PANEL */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-slate-900/40 border border-cyan-500/20 backdrop-blur-xl p-5 rounded-lg"
                >
                    <h3 className="text-xs text-cyan-400 mb-4 uppercase tracking-widest">
                        System Logs
                    </h3>

                    {["Node 1 Synced", "Node 2 Synced", "Node 3 Synced", "Node 4 Synced"].map((log, i) => (
                        <p key={i} className="text-xs text-green-400 mb-2">
                            ✔ {log}
                        </p>
                    ))}
                </motion.div>

                {/* CENTER RADAR */}
                <div className="relative flex items-center justify-center">

                    <div className="w-[260px] h-[260px] md:w-[400px] md:h-[400px] rounded-full border border-cyan-500/20 flex items-center justify-center">

                        {/* ROTATING SCAN */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            className="absolute w-full h-full"
                        >
                            <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-xl" />
                        </motion.div>

                        {/* RINGS */}
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="absolute rounded-full border border-cyan-500/10"
                                style={{
                                    width: `${i * 30}%`,
                                    height: `${i * 30}%`
                                }}
                            />
                        ))}

                        {/* CENTER PANEL */}
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl p-6 rounded-lg text-center"
                        >
                            <h1 className="text-lg md:text-xl font-bold text-cyan-400 tracking-widest">
                                TACTICAL HUD
                            </h1>

                            <div className="mt-4 text-[11px] font-mono space-y-2">
                                <div className="flex justify-between">
                                    <span>Incidents</span>
                                    <span className="text-red-400">{count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Latency</span>
                                    <span className="text-cyan-400">18ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status</span>
                                    <span className="text-green-400">OK</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Threat</span>
                                    <span className={`${threatColor} font-bold`}>
                                        {threat}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>

                {/* RIGHT PANEL */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`backdrop-blur-xl p-5 rounded-lg border ${threatBg}`}
                >
                    <h3 className="text-xs text-cyan-400 mb-4 uppercase tracking-widest">
                        Alerts Feed
                    </h3>

                    {["Fire detected", "Medical emergency", "Security breach"].map((alert, i) => (
                        <motion.p
                            key={i}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            className="text-xs text-red-400 mb-2"
                        >
                            ● {alert}
                        </motion.p>
                    ))}

                    <div className="mt-4 text-center text-xs font-bold uppercase">
                        Threat: <span className={threatColor}>{threat}</span>
                    </div>
                </motion.div>

            </div>

            {/* 🚀 SWIPE DISPATCH */}
            <SwipeDispatch onDispatch={handleDispatch} />

        </div>
    );
};

export default TacticalHUD;