import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useRealtimeTickets(officerId) {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we're an officer, we need officerId. If we're a citizen, we use profile.id.
    // If neither exists yet, we wait for profile to load.
    if (!profile) return;

    const isOfficer = profile.role === 'officer' || profile.role === 'admin';

    const fetchTickets = async () => {
      try {
        let query = supabase.from('master_tickets').select('*');

        if (isOfficer && profile.role !== 'admin') {
          // Officers see tickets in their department (Step 5)
          query = query.eq('category', profile.department);
        } else if (profile.role === 'citizen') {
          // Citizens see tickets they created
          query = query.eq('creator_id', profile.id);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setTickets(data || []);
        }
      } catch (err) {
        console.error("Master Ticket Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();

    // Real-time subscription
    let channelName = `citizen-tickets-${profile.id}`;
    let filterStr = `creator_id=eq.${profile.id}`;

    if (isOfficer) {
      channelName = `dept-tickets-${profile.department}`;
      filterStr = `category=eq.${profile.department}`;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'master_tickets',
        filter: filterStr
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTickets(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(t => t.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [officerId, profile]);

  // Reactive Stats Pipeline
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const assignedToday = tickets.filter(t => new Date(t.created_at) >= today).length;
    const resolvedToday = tickets.filter(t => t.status === 'resolved' && (t.resolved_at ? new Date(t.resolved_at) >= today : true)).length;
    const breaches = tickets.filter(t => t.status !== 'resolved' && t.sla_deadline && new Date(t.sla_deadline) < new Date()).length;
    
    // Performance logic: 70% base + resolution bonus
    const performance = Math.min(100, 78 + (resolvedToday * 2) - (breaches * 5));

    return { assignedToday, resolvedToday, breaches, performance };
  }, [tickets]);

  return { tickets, loading, stats };
}
