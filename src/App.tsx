import SideNav from './components/SideNav';
import Hero from './components/Hero';
import About from './components/About';
import Portfolio from './components/Portfolio';
import Social from './components/Social';
import Footer from './components/Footer';
import { useScrollProgress } from './hooks';

export default function App() {
  useScrollProgress();
  return (
    <>
      <SideNav />
      <main>
        <Hero />
        <About />
        <Portfolio />
        <Social />
      </main>
      <Footer />
    </>
  );
}
