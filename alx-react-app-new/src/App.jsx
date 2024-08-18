import React from 'react';
import WelcomeMessage from './components/WelcomeMessage'
import Header from './components/Header';
import MainContent from './components/MainContent';
import UserProfile from './components/UserProfile';
import Counter from './components/Counter'; // Import the Counter component
import Footer from './components/Footer';

import './App.css'

function App() {
  return (
    <>
      <div>
      <WelcomeMessage />
      <Header />
            <MainContent />
            <UserProfile 
                name="Sheja R. Kelly" 
                age="25" 
                bio="Love basketball and music"
            />
             <Counter /> {/* Include the Counter component */}
            <Footer />

        
      </div>
    </>
  );
}

export default App;
