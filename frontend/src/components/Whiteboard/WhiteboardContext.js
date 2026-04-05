'use client';

import { createContext, useContext, useState } from 'react';

const WhiteboardContext = createContext(null);

export const WhiteboardProvider = ({ children, roomId, socket, isArchitect }) => {
  const [activeTool, setActiveTool] = useState('select'); // select, pen, circle, square, text
  const [options, setOptions] = useState({
    stroke: '#000000',
    strokeWidth: 2,
    fill: 'transparent'
  });

  return (
    <WhiteboardContext.Provider value={{
      roomId,
      socket,
      isArchitect,
      activeTool,
      setActiveTool,
      options,
      setOptions
    }}>
      {children}
    </WhiteboardContext.Provider>
  );
};

export const useWhiteboardContext = () => {
  const context = useContext(WhiteboardContext);
  if (!context) {
    throw new Error('useWhiteboardContext must be used within a WhiteboardProvider');
  }
  return context;
};
