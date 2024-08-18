import WelcomeMessage from './components/WelcomeMessage'
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import UserProfile from './components/UserProfile';
import './App.css'

function App() {
  return (
    <>
      <div>
      <WelcomeMessage />
      <Header />
            <MainContent />
            <Footer />
        <UserProfile 
                name="Sheja R. Kelly" 
                age="25" 
                bio="Love basketball and some music" 
            />
      </div>
    </>
  );
}

export default App
