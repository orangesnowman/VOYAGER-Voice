import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Pause, Play, Store, IdCard, ShoppingCart } from 'lucide-react';
import { parseAndRenderEmojis } from './VoyagerEmoji';

interface ShoppingPanelProps {
  selectedLang: 'EN' | 'ES';
  userPlan: 'FREE' | 'PRO';
  chatMessages: any[];
  isPaused: boolean;
  isConnected: boolean;
  pause: () => void;
  resume: () => void;
  onUpgradeSuccess: () => void;
  onAskVoyager: (text: string) => void;
  sendText: (text: string) => void;
}

export const ShoppingPanel: React.FC<ShoppingPanelProps> = ({
  selectedLang,
  userPlan,
  chatMessages,
  isPaused,
  isConnected,
  pause,
  resume,
  onUpgradeSuccess,
  onAskVoyager,
  sendText
}) => {
  const [headerTitle, setHeaderTitle] = useState(
    selectedLang === 'EN' ? 'VOYAGER - student' : 'VOYAGER - estudiante'
  );
  const [activeTab, setActiveTab] = useState<'shop' | 'account' | 'cart'>('shop');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Synchronize active navigation tab with window hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('/cart')) {
        setActiveTab('cart');
      } else if (hash.includes('/account') || hash.includes('/settings')) {
        setActiveTab('account');
      } else {
        setActiveTab('shop');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on mount

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Auto scroll to latest chat messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Load Ecwid storefront widget dynamically
  useEffect(() => {
    let script = document.getElementById('ecwid-script') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'ecwid-script';
      script.src = 'https://app.ecwid.com/script.js?108143&data_platform=code';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      document.body.appendChild(script);
    }

    const initStore = () => {
      const win = window as any;
      if (win.xProductBrowser) {
        win.xProductBrowser(
          "categoriesPerRow=2",
          "views=grid(20,2) list(60) table(60)",
          "categoryView=grid",
          "searchView=list",
          "defaultCategoryId=204126005",
          "id=my-store-108143"
        );
      }
      if (win.xMinicart) {
        win.xMinicart("style=", "layout=Mini");
      }
    };

    if (script.getAttribute('data-loaded') === 'true') {
      initStore();
    } else {
      script.onload = () => {
        script.setAttribute('data-loaded', 'true');
        initStore();
      };
    }

    // Run DOM sweep to hide native headers, sorting and breadcrumbs
    const sweep = () => {
      const elements = document.querySelectorAll(
        '.ec-breadcrumbs, .ec-store__category-name, .grid-product__sorting, .ec-store__sorting, [class*="sort-by"]'
      );
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.display !== 'none') {
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
        }
      });
    };
    const interval = setInterval(sweep, 500);

    return () => {
      clearInterval(interval);
      const container = document.getElementById('my-store-108143');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  // Listen to Ecwid page loads to update top category header title
  useEffect(() => {
    const handlePageLoad = (page: any) => {
      if (page.type === 'CATEGORY' && page.name) {
        setHeaderTitle(page.name);
      } else if (page.type === 'PRODUCT') {
        // Maintain category title state, don't let product title override it!
      } else if (page.type === 'CART') {
        setHeaderTitle(selectedLang === 'EN' ? 'MY CART' : 'MI CARRITO');
      } else {
        setHeaderTitle(selectedLang === 'EN' ? 'VOYAGER - student' : 'VOYAGER - estudiante');
      }
    };

    const win = window as any;
    if (win.Ecwid && win.Ecwid.OnPageLoaded) {
      win.Ecwid.OnPageLoaded.add(handlePageLoad);
    } else {
      // Poll until Ecwid becomes available to register listener
      const checkEcwid = setInterval(() => {
        if (win.Ecwid && win.Ecwid.OnPageLoaded) {
          win.Ecwid.OnPageLoaded.add(handlePageLoad);
          clearInterval(checkEcwid);
        }
      }, 500);
      return () => clearInterval(checkEcwid);
    }

    return () => {
      if (win.Ecwid && win.Ecwid.OnPageLoaded) {
        win.Ecwid.OnPageLoaded.remove(handlePageLoad);
      }
    };
  }, [selectedLang]);

  // Navigate within the store programmatically
  const navigateToEcwid = (destination: 'shop' | 'account' | 'cart') => {
    const win = window as any;
    if (win.Ecwid && win.Ecwid.openPage) {
      if (destination === 'shop') win.Ecwid.openPage('category', { id: 0 });
      else if (destination === 'account') win.Ecwid.openPage('accountSettings');
      else if (destination === 'cart') win.Ecwid.openPage('cart');
    } else {
      if (destination === 'shop') window.location.hash = '#!/~/category=0';
      else if (destination === 'account') window.location.hash = '#!/~/accountSettings';
      else if (destination === 'cart') window.location.hash = '#!/~/cart';
    }
  };

  // Nav click handler triggering Voyager voice prompts
  const handleNavClick = (dest: 'shop' | 'account' | 'cart') => {
    navigateToEcwid(dest);

    let speech = "";
    if (dest === 'shop') {
      speech = selectedLang === 'EN' 
        ? "Sure, showing you our English programs in the store!" 
        : "¡Entendido! Te muestro nuestra tienda con los programas de inglés.";
    } else if (dest === 'account') {
      speech = selectedLang === 'EN' 
        ? "Here you can review your purchase details and settings." 
        : "Perfecto, aquí puedes revisar los detalles de tus compras y suscripciones.";
    } else if (dest === 'cart') {
      speech = selectedLang === 'EN' 
        ? "Opening your shopping cart. Let me know if you need help with payment!" 
        : "Abriendo tu carrito. Avísame si tienes alguna duda con el pago.";
    }

    if (isConnected) {
      sendText(`[SYSTEM INSTRUCTION: Speak aloud the following brief message in your natural voice. Do not write any text, just speak it: "${speech}"]`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#d4d4d4] h-full overflow-hidden animate-fade-in font-sans text-[#231d17]">
      {/* Target custom circular count badge overrides */}
      <style>{`
        .ec-cart-widget [class*="counter"], 
        .ec-cart-widget span[class*="count"],
        .ecwid-minicart-count {
          background: #0066cc !important;
          color: #ffffff !important;
          border-radius: 9999px !important;
          min-width: 18px !important;
          height: 18px !important;
          line-height: 18px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: bold !important;
          border: none !important;
          font-size: 10px !important;
          padding: 0 4px !important;
        }
        .ec-cart-widget {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        .ec-breadcrumbs,
        .ec-store__category-name,
        .grid-product__sorting,
        .ec-store__sorting,
        [class*="sort-by"],
        .ec-cart-widget__title,
        .ec-cart-widget__text,
        .ec-cart-widget__price,
        .ec-cart-widget__icon,
        .ecwid-minicart-label,
        .ecwid-minicart-caption,
        .ecwid-minicart-icon,
        .ecwid-minicart-link span:not(.ecwid-minicart-count),
        .ec-cart-widget span:not([class*="count"]):not([class*="counter"]) {
          display: none !important;
          visibility: hidden !important;
        }
      `}</style>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4 flex flex-col gap-3 min-h-0">
        
        {/* THE MAIN WELCOME STATEMENT CARD */}
        <div className="bg-white border-[5px] border-red-600/30 rounded-2xl rounded-tl-none p-4 shadow-sm space-y-3.5 text-left flex flex-col flex-shrink-0">
          
          {/* Header & Navigation Row */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 select-none">
              <Bot className="w-9 h-9 text-red-600 flex-shrink-0" />
              <h2 
                style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} 
                className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1a202c]"
              >
                {selectedLang === 'EN' ? 'VOYAGER- student' : 'VOYAGER- estudiante'}
              </h2>
            </div>

            <div className="flex items-center gap-5 text-[10.5px] font-extrabold uppercase tracking-wider select-none mt-1">
              <button 
                onClick={() => handleNavClick('shop')} 
                className={`flex items-center gap-1.5 transition-colors uppercase cursor-pointer bg-transparent border-none p-0 ${
                  activeTab === 'shop' ? 'text-black font-black' : 'text-neutral-400 hover:text-red-600'
                }`}
              >
                <Store className={`w-4 h-4 ${activeTab === 'shop' ? 'text-red-600' : 'text-neutral-400'}`} />
                <span>{selectedLang === 'EN' ? 'STORE' : 'TIENDA'}</span>
              </button>

              <button 
                onClick={() => handleNavClick('account')} 
                className={`flex items-center gap-1.5 transition-colors uppercase cursor-pointer bg-transparent border-none p-0 ${
                  activeTab === 'account' ? 'text-black font-black' : 'text-neutral-400 hover:text-red-600'
                }`}
              >
                <IdCard className={`w-4.5 h-4.5 ${activeTab === 'account' ? 'text-red-600' : 'text-neutral-400'}`} />
                <span>{selectedLang === 'EN' ? 'MY ACCOUNT' : 'MI CUENTA'}</span>
              </button>

              <button 
                onClick={() => handleNavClick('cart')} 
                className={`flex items-center gap-1.5 transition-colors uppercase cursor-pointer bg-transparent border-none p-0 ${
                  activeTab === 'cart' ? 'text-black font-black' : 'text-neutral-400 hover:text-red-600'
                }`}
              >
                <div className="ec-cart-widget inline-block align-middle scale-90" />
                <ShoppingCart className={`w-4 h-4 ${activeTab === 'cart' ? 'text-red-600' : 'text-neutral-400'}`} />
                <span>{selectedLang === 'EN' ? 'MY CART' : 'MI CARRITO'}</span>
              </button>
            </div>
          </div>

          {/* Welcome Text Paragraph recreated exactly from the reference image */}
          {activeTab === 'shop' && (
            <p 
              style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} 
              className="text-[11pt] text-left text-neutral-800 leading-relaxed font-serif pt-1 border-t border-neutral-100"
            >
              {selectedLang === 'EN' 
                ? "Hello! I am USA Voyager, your expert sales advisor and store guide. In this section we are not in class: my job is to guide you in choosing the best products, workbooks, study materials, official merchandise, and coaching packages with La Profe to boost your mastery of American English and US culture."
                : "¡Hola! Soy USA Voyager, tu asesor de ventas experto y guía de la tienda. En esta sección no estamos en clase: mi trabajo es orientarte para elegir los mejores productos, libros de trabajo, materiales de estudio, mercancía oficial y paquetes de coaching con La Profe para potenciar tu dominio del inglés americano y la cultura de EE. UU."
              }
            </p>
          )}

        </div>

        {chatMessages.filter(msg => {
          if (msg.sender === 'system') return false;
          if (msg.sender === 'user' && msg.text.startsWith('[')) return false;
          return msg.tab === 'shopping';
        }).map((msg, index) => {
          let displayTxt = msg.text || '';
          if (displayTxt.includes('SYSTEM INSTRUCTION:')) {
            const match = displayTxt.match(/Question:\s*"(.*)"/i);
            if (match && match[1]) {
              displayTxt = match[1];
            } else {
              displayTxt = displayTxt.replace(/\[SYSTEM INSTRUCTION:.*Question:\s*"/i, '').replace(/"\]$/, '');
            }
          }
          
          const isUser = msg.sender === 'user';
          
          return (
            <div 
              key={msg.id || index} 
              className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} gap-2.5 animate-fade-in flex-shrink-0 w-full`}
            >
              <div className={`max-w-[88%] flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`
                  px-4 py-2.5 rounded-2xl text-sm leading-snug transition-all bg-white border-[5px]
                  ${isUser 
                    ? 'border-blue-600/30 text-black rounded-tr-none' 
                    : 'border-red-600/30 text-black rounded-tl-none font-serif'
                  }
                `}>
                  {isUser ? (
                    <div className="flex items-center justify-end gap-2.5 mb-1.5 select-none">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isConnected) return;
                          if (isPaused) {
                            resume();
                            if (window.speechSynthesis && window.speechSynthesis.paused) {
                              window.speechSynthesis.resume();
                            }
                          } else {
                            pause();
                            if (window.speechSynthesis && window.speechSynthesis.speaking) {
                              window.speechSynthesis.pause();
                            }
                          }
                        }}
                        disabled={!isConnected}
                        className={`flex items-center gap-1 group cursor-pointer transition-all duration-300 ${
                          !isConnected ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                        }`}
                      >
                        {!isPaused && (
                          <span 
                            style={{ fontFamily: "'Lato', sans-serif" }} 
                            className="text-[9px] font-black tracking-wider transition-all duration-300 text-blue-600/70 group-hover:text-red-600"
                          >
                            {selectedLang === 'EN' ? 'PAUSE' : 'PAUSA'}
                          </span>
                        )}
                        {isPaused ? (
                          <Play fill="currentColor" stroke="none" className="w-3.5 h-3.5 text-red-600 transition-all animate-pulse" />
                        ) : (
                          <Pause fill="currentColor" stroke="none" className="w-3.5 h-3.5 text-blue-600/70 group-hover:text-red-600 transition-all duration-300" />
                        )}
                      </button>
                      <User strokeWidth={2.5} className="w-5 h-5 text-blue-600/70" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2 select-none">
                      <Bot strokeWidth={2.5} className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div className={`chat-message-text whitespace-pre-line tracking-wider leading-snug ${isUser ? 'text-right font-normal' : 'text-left'}`}>
                    {(() => {
                      if (!isUser && displayTxt.includes(" / ")) {
                        const parts = displayTxt.split(" / ");
                        if (parts.length >= 2) {
                          return (
                            <>
                              <div style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-black font-semibold leading-snug">{parseAndRenderEmojis(parts[0])}</div>
                              <div style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="chat-message-english text-black leading-snug mt-2">
                                {parseAndRenderEmojis(parts.slice(1).join(" / "))}
                              </div>
                            </>
                          );
                        }
                      }
                      return <div style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-black leading-snug">{parseAndRenderEmojis(displayTxt)}</div>;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* THE ECWID STOREFRONT CATALOG CARD (Always at the bottom under the last chat bubble) */}
        <div className="bg-white border-[5px] border-red-600/30 rounded-2xl rounded-tl-none p-4 shadow-sm text-left flex flex-col flex-shrink-0">
          <div className="min-h-[260px]">
            <div id="my-store-108143" className="w-full" />
          </div>
        </div>

        <div ref={chatEndRef} />
      </div>

      {/* Row 2: User's Input Box */}
      <div className="flex-shrink-0 px-3 pt-3 pb-6 md:pb-8 bg-[#d4d4d4] flex justify-end w-full">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const inputEl = e.currentTarget.elements.namedItem('shopQuestion') as HTMLInputElement;
            if (inputEl && inputEl.value.trim()) {
              onAskVoyager(inputEl.value.trim());
              inputEl.value = '';
            }
          }}
          className="w-full max-w-[88%] relative rounded-2xl rounded-tr-none transition-all bg-white border-[5px] border-blue-600/30 shadow-sm animate-border-pulsate px-4 py-2.5 flex flex-col"
        >
          <div className="flex justify-end items-center gap-1.5 mb-1 text-blue-600/70 select-none">
            <User strokeWidth={2.5} className="w-5 h-5 text-blue-600/70" />
          </div>
          <input
            type="text"
            name="shopQuestion"
            required
            placeholder={selectedLang === 'EN' ? "Type your message or scenario..." : "Escribe tu mensaje o escenario..."}
            style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }}
            className="w-full focus:outline-none transition-all border-none bg-transparent text-black text-right placeholder:text-right placeholder:text-black/45 font-serif text-[14px] p-0"
          />
        </form>
      </div>

    </div>
  );
};
