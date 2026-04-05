'use client';

import { createContext, useContext, useState } from 'react';

const ChatPanelContext = createContext();

export const ChatPanelProvider = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [panelSize, setPanelSize] = useState(20);

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const newCollapsed = !prev;
            setPanelSize(newCollapsed ? 2 : 20);
            return newCollapsed;
        });
    };

    const expand = (size = 20) => {
        setIsCollapsed(false);
        setPanelSize(size);
    };

    return (
        <ChatPanelContext.Provider value={{
            isCollapsed,
            panelSize,
            toggleCollapse,
            expand,
            setIsCollapsed,
            setPanelSize,
        }}>
            {children}
        </ChatPanelContext.Provider>
    );
};

export const useChatPanel = () => {
    const context = useContext(ChatPanelContext);
    if (!context) {
        throw new Error('useChatPanel must be used within ChatPanelProvider');
    }
    return context;
};
