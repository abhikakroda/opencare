import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimeTable = (table: string, onChange: () => void) => {
  useEffect(() => {
    const client = supabase;
    if (!client) {
      return;
    }

    const channel = client
      .channel(`${table}-stream`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [table, onChange]);
};
