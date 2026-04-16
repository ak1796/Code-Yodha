import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, Lock, User, ArrowRight, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import bgImage from '../assets/image.png';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [activeRole, setActiveRole] = useState('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState('WATER');
  const [city, setCity] = useState('Mumbai');
  const { t, i18n } = useTranslation();

  const ROLE_CONFIG = {
    citizen: { title: t('CitizenPortal'), color: 'bg-[#162F6A]', icon: <User size={24} />, desc: t('VoiceYourConcerns') },
    officer: { title: t('OfficerOperations'), color: 'bg-[#162F6A]', icon: <Activity size={24} />, desc: t('ResolveFiledIssues') },
    admin: { title: t('CommandCenter'), color: 'bg-[#162F6A]', icon: <Shield size={24} />, desc: t('HighLevelAudits') }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('nagarvaani_demo_role', activeRole);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success(t('VerifySuccess', { role: t(activeRole.charAt(0).toUpperCase() + activeRole.slice(1)) }));
        setTimeout(() => navigate(activeRole === 'admin' ? '/admin/heatmap' : `/${activeRole}/dashboard`), 500);
      } else {
        const { error } = await signUp(email, password, fullName, activeRole, { department, city });
        if (error) throw error;
        toast.success(t('RegisterSuccess', { role: t(activeRole.charAt(0).toUpperCase() + activeRole.slice(1)) }));
      }
    } catch (error) {
      toast.error(error.message || error || t('AuthError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#F0F8FF]">
      {/* Background Image Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <img 
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[#F0F8FF]/40 backdrop-blur-sm" />
      </div>

      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none z-0">
         <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] ${ROLE_CONFIG[activeRole].color} rounded-full blur-[120px] transition-colors duration-500`} />
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-saffron rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl w-full z-10 animate-fade-in-up flex flex-col items-center justify-center max-h-screen">
        <div className="flex flex-col items-center mb-6 pt-2 shrink-0">
           <div className={`w-14 h-14 ${ROLE_CONFIG[activeRole].color} rounded-2xl flex items-center justify-center text-white shadow-xl mb-3 transition-colors duration-500`}>
              <Activity size={28} />
           </div>
           <h1 className="text-4xl font-sora font-extrabold text-[#162F6A] tracking-tighter uppercase">NagarVaani</h1>
           <p className="text-text-secondary font-black mt-0.5 uppercase tracking-[0.3em] text-[9px] opacity-40 italic">{t('CivicPlatform')}</p>
        </div>

        <div className="bg-white/40 backdrop-blur-3xl rounded-[3.5rem] p-10 lg:p-12 card-shadow border border-[#162F6A]/10 shadow-2xl relative overflow-hidden flex flex-col w-full max-h-[82vh]">
            <div className="grid grid-cols-3 gap-4 mb-8 shrink-0">
              {Object.keys(ROLE_CONFIG).filter(r => isLogin || r !== 'admin').map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-3xl border-2 transition-all duration-300 ${
                    activeRole === role
                    ? `border-[#162F6A] bg-[#162F6A]/5 shadow-inner`
                    : 'border-transparent hover:bg-gray-50 opacity-60'
                  }`}
                >
                  <div className={`${activeRole === role ? 'text-[#162F6A]' : 'text-text-secondary'} scale-110`}>
                    {ROLE_CONFIG[role].icon}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#162F6A] text-center leading-none mt-1">
                    {t(role.charAt(0).toUpperCase() + role.slice(1))}
                  </div>
                </button>
              ))}
            </div>

          <div className="flex p-1 bg-navy/5 rounded-2xl mb-8 shrink-0">
             <button
               onClick={() => setIsLogin(true)}
               className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isLogin ? 'bg-[#162F6A] text-white shadow-lg' : 'text-text-secondary hover:text-[#162F6A]'}`}
             >
                {t('Login')}
             </button>
             <button
               onClick={() => setIsLogin(false)}
               className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${!isLogin ? 'bg-[#162F6A] text-white shadow-lg' : 'text-text-secondary hover:text-[#162F6A]'}`}
             >
                {t('Register')}
             </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5 overflow-y-auto pr-1 flex-1 scrollbar-hide">
            {!isLogin && (
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[10px] font-black text-[#162F6A] uppercase tracking-widest ml-1 opacity-40">
                   <User size={12} /> {t('FullName')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/40 border border-[#162F6A]/10 rounded-2xl outline-none focus:border-[#162F6A] focus:bg-white text-sm font-bold transition shadow-sm"
                  placeholder="Rohini Patil"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2 group">
               <label className="flex items-center gap-2 text-[10px] font-black text-[#162F6A] uppercase tracking-widest ml-1 opacity-40">
                  <Mail size={12} /> {t('Email')}
               </label>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full px-6 py-4 bg-white/40 border border-[#162F6A]/10 rounded-2xl outline-none focus:border-[#162F6A] focus:bg-white text-sm font-bold transition shadow-sm"
                 placeholder="user@mcgm.gov"
                 required
               />
            </div>

            <div className="space-y-2 group">
               <label className="flex items-center gap-2 text-[10px] font-black text-[#162F6A] uppercase tracking-widest ml-1 opacity-40">
                  <Lock size={12} /> {t('Credentials')}
               </label>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full px-6 py-4 bg-white/40 border border-[#162F6A]/10 rounded-2xl outline-none focus:border-[#162F6A] focus:bg-white text-sm font-bold transition shadow-sm"
                 placeholder="••••••••"
                 required
               />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${ROLE_CONFIG[activeRole].color} text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl mt-6 flex items-center justify-center gap-2 group disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]`}
            >
              {loading ? t('Authenticating') : t('EnterDashboard', { role: activeRole.charAt(0).toUpperCase() + activeRole.slice(1) })}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Languages Integrated - Super Compact Footer */}
          <div className="mt-8 pt-6 border-t border-navy/5 flex items-center justify-between shrink-0">
              <select
                className="bg-transparent text-[#162F6A] text-[9px] font-black uppercase outline-none cursor-pointer tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity"
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                value={i18n.language}
              >
                <option value="en">ENGLISH</option>
                <option value="hi">HINDI</option>
                <option value="mr">MARATHI</option>
                <option value="bn">BENGALI</option>
                <option value="ta">TAMIL</option>
                <option value="ml">MALAYALAM</option>
              </select>
              <div className="flex items-center gap-2 text-[#162F6A] opacity-20 group">
                 <Shield size={12} />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t('EndToEnd')}</span>
              </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-text-secondary opacity-30 transform scale-90 shrink-0">
           <Shield size={14} className="text-emerald" />
           <span className="text-[9px] font-bold uppercase tracking-widest">{t('AuthorizedBy')}</span>
        </div>
      </div>
    </div>
  );
}
