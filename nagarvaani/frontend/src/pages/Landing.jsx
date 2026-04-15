import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, ArrowRight, MessageSquare, Activity, Globe, Zap, Users, TrendingUp } from 'lucide-react';
import heroBg1 from '../assets/hero_bg_1.png';
import heroBg2 from '../assets/hero_bg_2.png';
import heroBg3 from '../assets/hero_bg_3.png';

const HERO_IMAGES = [heroBg1, heroBg2, heroBg3];

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F8FF] selection:bg-navy selection:text-white">
      {/* Dynamic Background removed for solid color clarity */}

      <header className="bg-surface/80 backdrop-blur-md px-8 py-6 flex justify-between items-center fixed top-0 w-full z-50 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-saffron shadow-lg">
             <Activity size={24} />
          </div>
          <span className="text-2xl font-sora font-extrabold text-navy tracking-tight">NagarVaani</span>
        </div>
        <nav className="flex items-center gap-8">
           <div className="hidden md:flex gap-6">
              <HeaderLink id="insights" label={t('NavInsights')} />
              <HeaderLink id="aats" label={t('NavAATS')} />
              <HeaderLink id="legal" label={t('NavLegal')} />
           </div>
           <select 
              className="bg-transparent text-navy text-[10px] font-bold uppercase outline-none cursor-pointer tracking-widest border border-navy/20 rounded px-2 py-1"
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              value={i18n.language}
           >
              <option value="en">ENG</option>
              <option value="hi">HIN</option>
              <option value="mr">MAR</option>
              <option value="bn">BEN</option>
              <option value="ta">TAM</option>
              <option value="ml">MAL</option>
           </select>
           <Link to="/track" className="hidden sm:block text-[10px] uppercase font-bold text-navy hover:text-[#FF9933] transition-colors tracking-widest border-b-2 border-transparent hover:border-[#FF9933] pb-1">
              {t('TrackCase')}
           </Link>
           <Link to="/auth" className="bg-navy text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-navy-light shadow-xl transition-all hover:-translate-y-0.5 active:scale-95">
              {t('SecureAccess')}
           </Link>
        </nav>
      </header>

      <main className="relative">
        <section className="relative w-full overflow-hidden border-b border-border/10">
          {/* Background Carousel & Overlay */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {HERO_IMAGES.map((img, idx) => (
              <img 
                 key={idx}
                 src={img} 
                 className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${idx === bgIndex ? 'opacity-100' : 'opacity-0'}`} 
                 alt={`Hero Background ${idx + 1}`} 
              />
            ))}
            <div className="absolute inset-0 bg-navy/70 backdrop-blur-[2px]" />
          </div>

          {/* Hero Content Section */}
          <div className="max-w-7xl mx-auto px-6 pt-40 md:pt-48 pb-32 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-10 shadow-sm animate-fade-in border border-white/20">
               <Globe size={14} className="text-saffron animate-spin-slow" /> {t('IntelligenceForCities')}
            </div>
            
            <h1 className="text-6xl md:text-8xl font-sora font-extrabold text-white tracking-tighter leading-[0.95] animate-fade-in-up">
              {t('HeroTitle1')} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-saffron animate-text-shimmer bg-[length:200%_auto]">{t('HeroTitle2')}</span>
            </h1>

            <div className="mt-8 flex justify-center items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
               <div className="w-24 h-2 bg-[#FF9933] shadow-lg shadow-orange-500/20" />
               <div className="w-24 h-2 bg-white shadow-lg shadow-white/20" />
               <div className="w-24 h-2 bg-[#138808] shadow-lg shadow-green-500/20" />
            </div>

            <p className="mt-8 text-xl text-white/80 max-w-3xl mx-auto font-medium leading-relaxed opacity-80 px-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
               {t('LandingHeroDesc')}
            </p>
    
            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/auth" className="bg-saffron text-white px-10 py-5 rounded-3xl text-sm font-bold shadow-2xl hover:shadow-saffron/20 hover:scale-105 transition-all flex items-center justify-center gap-3 uppercase tracking-widest group">
                {t('BtnFileReport')} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link to="/track" className="bg-white/10 backdrop-blur-md text-white px-10 py-5 rounded-3xl text-sm font-bold shadow-xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
                {t('BtnTrackIdentity')} <Shield size={20} />
              </Link>
            </div>
          </div>
        </section>


        <section className="max-w-7xl mx-auto px-6 text-center relative">
          {/* Dynamic Metric Cards */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-4 gap-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
             <MetricCard label={t('ResolvedActions')} value="14.2K" color="navy" icon={<Activity />} />
             <MetricCard label={t('ResolutionRate')} value="98%" color="emerald" icon={<Zap />} />
             <MetricCard label={t('PublicTrust')} value="85" color="amber" icon={<Users />} />
             <MetricCard label={t('SLACompliance')} value="92%" color="navy" icon={<TrendingUp />} />
          </div>
  
          {/* Feature Grid */}
          <section className="mt-40 grid grid-cols-1 lg:grid-cols-2 gap-12 text-left pb-40">
             <FeatureSection 
               title={t('FeatureAITitle')}
               desc={t('FeatureAIDesc')}
               icon={<Zap className="text-saffron" size={48} />}
             />
             <FeatureSection 
               title={t('FeatureAnonTitle')}
               desc={t('FeatureAnonDesc')}
               icon={<Shield className="text-navy" size={48} />}
             />
             <FeatureSection 
               title={t('FeatureMemoryTitle')} 
               desc={t('FeatureMemoryDesc')}
               icon={<MessageSquare className="text-emerald" size={48} />}
             />
             <FeatureSection 
               title={t('FeatureTrustTitle')}
               desc={t('FeatureTrustDesc')}
               icon={<Activity className="text-amber" size={48} />}
             />
          </section>
        </section>
      </main>

      <footer className="py-20 bg-[#162F6A] text-center">
         <div className="max-w-7xl mx-auto px-6">
            <h4 className="text-2xl font-sora font-extrabold text-white">Building Bharat's Smartest Grid.</h4>
            <p className="text-sm text-white/60 mt-2 font-medium">NagarVaani Civic intelligence Platform &copy; 2026</p>
         </div>
      </footer>
    </div>
  );
}

function HeaderLink({ id, label }) {
   return (
      <a href={`#${id}`} className="text-[11px] font-bold text-navy/60 hover:text-[#FF9933] uppercase tracking-widest transition-colors">{label}</a>
   );
}

function MetricCard({ label, value, color, icon }) {
  const colors = {
     navy: 'text-navy',
     emerald: 'text-emerald',
     amber: 'text-amber'
  };
  return (
    <div className="bg-surface p-10 rounded-2xl card-shadow border-2 border-[#162F6A]/20 flex flex-col items-center group hover:scale-[1.02] transition-transform duration-500">
      <div className={`p-4 rounded-2xl bg-gray-50 mb-6 group-hover:bg-navy group-hover:text-white transition-colors duration-500 ${colors[color]}`}>
         {React.cloneElement(icon, { size: 32 })}
      </div>
      <h3 className={`text-5xl font-sora font-extrabold tracking-tighter ${colors[color]}`}>{value}</h3>
      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-2 opacity-60">{label}</p>
    </div>
  );
}

function FeatureSection({ title, desc, icon }) {
   return (
      <div className="p-10 rounded-2xl bg-white border-2 border-[#162F6A]/20 shadow-soft hover:shadow-xl transition-all duration-500 flex flex-col gap-8 group">
         <div className="flex justify-between items-start">
            <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-navy group-hover:text-white transition-colors duration-500">
               {icon}
            </div>
            <ArrowRight className="text-gray-200 group-hover:text-navy transition-colors duration-500 group-hover:translate-x-2" size={32} />
         </div>
         <div>
            <h3 className="text-3xl font-sora font-extrabold text-[#162F6A] tracking-tight underline decoration-saffron-light underline-offset-[12px] group-hover:decoration-saffron">{title}</h3>
            <p className="text-lg text-text-secondary mt-8 leading-relaxed font-medium opacity-80">{desc}</p>
         </div>
      </div>
   );
}
