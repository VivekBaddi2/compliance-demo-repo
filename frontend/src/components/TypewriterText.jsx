import React from 'react';
import { motion } from 'framer-motion';

function TypewriterText({ text, duration = 2, delay = 0 }) {
    // Calculate the time needed for the transition based on the text length
    const typewriterDuration = text.length * 0.1 + duration; // Adjust 0.05 for speed

    return (
        <motion.div
            // 1. Initial State: Width is 0 (hides the text)
            initial={{ width: 0 }}

            // 2. Animation Target: Animate width to 'fit-content' (reveals the text)
            animate={{ width: "100%" }}

            // 3. Transition: Defines the duration, easing, and delay
            transition={{
                duration: typewriterDuration, // Total duration of the width animation
                delay: delay, // Start delay before the animation begins
                ease: "linear",
                duration: 3, // Blink speed
                delay: typewriterDuration + delay, // Start blinking AFTER the typing is finished
            }}

            // Optional: Add a subtle blinking cursor effect
            // Keyframes for the borderRight property
            whileInView={{ borderRight: ["2px solid rgba(255, 255, 255, 0.75)", "2px solid rgba(255, 255, 255, 0)"] }}
            viewport={{ once: true }} // Ensures animation only runs once when in view


            // Styling to make the typewriter effect work
            style={{
                whiteSpace: "nowrap", // Keep all text on one line
                overflow: "hidden", // Crucial: clips the text that is outside the width
                // If you're not using the cursor animation, you might not need this style prop.
            }}
        >
            {text}
        </motion.div>
    );
}

export default TypewriterText;