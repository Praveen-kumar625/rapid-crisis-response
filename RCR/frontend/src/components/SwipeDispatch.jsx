import React, { useState } from "react";
import { motion } from "framer-motion";

const SwipeDispatch = ({ onDispatch }) => {
    const [dragX, setDragX] = useState(0);
    const [completed, setCompleted] = useState(false);

    const handleDragEnd = (event, info) => {
        // 👉 swipe threshold (important)
        if (info.offset.x > 150) {
            setCompleted(true);

            // 🔥 trigger dispatch action
            if (onDispatch) {
                onDispatch();
            }
        } else {
            setDragX(0);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-10">

            {/* TRACK */}
            <div className="relative h-14 bg-slate-800/50 border border-cyan-500/30 rounded-full overflow-hidden backdrop-blur">

                {/* SUCCESS BG */}
                {completed && (
                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center text-green-300 text-xs font-bold tracking-widest">
                        ✅ DISPATCHED
                    </div>
                )}

                {/* SLIDER */}
                {!completed && (
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 200 }}
                        onDragEnd={handleDragEnd}
                        onDrag={(e, info) => setDragX(info.point.x)}
                        className="h-full w-14 bg-cyan-500 flex items-center justify-center text-black font-bold cursor-grab active:cursor-grabbing shadow-lg"
                    >
                        ➤
                    </motion.div>
                )}

                {/* TEXT */}
                {!completed && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-cyan-400 uppercase tracking-widest pointer-events-none">
                        Swipe to Dispatch
                    </div>
                )}
            </div>

        </div>
    );
};

export default SwipeDispatch;