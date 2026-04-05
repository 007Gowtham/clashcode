'use client';

import { useResultsPanel } from '@/contexts/ResultsPanelContext';
import { useEffect, useRef, useState } from 'react';
import { ResultsContent } from './ResultsContent';
import { ResultsHeader } from './ResultsHeader';

const ResultsPanel = () => {
    const { isCollapsed } = useResultsPanel();
    const [activeView, setActiveView] = useState('testcase');
    const [headerHeight, setHeaderHeight] = useState(0);
    const headerRef = useRef(null);

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    return (
        <div
            className="flex flex-col overflow-hidden  bg-white h-full transition-all duration-300 ease-in-out"
        >
            <div ref={headerRef}>
                <ResultsHeader
                    activeView={activeView}
                    onViewChange={setActiveView}
                />
            </div>

            {!isCollapsed && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <ResultsContent activeView={activeView} />
                </div>
            )}
        </div>
    );
};

export default ResultsPanel;
export { ResultsContent, ResultsHeader };
