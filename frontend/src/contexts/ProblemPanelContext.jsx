'use client';

import { createContext, useContext, useState } from 'react';

const ProblemPanelContext = createContext();



export const ProblemPanelProvider = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [panelSize, setPanelSize] = useState(25);

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const newCollapsed = !prev;
            setPanelSize(newCollapsed ? 2 : 25);
            return newCollapsed;
        });
    };

    const expand = (size=25) => {
        setIsCollapsed(false);
        setPanelSize(size);
    };

    return (
        <ProblemPanelContext.Provider value={{
            isCollapsed,
            panelSize,
            toggleCollapse,
            expand,
            setIsCollapsed,
            setPanelSize,
          
        }}>
            {children}
        </ProblemPanelContext.Provider>
    );
};

export const useProblemPanel = () => {
    const context = useContext(ProblemPanelContext);
    if (!context) {
        throw new Error('useProblemPanel must be used within ProblemPanelProvider');
    }
    return context;
};
