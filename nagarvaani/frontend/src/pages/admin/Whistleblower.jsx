import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Key, ArrowRight, Eye, User, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Whistleblower() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [decryptedText, setDecryptedText] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnonymous = async () => {
       const { data } = await supabase.from('complaints').select('*').eq('is_anonymous', true).order('created_at', { ascending: false });
       setComplaints(data || []);
       setLoading(false);
    };
    fetchAnonymous();
  }, []);

  const handleDecrypt = async (id, encrypted) => {
     setCurrentId(id);
     toast.loading("Invoking AES-256 decryption...", { id: 'decrypt' });
     
     // Mocking backend call for demo
     setTimeout(() => {
        setDecryptedText("Investigation into unauthorized construction at Santacruz revealed a direct link to local official #4012. Contractor pay-offs confirmed. Immediate audit required.");
        toast.success("Decryption Successful", { id: 'decrypt' });
     }, 2000);
  };

  return (
    <div className="min-h-screen bg-bg p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex justify-between items-center text-navy">
           <div>
              <div className="flex items-center gap-2 mb-2 text-emerald">
                 <Shield size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">{t('EndToEndEncryptedTunnel')}</span>
              </div>
              <h1 className="text-4xl font-sora font-extrabold tracking-tight underline-offset-8 decoration-saffron">{t('WhistleblowerPanel')}</h1>
           </div>
           <div className="text-right flex flex-col items-end">
              <div className="py-2 px-4 bg-navy text-white rounded-xl flex items-center gap-2 font-bold font-mono text-xs uppercase shadow-lg">
                 <Key size={14} className="text-saffron" /> {t('MasterKeyActive')}
              </div>
              <p className="text-[10px] font-bold text-text-secondary mt-1 opacity-40 uppercase tracking-widest">ID: {localStorage.getItem('user_id')?.substring(0, 8)}</p>
           </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
             <h2 className="text-xl font-sora font-extrabold text-navy px-2 border-b border-border pb-4 uppercase tracking-widest text-[11px]">{t('AnonymousIngestionQueue')}</h2>
             <div className="space-y-4">
                {complaints.map((c) => (
                   <div key={c.id} className={`bg-surface p-6 rounded-2xl shadow-soft border-2 transition ${
                      currentId === c.id ? 'border-navy bg-gray-50' : 'border-transparent hover:border-border'
                   }`}>
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-navy"><Lock size={18} /></div>
                            <div>
                               <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('Source')}: {c.source}</p>
                               <p className="text-xs font-bold font-mono">{c.id.substring(0, 16).toUpperCase()}</p>
                            </div>
                         </div>
                         <button 
                            onClick={() => handleDecrypt(c.id, c.encrypted_text)}
                            className="bg-navy text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-navy-light transition shadow-lg flex items-center gap-2"
                         >
                            {t('DecryptCase')} <Eye size={12} />
                         </button>
                      </div>
                      <div className="h-12 bg-gray-100 rounded-lg flex items-center px-4 overflow-hidden relative group">
                         <span className="text-[11px] font-mono font-bold text-text-secondary opacity-30 tracking-widest select-none truncate">
                            {c.encrypted_text?.substring(0, 100) || 'ENCRYPTED_AES256_METADATA_STREAM_BLOB_XXXXXXXXXX'}
                         </span>
                         <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-navy opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest cursor-default">
                           {t('TopSecretRestrictedContent')}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="sticky top-24 h-fit">
             <div className="bg-navy rounded-3xl p-10 text-white card-shadow space-y-8 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full" />
                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                   <div className="w-14 h-14 rounded-2xl bg-saffron text-white flex items-center justify-center shadow-lg transform -rotate-12"><Shield size={28} /></div>
                   <div>
                      <h3 className="text-2xl font-sora font-extrabold tracking-tight">{t('DecryptionLab')}</h3>
                      <p className="text-xs text-white/60 font-bold uppercase tracking-widest">{t('AuthorizedPersonnelOnly')}</p>
                   </div>
                </div>

                {decryptedText ? (
                   <div className="space-y-6 animate-fade-in">
                      <div className="p-6 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md">
                         <h4 className="text-saffron text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                           <Eye size={12} /> {t('LiveDecryptionResult')}
                         </h4>
                         <p className="text-lg leading-relaxed font-medium">"{decryptedText}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <button className="flex items-center justify-center gap-2 bg-emerald text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:shadow-lg transition">
                            {t('OpenInvestigation')} <FileText size={16} />
                         </button>
                         <button onClick={() => setDecryptedText(null)} className="flex items-center justify-center gap-2 bg-white/10 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-white/20 transition">
                            {t('Dismiss')} <CheckCircle size={16} />
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="py-12 text-center text-white/30 space-y-4">
                      <Lock size={64} className="mx-auto mb-2 opacity-10" />
                      <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">{t('SelectComplaintDesc')}</p>
                      <div className="flex justify-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-saffron animate-ping" />
                         <div className="w-2 h-2 rounded-full bg-saffron opacity-50" />
                         <div className="w-2 h-2 rounded-full bg-saffron opacity-20" />
                      </div>
                   </div>
                )}
             </div>
             
             <div className="mt-8 flex items-start gap-4 p-6 bg-emerald-light border border-emerald rounded-2xl text-emerald-900 shadow-soft">
                <AlertTriangle size={20} className="shrink-0 mt-1" />
                <p className="text-xs font-bold leading-relaxed uppercase tracking-widest opacity-80">{t('AuditLogWarning')}</p>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
