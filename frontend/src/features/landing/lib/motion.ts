export const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export const fadeIn = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
};

export const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
