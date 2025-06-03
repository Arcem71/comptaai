import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

export function Auth() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src="/logo2.png" alt="Logo" className="h-12 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-primary">
            Compta AI
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous pour accéder à l'application
          </p>
        </div>
        
        <div className="bg-white py-8 px-4 shadow-md rounded-lg sm:px-10">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#1E0F45',
                    brandAccent: '#02A7F8',
                  },
                },
              },
            }}
            providers={[]}
            view="sign_in"
            showLinks={false}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}