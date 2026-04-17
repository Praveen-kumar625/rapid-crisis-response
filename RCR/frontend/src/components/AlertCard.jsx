import React from "react";
import { motion } from "framer-motion";

export default function AlertCard() {
    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="p-4 rounded-lg border border-red-500 bg-[#111827] cursor-pointer"
        >

            <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-red-400 font-semibold mb-2"
            >
                🚨 EMERGENCY ALERT
            </motion.div>

            <p className="text-sm text-gray-300">
                Possible fire detected in Sector 7. Immediate response required.
            </p>

        </motion.div>
    );
}