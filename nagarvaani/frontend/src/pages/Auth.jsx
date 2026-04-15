import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, Lock, User, ArrowRight, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

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
    citizen: { title: t('CitizenPortal'), color: 'bg-navy', icon: <User size={24} />, desc: t('VoiceYourConcerns') },
    officer: { title: t('OfficerOperations'), color: 'bg-emerald', icon: <Activity size={24} />, desc: t('ResolveFiledIssues') },
    admin: { title: t('CommandCenter'), color: 'bg-crimson', icon: <Shield size={24} />, desc: t('HighLevelAudits') }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('nagarvaani_demo_role', activeRole);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success(`Identity Verified: Accessing ${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Dashboard`);
        setTimeout(() => navigate(activeRole === 'admin' ? '/admin/heatmap' : `/${activeRole}/dashboard`), 500);
      } else {
        const { error } = await signUp(email, password, fullName, activeRole, { department, city });
        if (error) throw error;
        toast.success(`${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Registered. Accessing your dashboard...`);
      }
    } catch (error) {
      toast.error(error.message || error || "Credential rejection: Check your entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
         <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] ${ROLE_CONFIG[activeRole].color} rounded-full blur-[120px] transition-colors duration-500`} />
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-saffron rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl w-full z-10 animate-fade-in-up">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <select
            className="bg-white/80 border border-border text-navy text-[10px] font-bold uppercase outline-none cursor-pointer tracking-widest rounded-lg px-3 py-1.5"
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            value={i18n.language}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
            <option value="bn">বাংলা</option>
            <option value="ta">தமிழ்</option>
            <option value="ml">മലയാളം</option>
          </select>
        </div>

        <div className="flex flex-col items-center mb-8">
           <div className={`w-16 h-16 ${ROLE_CONFIG[activeRole].color} rounded-3xl flex items-center justify-center text-white shadow-2xl mb-4 transition-colors duration-500`}>
              <Activity size={32} />
           </div>
           <h1 className="text-4xl font-sora font-extrabold text-navy tracking-tight">NagarVaani</h1>
           <p className="text-text-secondary font-medium mt-1 uppercase tracking-widest text-[10px] opacity-60">{t('CivicPlatform')}</p>
        </div>

        <div className="bg-surface rounded-[40px] p-8 card-shadow border border-border">
            <div className="grid grid-cols-3 gap-3 mb-8">
              {Object.keys(ROLE_CONFIG).filter(r => isLogin || r !== 'admin').map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                    activeRole === role
                    ? `border-navy bg-navy/5 shadow-inner`
                    : 'border-transparent hover:bg-gray-50 opacity-60'
                  }`}
                >
                  <div className={`${activeRole === role ? 'text-navy' : 'text-text-secondary'}`}>
                    {ROLE_CONFIG[role].icon}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-navy text-center leading-none">
                    {role}
                  </div>
                </button>
              ))}
            </div>

          <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
             <button
               onClick={() => setIsLogin(true)}
               className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isLogin ? 'bg-navy text-white shadow-lg' : 'text-text-secondary hover:text-navy'}`}
             >
                {t('Login')}
             </button>
             <button
               onClick={() => setIsLogin(false)}
               className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${!isLogin ? 'bg-navy text-white shadow-lg' : 'text-text-secondary hover:text-navy'}`}
             >
                {t('Register')}
             </button>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-sora font-extrabold text-navy leading-tight">
              {isLogin ? ROLE_CONFIG[activeRole].title : t('RegisterAs', { role: activeRole.charAt(0).toUpperCase() + activeRole.slice(1) })}
            </h2>
            <p className="text-xs text-text-secondary mt-1 font-medium">{isLogin ? ROLE_CONFIG[activeRole].desc : t('InitializeIdentity')}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1.5 group">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1 opacity-60 transition-opacity">
                     <User size={12} className="text-navy" /> {t('FullName')}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-5 py-3 border border-border rounded-2xl outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 text-sm font-bold transition"
                    placeholder="e.g. Rohini Patil"
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5 group">
              <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1 opacity-60 transition-opacity">
                 <Mail size={12} className="text-navy" /> {activeRole} {t('Email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 border border-border rounded-2xl outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 text-sm font-bold transition"
                placeholder={activeRole === 'citizen' ? 'citizen@mumbai.gov' : activeRole === 'admin' ? 'admin@mcgm.gov' : 'officer01@mcgm.gov'}
                required
              />
            </div>

            <div className="space-y-1.5 group">
              <label className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1 opacity-60 transition-opacity">
                 <Lock size={12} className="text-navy" /> {t('Credentials')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 border border-border rounded-2xl outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 text-sm font-bold transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${ROLE_CONFIG[activeRole].color} text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl mt-4 flex items-center justify-center gap-2 group disabled:opacity-50`}
            >
              {loading ? t('Authenticating') : t('EnterDashboard', { role: activeRole.charAt(0).toUpperCase() + activeRole.slice(1) })}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] opacity-40">
             {t('EndToEnd')}
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-text-secondary opacity-60">
           <Shield size={16} className="text-emerald" />
           <span className="text-[10px] font-bold uppercase tracking-widest">{t('AuthorizedBy')}</span>
        </div>
      </div>
    </div>
  );
}
