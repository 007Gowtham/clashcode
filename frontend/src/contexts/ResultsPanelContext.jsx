'use client';

import { createContext, useContext, useState } from 'react';

const ResultsPanelContext = createContext();

export const ResultsPanelProvider = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [panelSize, setPanelSize] = useState(35);

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const newCollapsed = !prev;
            setPanelSize(newCollapsed ? 6 : 35);
            return newCollapsed;
        });
    };

    const expand = () => {
        setIsCollapsed(false);
        setPanelSize(35);
    };

    return (
        <ResultsPanelContext.Provider value={{
            isCollapsed,
            panelSize,
            toggleCollapse,
            expand,
            setIsCollapsed,
            setPanelSize
        }}>
            {children}
        </ResultsPanelContext.Provider>
    );
};

export const useResultsPanel = () => {
    const context = useContext(ResultsPanelContext);
    if (!context) {
        throw new Error('useResultsPanel must be used within ResultsPanelProvider');
    }
    return context;
};
