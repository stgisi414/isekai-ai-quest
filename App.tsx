import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Builder from './pages/Builder';
import StoryView from './pages/StoryView';
import Dashboard from './pages/Dashboard';
import QuestLibrary from './pages/QuestLibrary';
import Layout from './components/Layout';
import { StoryProvider } from './context/StoryContext';
import { LearningProvider } from './context/LearningContext';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <LearningProvider>
          <StoryProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/builder" element={<Builder />} />
                <Route path="/story/:id" element={<StoryView />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/library" element={<QuestLibrary />} />
              </Route>
            </Routes>
          </StoryProvider>
        </LearningProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;