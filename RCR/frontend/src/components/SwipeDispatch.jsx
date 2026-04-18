import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

const SwipeDispatch = ({ onDispatch, label = "Swipe to Dispatch" }) => {
    const [completed, setCompleted] = useState(false);
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // smooth motion tracking
    const x = useMotionValue(0);
    
    // Calculate opacity and scale based on progress
    const sliderWidth = 56; // w-14
    const maxDrag = containerWidth > 0 ? containerWidth - sliderWidth - 8 : 200;
    const progress = useTransform(x, [0, maxDrag], [0, 1]);
    const opacity = useTransform(progress, [0, 0.8], [1, 0]);
    const successOpacity = useTransform(progress, [0.8, 1], [0, 1]);

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }
        
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDragEnd = (event, info) => {
        const threshold = maxDrag * 0.8;

        if (x.get() > threshold) {
            setCompleted(true);
            if (onDispatch) onDispatch();
            x.set(maxDrag);
        } else {
            x.set(0);
        }
    };

    const resetDispatch = () => {
        setCompleted(false);
        x.set(0);
    };

    return (
        <div className="w-full max-w-md mx-auto mt-10 px-4">
            {/* TRACK */}
            <div 
                ref={containerRef}
                className="relative h-14 bg-slate-900/80 border border-cyan-500/30 rounded-full overflow-hidden backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] p-1"
            >
                {/* SUCCESS STATE */}
                {completed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={resetDispatch}
                        className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer z-20"
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            Tactical_Dispatch_Executed
                        </span>
                    </motion.div>
                )}

                {/* PROGRESS FILL */}
                <motion.div 
                    style={{ width: x, opacity: completed ? 0 : 0.2 }}
                    className="absolute inset-y-0 left-0 bg-cyan-500 rounded-l-full pointer-events-none"
                />

                {/* SLIDER */}
                {!completed && (
                    <motion.div
                        drag="x"
                        _dragX={x}
                        style={{ x }}
                        dragConstraints={{ left: 0, right: maxDrag }}
                        dragElastic={0.05}
                        dragMomentum={false}
                        onDragEnd={handleDragEnd}
                        className="absolute left-1 top-1 h-12 w-12 bg-cyan-500 flex items-center justify-center text-navy-950 shadow-[0_0_15px_rgba(34,211,238,0.4)] rounded-full z-30 cursor-grab active:cursor-grabbing"
                        whileTap={{ scale: 0.9 }}
                    >
                        <span className="text-xl font-black italic">➤</span>
                    </motion.div>
                )}

                {/* TEXT */}
                {!completed && (
                    <motion.div 
                        style={{ opacity }}
                        className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.3em] pointer-events-none italic"
                    >
                        {label}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SwipeDispatch;