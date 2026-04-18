import React from "react";
import { motion } from "framer-motion";

export const TopBar = ({ children }) => {
    return (
        <div className="flex justify-between items-center border-b border-[#1f2937] pb-3 h-full w-full">
            {children ? children : (
                <>
                    <h1 className="text-lg font-bold tracking-widest text-white">
                        RCR COMMAND CENTER
                    </h1>

                    <motion.div
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="text-red-500 text-sm font-semibold flex items-center gap-2"
                    >
                        <span className="w-2 h-2 rounded-full bg-red-600 shadow-neon-red"></span>
                        SYSTEM ACTIVE
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default TopBar;
