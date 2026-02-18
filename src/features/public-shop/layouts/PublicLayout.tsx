import React, { useEffect } from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    font?: string;
    mode?: 'light' | 'dark';
  };
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, theme }) => {
  useEffect(() => {
    // Injeta variáveis CSS no root
    const root = document.documentElement;
    root.style.setProperty('--shop-primary', theme.primaryColor);
    root.style.setProperty('--shop-secondary', theme.secondaryColor);

    return () => {
      root.style.removeProperty('--shop-primary');
      root.style.removeProperty('--shop-secondary');
    };
  }, [theme]);

  const isDark = theme.mode === 'dark';

  return (
    // Usa bg-black para preto puro no modo escuro
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-black text-slate-100 dark' : 'bg-slate-50 text-slate-900'}`}>
      {/* Helper styles para usar as variáveis */}
      <style>{`
            /* Dark mode overrides */
            /* Escaping slashes with double backslash for JS string -> CSS class selector */
            
            .dark .bg-white { background-color: #121212 !important; border-color: #333333 !important; color: #f1f5f9 !important; }
            
            /* Pure Black Footer and Navbar - ESCAPED SLASHES */
            .dark .bg-white\\/95 { background-color: #000000 !important; border-color: #333333 !important; }
            .dark .bg-white\\/90 { background-color: #000000 !important; border-color: #333333 !important; }
            
            .dark .text-slate-900 { color: #ffffff !important; }
            .dark .text-slate-800 { color: #f8fafc !important; }
            .dark .text-slate-700 { color: #e2e8f0 !important; }
            .dark .text-slate-600 { color: #cbd5e1 !important; }
            .dark .text-slate-500 { color: #94a3b8 !important; }
            
            .dark .border-slate-100 { border-color: #262626 !important; }
            .dark .border-slate-200 { border-color: #333333 !important; }
            .dark .border-slate-300 { border-color: #404040 !important; }
            
            /* Ensure inputs and backgrounds are dark */
            .dark .bg-slate-50 { background-color: #000000 !important; border-color: #333333 !important; color: #ffffff !important; }
            .dark .bg-slate-100 { background-color: #222222 !important; border-color: #333333 !important; }
            .dark .bg-slate-200 { background-color: #333333 !important; }
            .dark .bg-slate-900 { background-color: #000000 !important; }
            
            .dark nav { background-color: #000000 !important; border-color: #333333 !important; }

            /* Shop dynamic theme classes - Defined last for priority */
            .bg-shop-primary { background-color: var(--shop-primary) !important; }
            .text-shop-primary { color: var(--shop-primary) !important; }
            .border-shop-primary { border-color: var(--shop-primary) !important; }
            .hover\\:bg-shop-primary:hover { background-color: var(--shop-primary) !important; }
            .dark .border-shop-primary { border-color: var(--shop-primary) !important; }
            .bg-shop-secondary { background-color: var(--shop-secondary) !important; }
            .text-shop-secondary { color: var(--shop-secondary) !important; }
            .bg-shop-primary-dim { background-color: color-mix(in srgb, var(--shop-primary), transparent 85%) !important; }
        `}</style>
      {children}
    </div>
  );
};
