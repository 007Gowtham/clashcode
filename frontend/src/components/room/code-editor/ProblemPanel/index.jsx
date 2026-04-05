'use client';

import { useProblemPanel } from '@/contexts/ProblemPanelContext';
import { useState } from 'react';
import { ProblemContent } from './ProblemContent';
import { ProblemFooter } from './ProblemFooter';
import { ProblemHeader } from './ProblemHeader';

const ProblemPanel = () => {
    const { isCollapsed } = useProblemPanel();
    const [activeTab, setActiveTab] = useState('description');

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <ProblemHeader activeTab={activeTab} onTabChange={setActiveTab} />

            {!isCollapsed && (
                <>
                    {activeTab === 'description' ? (
                        <ProblemContent />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 font-sans italic">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon...
                        </div>
                    )}

                    <ProblemFooter />
                </>
            )}
        </div>
    );
};

export default ProblemPanel;
export { ProblemContent, ProblemFooter, ProblemHeader };

