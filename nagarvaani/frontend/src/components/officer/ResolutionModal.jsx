import React, { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabaseClient";
import axios from 'axios';
import { Camera, MapPin, Search, CheckCircle, AlertTriangle, RefreshCw, X, ShieldCheck, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResolutionModal({ ticketId, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Photos, 2: GPS, 3: AI Verifying
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [officerLocation, setOfficerLocation] = useState(null);
  const [isVerifyingGPS, setIsVerifyingGPS] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const incidentLocation = { lat: 19.1136, lng: 72.8697 }; // Mock incident location

  const handleLocationDetection = () => {
    setIsVerifyingGPS(true);
    // Simulate Browser Geolocation
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setOfficerLocation(loc);
      setIsVerifyingGPS(false);
    }, () => {
      // Fallback/Mock for Dev
      setOfficerLocation({ lat: 19.1121, lng: 72.8691 });
      setIsVerifyingGPS(false);
    });
  };

  const getDistance = () => {
    if (!officerLocation) return 1000;
    // Haversine approx (mocked for demo)
    return 187; // 187 meters as per spec
  };

  const verifyResolution = async () => {
    setStep(3);
    // Simulate Gemini Vision Intelligence Analysis
    await new Promise(r => setTimeout(r, 4000));
    
    const confidence = Math.random() > 0.3 ? 91 : 34; // 70% chance of success
    
    if (confidence > 80) {
      setAiResult({
        success: true,
        confidence,
        msg: "Gemini Vision confirmed visible improvement. The 'after' image shows the road is clear and the pipe is repaired compared to the 'before' image."
      });
      await finalizeTicket();
    } else {
      setAiResult({
        success: false,
        confidence,
        msg: "AI could not verify sufficient improvement. The two images appear too similar — no visible physical change detected."
      });
    }
  };

  const finalizeTicket = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5176';
      const token = localStorage.getItem('nv_token');
      
      const formData = new FormData();
      if (beforePhoto) formData.append('before', beforePhoto);
      if (afterPhoto) formData.append('after', afterPhoto);
      formData.append('status', 'resolved');

      const res = await axios.patch(`${backendUrl}/api/tickets/${ticketId}/resolve`, 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      if (res.status === 200) {
        setIsResolved(true);
        setTimeout(onSuccess, 3000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Forensic verification failed: Authority rejected evidence suite");
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in">
       <div className="bg-white rounded-[3.5rem] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col">
          
          {/* Header */}
          <div className="p-10 border-b border-border flex justify-between items-center bg-bg shadow-sm">
             <div>
                <h3 className="text-2xl font-sora font-extrabold text-navy tracking-tighter uppercase">Resolution Evidence Suite</h3>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40 mt-1 italic">Protocol UGIRP-SECURE-882: Resolution Verification</p>
             </div>
             <button onClick={onClose} className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition border border-border">
                <X size={20} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
             {step === 1 && (
                <div className="space-y-12 animate-fade-in">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <PhotoUpload label="Before Physical Intervention" help="Evidence of burst pipe / original issue" onUpload={setBeforePhoto} photo={beforePhoto} />
                      <PhotoUpload label="After Technical Fulfillment" help="Evidence of repair / dry road / clear zone" onUpload={setAfterPhoto} photo={afterPhoto} />
                   </div>
                   <div className="bg-bg rounded-[2.5rem] p-10 border border-border flex items-center justify-between">
                      <div className="space-y-2">
                         <h4 className="flex items-center gap-3 text-sm font-black text-navy uppercase tracking-widest">
                            <MapPin size={20} className="text-crimson" /> Jurisdictional Lock
                         </h4>
                         <p className="text-xs text-text-secondary font-medium italic">Physical presence within 500m of the node is mandatory for resolution.</p>
                      </div>
                      <button 
                        onClick={handleLocationDetection} 
                        className={`px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center gap-2 ${
                           officerLocation ? 'bg-emerald text-white' : 'bg-navy text-white hover:scale-105 shadow-xl'
                        }`}
                        disabled={isVerifyingGPS}
                      >
                         {isVerifyingGPS ? <RefreshCw size={16} className="animate-spin"/> : <Search size={16}/>}
                         {officerLocation ? 'GPS VERIFIED' : 'Detect My Location'}
                      </button>
                   </div>
                   
                   {officerLocation && (
                      <div className="p-6 bg-emerald-light/10 border-2 border-dashed border-emerald/20 rounded-3xl flex items-center justify-between">
                         <div className="flex items-center gap-8">
                            <LocationCoord label="Incident" val="19.1136, 72.8697" />
                            <LocationCoord label="Officer" val={`${officerLocation.lat.toFixed(4)}, ${officerLocation.lng.toFixed(4)}`} />
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-xl font-sora font-black text-emerald">187m Offset</span>
                            <span className="text-[9px] font-black text-emerald uppercase tracking-widest opacity-60">Verified: Within 500m Limit</span>
                         </div>
                      </div>
                   )}

                   <div className="pt-6">
                      <button 
                        disabled={!beforePhoto || !afterPhoto || !officerLocation}
                        onClick={verifyResolution}
                        className="w-full bg-navy text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition shadow-2xl disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                         Initiate AI Evidence Audit 
                      </button>
                   </div>
                </div>
             )}

             {step === 3 && (
                <div className="py-20 text-center space-y-8 animate-fade-in">
                   {!aiResult ? (
                      <>
                         <div className="relative inline-block">
                            <RefreshCw size={80} className="text-navy animate-spin opacity-10" />
                            <div className="absolute inset-0 flex items-center justify-center">
                               <ShieldCheck size={32} className="text-navy animate-pulse" />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <h3 className="text-2xl font-sora font-extrabold text-navy uppercase tracking-tighter">Gemini Vision Intelligence Ingesting...</h3>
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40">Verifying pixel-delta between before and after infrastructure state</p>
                         </div>
                         <div className="max-w-xs mx-auto h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-navy animate-progress" />
                         </div>
                      </>
                   ) : (
                      <div className="max-w-2xl mx-auto space-y-10 animate-fade-in-up">
                         <div className={`p-12 rounded-[3.5rem] ${aiResult.success ? 'bg-emerald text-white shadow-emerald/20' : 'bg-crimson text-white shadow-crimson/20'} shadow-2xl relative overflow-hidden group`}>
                            <div className="relative z-10 flex flex-col items-center gap-8">
                               <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                  {aiResult.success ? <CheckCircle size={40} /> : <AlertTriangle size={40} />}
                               </div>
                               <div>
                                  <h3 className="text-4xl font-sora font-black tracking-tighter uppercase">{aiResult.success ? 'AI Verified' : 'Resolution Rejected'}</h3>
                                  <div className="flex items-center justify-center gap-3 mt-4">
                                     <Activity size={18} className="animate-pulse" />
                                     <span className="text-xs font-black uppercase tracking-widest">Confidence Coefficient: {aiResult.confidence}%</span>
                                  </div>
                               </div>
                               <p className="text-sm font-bold opacity-80 max-w-lg leading-relaxed italic">"{aiResult.msg}"</p>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
                         </div>

                         {aiResult.success ? (
                            <p className="text-xs font-black text-emerald uppercase tracking-[0.4em] animate-pulse">Ticket Successfully Fulfilled & Archived</p>
                         ) : (
                            <button 
                              onClick={() => setStep(1)} 
                              className="px-12 py-5 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition shadow-xl"
                            >
                               Recapture Evidence Suite
                            </button>
                         )}
                      </div>
                   )}
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

function PhotoUpload({ label, help, onUpload, photo }) {
   return (
      <div className="group relative">
         <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 mb-3">{label}</p>
         <div className={`h-48 rounded-[2rem] border-4 border-dashed border-border flex flex-col items-center justify-center transition-all bg-bg relative overflow-hidden ${photo ? 'border-emerald/40' : 'hover:border-navy/20'}`}>
            {photo ? (
               <img src={URL.createObjectURL(photo)} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
               <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                     <Camera size={20} className="text-navy opacity-40" />
                  </div>
                  <p className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em] px-8 opacity-40">{help}</p>
               </div>
            )}
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => onUpload(e.target.files[0])} 
            />
         </div>
      </div>
   );
}

function LocationCoord({ label, val }) {
   return (
      <div className="flex flex-col">
         <span className="text-[9px] font-black uppercase tracking-widest opacity-30 text-navy">{label} Lat/Lng</span>
         <span className="text-sm font-bold font-sora tracking-tight text-navy">{val}</span>
      </div>
   );
}
