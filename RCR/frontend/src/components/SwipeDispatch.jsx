import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

const SwipeDispatch = ({ onDispatch, label = "Swipe to Dispatch" }) => {
    const [status, setStatus] = useState('idle'); // 'idle', 'dispatching', 'retrying', 'success', 'failed'
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // smooth motion tracking
    const x = useMotionValue(0);
    
    // Calculate progress based on drag distance
    const sliderWidth = 56; // w-14
    const maxDrag = containerWidth > 0 ? containerWidth - sliderWidth - 8 : 200;
    const progress = useTransform(x, [0, maxDrag], [0, 1]);
    const textOpacity = useTransform(progress, [0, 0.8], [1, 0]);

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

    const handleDragEnd = async (_event, _info) => {
        const threshold = maxDrag * 0.8;

        if (x.get() > threshold) {
            setStatus('dispatching');
            x.set(maxDrag);
            
            const performDispatch = async (retryCount = 0) => {
                try {
                    if (onDispatch) await onDispatch();
                    setStatus('success');
                } catch (err) {
                    console.warn(`Dispatch attempt ${retryCount + 1} failed:`, err.message);
                    if (retryCount < 3) {
                        setStatus('retrying');
                        // Exponential backoff: 1s, 2s, 4s
                        const delay = Math.pow(2, retryCount) * 1000;
                        await new Promise(res => setTimeout(res, delay));
                        return performDispatch(retryCount + 1);
                    } else {
                        setStatus('failed');
                    }
                }
            };

            await performDispatch();
        } else {
            x.set(0);
        }
    };

    const resetDispatch = () => {
        setStatus('idle');
        x.set(0);
    };

    const isProcessing = status === 'dispatching' || status === 'retrying';
    const isCompleted = status === 'success' || status === 'failed' || isProcessing;

    return (
        <div className="w-full max-w-md mx-auto mt-10 px-4">
            {/* TRACK */}
            <div 
                ref={containerRef}
                className={`relative h-14 bg-slate-900/80 border rounded-full overflow-hidden backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] p-1 transition-colors duration-300 ${
                    status === 'failed' ? 'border-red-500/50' : 'border-cyan-500/30'
                }`}
            >
                {/* STATUS OVERLAY */}
                {isCompleted && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={!isProcessing ? resetDispatch : undefined}
                        className={`absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] z-20 ${
                            status === 'success' ? 'bg-emerald-500/20 text-emerald-400 cursor-pointer' :
                            status === 'failed' ? 'bg-red-500/20 text-red-400 cursor-pointer' :
                            'bg-amber-500/20 text-amber-400'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                status === 'success' ? 'bg-emerald-500 animate-ping' :
                                status === 'failed' ? 'bg-red-500' :
                                'bg-amber-500 animate-pulse'
                            }`} />
                            {status === 'success' && 'Tactical_Dispatch_Executed'}
                            {status === 'failed' && 'Dispatch_Failed'}
                            {status === 'dispatching' && 'Dispatching...'}
                            {status === 'retrying' && 'Retrying...'}
                        </span>
                    </motion.div>
                )}

                {/* PROGRESS FILL */}
                <motion.div 
                    style={{ width: x, opacity: isCompleted ? 0 : 0.2 }}
                    className="absolute inset-y-0 left-0 bg-cyan-500 rounded-l-full pointer-events-none"
                />

                {/* SLIDER */}
                {!isCompleted && (
                    <motion.div
                        drag="x"
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
                {!isCompleted && (
                    <motion.div 
                        style={{ opacity: textOpacity }}
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