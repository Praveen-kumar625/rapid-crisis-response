import React from "react";
import { motion } from "framer-motion";

export default function MapPanel() {
    return (
        <div className="h-[300px] bg-[#111827] rounded-lg border border-blue-500 flex items-center justify-center">

            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-blue-400"
            >
                📍 LIVE MAP (Coming Soon)
            </motion.div>

        </div>
    );
}