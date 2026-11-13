import { useEffect } from 'react';
import SideNav from './components/SideNav';
import Hero from './components/Hero';
import About from './components/About';
import Portfolio from './components/Portfolio';
import Contact from './components/Contact';
import Preloader from './components/Preloader';
import Cursor from './components/Cursor';
import { useScrollProgress, useSmoothScroll } from './hooks';
import { usePreloaderDone } from './preloader';

export default function App() {
  const ready = usePreloaderDone();
  useScrollProgress();
  useSmoothScroll(!ready); // khoá cuộn trong lúc màn hình mở đầu đang hiện

  // Trang chủ dùng chân trang "kéo rèm": nền ảnh chuyển vào khối .page, bỏ khoảng đệm dành cho thanh footer cố định
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('has-reveal');
    return () => root.classList.remove('has-reveal');
  }, []);

  return (
    <>
      <Preloader />
      <Cursor />
      <SideNav />
      {/* Khối .page che phủ chân trang cố định phía sau; cuộn tới cuối thì .page cuộn đi để lộ Contact */}
      <div className="page">
        <main>
          <Hero />
          <About />
          <Portfolio />
        </main>
      </div>
      <Contact />
    </>
  );
}
