'use client';

import { motion } from 'framer-motion';

export const PageTransition = ({ children, className = "", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1], // Custom Ease for "slow" feel
            delay: delay
        }}
        className={className}
    >
        {children}
    </motion.div>
);

export const FadeIn = ({ children, className = "", delay = 0.2 }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay }}
        className={className}
    >
        {children}
    </motion.div>
);
