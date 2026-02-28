import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import Header from './components/Header/Header';
import Home from './pages/Home/Home';
import Affidavit from './pages/Affidavit/Affidavit';
import AffidavitForm from './pages/AffidavitForm/AffidavitForm';
import './App.scss';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme} className="fluent-root">
      <Router>
        <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
          <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/affidavit" element={<Affidavit />} />
            <Route path="/affidavit/:formatId" element={<AffidavitForm isDarkMode={isDarkMode} />} />
          </Routes>
        </div>
      </Router>
    </FluentProvider>
  );
}

export default App;
