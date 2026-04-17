import React, { useState } from "react";
import { motion, useMotionValue } from "framer-motion";

const SwipeDispatch = ({ onDispatch }) => {
    const [completed, setCompleted] = useState(false);

    // smooth motion tracking (no React re-render lag)
    const x = useMotionValue(0);

    const handleDragEnd = (event, info) => {
        const threshold = 150;

        if (info.offset.x > threshold) {
            setCompleted(true);

            if (onDispatch) {
                onDispatch();
            }

            // snap to end position
            x.set(200);
        } else {
            // reset back
            x.set(0);
        }
    };

    const resetDispatch = () => {
        setCompleted(false);
        x.set(0);
    };

    return (
        <div className="w-full max-w-md mx-auto mt-10">

            {/* TRACK */}
            <div className="relative h-14 bg-slate-800/50 border border-cyan-500/30 rounded-full overflow-hidden backdrop-blur shadow-lg">

                {/* SUCCESS STATE */}
                {completed && (
                    <div
                        onClick={resetDispatch}
                        className="absolute inset-0 bg-green-500/30 flex items-center justify-center text-green-300 text-xs font-bold tracking-widest cursor-pointer"
                    >
                        ✅ DISPATCHED (Tap to reset)
                    </div>
                )}

                {/* SLIDER */}
                {!completed && (
                    <motion.div
                        drag="x"
                        style={{ x }}
                        dragConstraints={{ left: 0, right: 200 }}
                        onDragEnd={handleDragEnd}
                        className="h-full w-14 bg-cyan-500 flex items-center justify-center text-black font-bold cursor-grab active:cursor-grabbing shadow-lg rounded-full"
                        whileTap={{ scale: 0.95 }}
                        whileDrag={{ scale: 1.1 }}
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