import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { API_URL } from '../constants/config';

type Profil = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'employe';
};

export function useProfile(session: Session | null) {
  const [profil, setProfil] = useState<Profil | null>(null);

  useEffect(() => {
    if (!session) {
      setProfil(null);
      return;
    }

    fetch(`${API_URL}/profiles/${session.user.id}`)
      .then(r => r.json())
      .then(data => setProfil(data))
      .catch(() => setProfil(null));
  }, [session]);

  return profil;
}