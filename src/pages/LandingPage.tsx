import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Facebook, Instagram } from 'lucide-react';

export default function LandingPage() {
  const [text, setText] = useState('');
  const fullText = 'Sua jornada global começa aqui...';
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const period = 2000;
  const [delta, setDelta] = useState(100);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ticker = setInterval(() => {
      tick();
    }, delta);

    return () => clearInterval(ticker);
  }, [text, delta]);

  const tick = () => {
    let updatedText = isDeleting 
      ? fullText.substring(0, text.length - 1)
      : fullText.substring(0, text.length + 1);

    setText(updatedText);

    if (isDeleting) {
      setDelta(prevDelta => prevDelta / 2);
    }

    if (!isDeleting && updatedText === fullText) {
      setIsDeleting(true);
      setDelta(period);
    } else if (isDeleting && updatedText === '') {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
      setDelta(100);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <div className="flex items-center">
              <img src="/logo.svg" alt="Logo" className="h-8" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-white hover:text-gray-300">
                INÍCIO
              </Link>
              <Link to="/premiacoes" className="text-white hover:text-gray-300">
                PREMIAÇÕES
              </Link>
              <a 
                href="https://admin.rewardsmidia.online/login" 
                className="text-white hover:text-gray-300"
              >
                LOGIN
              </a>
              <Link
                to="/register"
                className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-100"
              >
                Comece a vender
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-white hover:text-gray-300"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0A0A0A] z-50">
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex justify-between items-center p-6">
              <img src="/logo.svg" alt="Logo" className="h-8" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Menu Links */}
            <nav className="flex-1 flex flex-col p-6 space-y-6">
              <Link 
                to="/" 
                className="text-white text-lg font-medium hover:text-gray-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                INÍCIO
              </Link>
              <Link 
                to="/premiacoes" 
                className="text-white text-lg font-medium hover:text-gray-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                PREMIAÇÕES
              </Link>
              <a 
                href="https://admin.rewardsmidia.online/login" 
                className="text-white text-lg font-medium hover:text-gray-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                LOGIN
              </a>
              <Link
                to="/register"
                className="bg-white text-black px-6 py-3 rounded-full font-medium text-center hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Comece a vender
              </Link>
            </nav>

            {/* Social Links */}
            <div className="p-6 flex justify-center space-x-6">
              <a 
                href="#" 
                className="text-white hover:text-gray-300"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="#" 
                className="text-white hover:text-gray-300"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-8 min-h-[3.5rem]">
            {text}<span className="text-blue-400 animate-pulse">|</span>
          </h1>
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Vendas internacionais ao alcance de um clique!
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Obtenha todas as vantagens de uma plataforma nacional e internacional de infoprodutos. 
            Cursos, Comunidades, Softwares, Grupos, Assinaturas e Mentorias.
          </p>
          <Link
            to="/register"
            className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-full font-medium text-lg hover:opacity-90"
          >
            CRIAR CONTA AGORA
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-8">
              Maximize Seus Ganhos,{' '}
              <span className="text-cyan-400">Tecnologia que Gera Resultados</span>
            </h2>
          </div>

          {/* Revenue Scale */}
          <div className="mb-20">
            <div className="h-2 bg-gradient-to-r from-gray-800 to-cyan-500 rounded-full">
              <div className="relative">
                {['10K', '100K', '500K', '1M', '5M', '10M'].map((value, index) => (
                  <div
                    key={value}
                    className="absolute transform -translate-x-1/2"
                    style={{ left: `${(index * 100) / 5}%`, top: '1rem' }}
                  >
                    <div className="w-1 h-3 bg-gray-600 mb-2"></div>
                    <span className="text-sm text-gray-400">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-gray-400 mt-12">
              ACOMPANHE SEU FATURAMENTO EM TEMPO REAL
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}