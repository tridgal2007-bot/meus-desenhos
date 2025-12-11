import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { VFXLayer } from './components/VFXLayer';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full">
      {/* Background Visual Effects (Rain, Lightning) */}
      <VFXLayer />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Hero />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;