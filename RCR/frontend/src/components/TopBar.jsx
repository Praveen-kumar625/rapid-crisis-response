import React from "react";
import { motion } from "framer-motion";

export default function TopBar() {
    return (
        <div className="flex justify-between items-center border-b border-[#1f2937] pb-3">

            <h1 className="text-lg font-bold tracking-widest">
                RCR COMMAND CENTER
            </h1>

            <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-red-500 text-sm font-semibold"
            >
                ● SYSTEM ACTIVE
            </motion.div>

        </div>
    );
}