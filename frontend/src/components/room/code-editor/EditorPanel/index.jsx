'use client';

import { EditorFooter } from './EditorFooter';
import { EditorHeader } from './EditorHeader';
import { EditorToolbar } from './EditorToolbar';

const EditorPanel = () => {
    return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
         
            <EditorToolbar />

            {/* Code Editor Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                <div className="flex-1 flex items-center justify-center bg-white text-gray-300 font-mono text-sm border-dashed border-2 border-gray-50 m-4 rounded-xl">
                    <div>{`// Monaco Editor Core will be initialized here`}</div>
                </div>
            </div>

            <EditorFooter />
        </div>
    );
};

export default EditorPanel;
export { EditorFooter, EditorHeader, EditorToolbar };

