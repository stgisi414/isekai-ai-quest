import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Builder from './pages/Builder';
import StoryView from './pages/StoryView';
import { StoryProvider } from './context/StoryContext';

const App: React.FC = () => {
  return (
    <HashRouter>
      <StoryProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/story/:id" element={<StoryView />} />
        </Routes>
      </StoryProvider>
    </HashRouter>
  );
};

export default App;