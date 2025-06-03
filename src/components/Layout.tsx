import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1E0F45] text-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <img src="/logo2.png" alt="Logo" className="h-12" />
          <div className="flex items-center gap-4">
            {user && (
              <button
                onClick={handleLogout}
                className="text-white/70 hover:text-white transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
            <img src="/logo.png" alt="Logo" className="h-8" />
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
      <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Compta AI - Tous droits réservés
        </div>
      </footer>
    </div>
  );
};