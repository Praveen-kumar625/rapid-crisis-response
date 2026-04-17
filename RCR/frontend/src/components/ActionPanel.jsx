import React from "react";
import { motion } from "framer-motion";

export default function ActionPanel() {
    return (
        <div className="mt-6 flex justify-center">

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-red-600 rounded-full font-semibold shadow-lg hover:bg-red-700 transition"
            >
                Dispatch Emergency Unit
            </motion.button>

        </div>
    );
}