import React, { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    // Mobile states
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Guide states
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [guideStep, setGuideStep] = useState(0);

    // Desktop states
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);
    const openCommandPalette = () => setIsCommandPaletteOpen(true);
    const closeCommandPalette = () => setIsCommandPaletteOpen(false);
    const toggleCommandPalette = () => setIsCommandPaletteOpen(!isCommandPaletteOpen);

    const openGuide = () => {
        setGuideStep(0);
        setIsGuideOpen(true);
    };
    const closeGuide = () => setIsGuideOpen(false);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleCommandPalette();
            }
            if (e.key === 'Escape') {
                closeCommandPalette();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen]);

    const value = {
        // Mobile
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        // Guide
        isGuideOpen,
        openGuide,
        closeGuide,
        guideStep,
        setGuideStep,
        // Desktop
        isSidebarExpanded,
        toggleSidebar,
        isCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        toggleCommandPalette
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
