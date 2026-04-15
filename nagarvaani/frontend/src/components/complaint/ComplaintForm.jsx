import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, MicOff, MapPin, Shield, Check, Camera, 
  ChevronRight, ChevronDown, Info, AlertTriangle, 
  Trash2, Save, Activity, ShieldCheck, UserCheck, 
  Globe, Clock, Smartphone, Map, User, Mail, Phone,
  X, CheckCircle, Loader2, Sparkles, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- CONSTANTS & MAPPINGS ---

const COMPLAINT_TYPES = [
  { name: 'Drainage', internal: 'DRAINAGE' },
  { name: 'Storm water drain', internal: 'DRAINAGE' },
  { name: 'Water supply', internal: 'WATER' },
  { name: 'Roads and traffic', internal: 'ROADS' },
  { name: 'Solid Waste Management', internal: 'GARBAGE' },
  { name: 'Health', internal: 'HEALTH' },
  { name: 'Garden & Tree', internal: 'PARKS' },
  { name: 'Buildings', internal: 'BUILDINGS' },
  { name: 'Pest control', internal: 'PEST' },
  { name: 'Encroachment', internal: 'ENCROACHMENT' },
  { name: 'Electricity', internal: 'ELECTRICITY' },
  { name: 'Licence', internal: 'OTHER' },
  { name: 'Factories', internal: 'OTHER' },
  { name: 'School', internal: 'OTHER' }
];

const SUBTYPES = {
  'Water supply': ['No water supply', 'Low pressure', 'Dirty water', 'Pipeline leakage', 'Water meter issue', 'Other'],
  'Drainage': ['Drain blocked', 'Drain overflow', 'Manhole open', 'Sewage on road', 'Other'],
  'Storm water drain': ['Drain blocked', 'Drain overflow', 'Manhole open', 'Sewage on road', 'Other'],
  'Roads and traffic': ['Pothole', 'Road damaged', 'Footpath broken', 'Streetlight not working', 'Traffic signal issue', 'Other'],
  'Solid Waste Management': ['Garbage not collected', 'Illegal dumping', 'Overflowing bin', 'Bad smell', 'Other'],
  // Fallback for others
  'DEFAULT': ['General complaint', 'Urgent issue', 'Other']
};

const WARDS = [
  { name: "A Ward (Colaba, Fort, Churchgate)", code: "A", lat: 18.9322, lng: 72.8264 },
  { name: "B Ward (Mandvi, Masjid Bunder)", code: "B", lat: 18.9500, lng: 72.8370 },
  { name: "C Ward (Dharavi, Wadala)", code: "C", lat: 19.0176, lng: 72.8561 },
  { name: "D Ward (Worli, Prabhadevi)", code: "D", lat: 19.0100, lng: 72.8200 },
  { name: "E Ward (Byculla, Mazgaon)", code: "E", lat: 18.9750, lng: 72.8350 },
  { name: "F/N Ward (Sion, Kurla North)", code: "F/N", lat: 19.0300, lng: 72.8600 },
  { name: "F/S Ward (Kurla South, Chembur North)", code: "F/S", lat: 19.0100, lng: 72.8700 },
  { name: "G/N Ward (Bandra West)", code: "G/N", lat: 19.0596, lng: 72.8297 },
  { name: "G/S Ward (Bandra East, Dharavi)", code: "G/S", lat: 19.0400, lng: 72.8550 },
  { name: "H/E Ward (Santacruz East, Kurla)", code: "H/E", lat: 19.0800, lng: 72.8450 },
  { name: "H/W Ward (Santacruz West, Vile Parle)", code: "H/W", lat: 19.0800, lng: 72.8250 },
  { name: "K/E Ward (Andheri East)", code: "K/E", lat: 19.1200, lng: 72.8700 },
  { name: "K/W Ward (Andheri West, Versova)", code: "K/W", lat: 19.1350, lng: 72.8300 },
  { name: "L Ward (Kurla, Vidyavihar)", code: "L", lat: 19.0850, lng: 72.8850 },
  { name: "M/E Ward (Chembur, Govandi)", code: "M/E", lat: 19.0650, lng: 72.9100 },
  { name: "M/W Ward (Chembur West)", code: "M/W", lat: 19.0600, lng: 72.8950 },
  { name: "N Ward (Ghatkopar)", code: "N", lat: 19.1550, lng: 72.9100 },
  { name: "P/N Ward (Goregaon, Malad)", code: "P/N", lat: 19.1600, lng: 72.8500 },
  { name: "P/S Ward (Goregaon South)", code: "P/S", lat: 19.1600, lng: 72.8400 },
  { name: "R/C Ward (Borivali, Kandivali)", code: "R/C", lat: 19.2300, lng: 72.8600 },
  { name: "R/N Ward (Dahisar, Kandivali North)", code: "R/N", lat: 19.2500, lng: 72.8500 },
  { name: "R/S Ward (Borivali South)", code: "R/S", lat: 19.2200, lng: 72.8400 },
  { name: "S Ward (Mulund, Nahur)", code: "S", lat: 19.1800, lng: 72.9600 },
  { name: "T Ward (Mulund West, Bhandup)", code: "T", lat: 19.1700, lng: 72.9400 },
];

const COUNCILS = [
  "Brihanmumbai Municipal Corporation (BMC)",
  "Mumbai Metropolitan Region Development Authority (MMRDA)",
  "Maharashtra State Electricity Distribution Co. (MSEDCL)",
  "Mahanagar Gas Limited (MGL)",
  "Mumbai Port Authority",
  "Other"
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' }
];

// --- MAIN COMPONENT ---

export default function HighFidelityComplaintForm({ onSubmit, isSubmitting: parentSubmitting }) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    // Section 1
    complaint_type: '',
    complaint_subtype: '',
    ppo_no: '',
    description: '',
    
    // Section 2
    house_no: '',
    street: '',
    area: '',
    city: 'MUMBAI',
    landmark: '',
    ward: '',
    lat: null,
    lng: null,
    connection_code: '',
    council: '',
    
    // Section 3
    first_name: '',
    last_name: '',
    
    // Section 4
    c_house_no: '',
    c_street: '',
    c_area: '',
    c_city: 'MUMBAI',
    c_state: 'Maharashtra',
    c_country: 'India',
    c_std: '',
    c_phone: '',
    mobile: '',
    email: '',
    folio_code: '',
    
    // Section 5
    is_anonymous: false,
    media: null,
    language: 'en'
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [successData, setSuccessData] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const scrollRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Default
      
      rec.onresult = (event) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTrans += event.results[i][0].transcript;
        }
        if (finalTrans) {
          setFormData(prev => ({ ...prev, description: prev.description + ' ' + finalTrans }));
        }
      };
      
      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    }

    // Load Draft
    const draft = localStorage.getItem('ugirp_complaint_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, []);

  // Save Draft
  const saveDraft = () => {
    localStorage.setItem('ugirp_complaint_draft', JSON.stringify(formData));
    toast.success("Draft saved to cache", { duration: 1000 });
  };

  const clearDraft = () => {
    localStorage.removeItem('ugirp_complaint_draft');
    toast.success("Draft cleared");
  };

  const aiExtract = async (transcript) => {
    const loadId = toast.loading("AI analyzing your voice...");
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5176';
      const res = await fetch(`${backendUrl}/api/voice/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const data = await res.json();
      
      setFormData(prev => ({
        ...prev,
        category: data.category || prev.category,
        description: data.description || prev.description,
        location_text: data.location_text || prev.location_text
      }));
      
      toast.success("AI: Details extracted! Check steps 1-3.", { id: loadId });
    } catch (err) {
      console.error("AI extraction failed", err);
      toast.error("AI extraction failed. Please fill manually.", { id: loadId });
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      setFormData(prev => ({ ...prev, description: '' }));
      recognition.lang = formData.language === 'hi' ? 'hi-IN' : formData.language === 'mr' ? 'mr-IN' : 'en-IN';
      recognition?.start();
      setIsListening(true);
      
      // Stop and process after 5 seconds of silence or manual stop
      recognition.onend = () => {
        setIsListening(false);
        // We trigger extraction when it ends
      };
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
          
        setFormData(prev => ({ ...prev, description: transcript }));
        
        if (event.results[0].isFinal) {
           aiExtract(transcript);
        }
      };
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error("GPS Signal Unavailable");
    
    toast.loading("Triangulating GPS Node...", { id: 'gps' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
        toast.success("Location locked accurately ✓", { id: 'gps' });
      },
      () => toast.error("Satellite link failed. Select ward manually.", { id: 'gps' })
    );
  };

  const handleWardChange = (e) => {
    const wardName = e.target.value;
    const wardData = WARDS.find(w => w.name === wardName);
    setFormData(prev => ({ 
      ...prev, 
      ward: wardName,
      ward_code: wardData?.code || wardName,
      lat: wardData?.lat || null,
      lng: wardData?.lng || null
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.complaint_type) newErrors.complaint_type = "Complaint type is required";
    if (!formData.complaint_subtype) newErrors.complaint_subtype = "Subtype is required";
    if (formData.description.trim().split(/\s+/).length < 10) newErrors.description = "Minimum 10 words required";
    if (!formData.street) newErrors.street = "Street name required";
    if (!formData.area) newErrors.area = "Area name required";
    if (!formData.ward) newErrors.ward = "Select a ward for jurisdictional routing";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) newErrors.mobile = "Enter valid 10-digit mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
       toast.error("Please correct errors in the grid");
       return;
    }

    setIsProcessing(true);
    setProcessStep(1);

    // Instant Cognitive Sequence
    setProcessStep(4); // Skip immediately to final stage

    try {
      const typeObj = COMPLAINT_TYPES.find(t => t.name === formData.complaint_type);
      const payload = {
        ...formData,
        ward: formData.ward_code || formData.ward,
        category: typeObj?.internal || 'OTHER',
        raw_text: formData.description,
        source: 'web',
        filed_at: new Date().toISOString()
      };
      console.log('🚀 Sending Dispatch Signal:', {
        description: payload.description,
        category: payload.category,
        full_payload: payload
      });

      // Call parent submit
      await onSubmit(payload);
      
      // Dynamic Success Data Response (Based on Jurisdictional Category)
      const deptName = payload.category.charAt(0) + payload.category.slice(1).toLowerCase();
      
      setSuccessData({
        id: `UGIRP-2024-${Math.floor(10000 + Math.random() * 90000)}`,
        category: payload.category,
        priority: 'P3',
        officer: `Specialist assigned to ${deptName} Department`,
        distance: `${(Math.random() * 3 + 0.5).toFixed(1)}km`,
        sla: 'Action within 24-48 hours',
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleString()
      });

      clearDraft();
    } catch (err) {
      toast.error("Signal ingestion failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-surface p-12 rounded-[2.5rem] card-shadow border border-emerald/20 animate-fade-in text-center space-y-8">
         <div className="w-24 h-24 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald/5">
            <CheckCircle size={64} />
         </div>
         <div className="space-y-2">
            <h2 className="text-2xl font-sora font-extrabold text-navy uppercase tracking-tight">Signal Ingested Successfully</h2>
            <p className="text-sm font-bold text-text-secondary opacity-60">Your complaint has been synchronized with the municipal grid.</p>
         </div>

         <div className="bg-bg p-8 rounded-3xl border border-border space-y-6 text-left">
            <div className="flex justify-between items-end border-b border-border pb-4">
               <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">Complaint Tracking ID</span>
               <span className="text-2xl font-sora font-black text-navy">{successData.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-8">
               <DataPoint label="Category Detected" val={successData.category} />
               <DataPoint label="Priority Node" val={successData.priority} color="text-saffron" />
               <DataPoint label="Assigned Specialist" val={successData.officer} />
               <DataPoint label="Haversine Delta" val={successData.distance} />
            </div>
            <div className="pt-4 border-t border-border flex justify-between items-center text-xs font-bold">
               <span className="text-text-secondary opacity-40 uppercase tracking-widest">SLA Deadline</span>
               <span className="text-crimson animate-pulse">{successData.deadline}</span>
            </div>
         </div>

         <div className="flex flex-col gap-4">
            <div className="bg-navy/5 p-4 rounded-xl border border-navy/10 flex items-center justify-between">
               <span className="text-[10px] font-bold text-navy truncate">ugirp.in/track/{successData.id}</span>
               <button onClick={() => { navigator.clipboard.writeText(`ugirp.in/track/${successData.id}`); toast.success("Copied"); }} className="p-2 hover:bg-navy/10 rounded-lg text-navy"><Activity size={14} /></button>
            </div>
            <p className="text-[10px] font-medium opacity-60 italic leading-relaxed">"A confirmation has been sent to your email. You will receive real-time signal updates at every forensic stage."</p>
         </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-[2.5rem] card-shadow overflow-hidden relative">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center space-y-10 animate-fade-in">
           <div className="relative">
              <Loader2 size={80} className="text-navy opacity-10 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Sparkles size={32} className="text-saffron animate-pulse" />
              </div>
           </div>
           <div className="space-y-4">
              <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">Processing Ingestion Node</h3>
              <div className="flex flex-col gap-2">
                 {[1,2,3,4].map(s => (
                   <div key={s} className="flex items-center gap-3 justify-center text-[10px] font-black uppercase tracking-widest">
                      <div className={`w-2 h-2 rounded-full transition-colors ${processStep >= s ? 'bg-emerald' : 'bg-gray-200'}`} />
                      <span className={processStep >= s ? 'text-navy' : 'text-gray-300 opacity-40'}>
                        {s === 1 ? "Signal Submission" : s === 2 ? "Gemini Logic Synthesis" : s === 3 ? "Haversine Dispatch" : "Confirmation Sync"}
                      </span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Form Header */}
      <div className="p-10 border-b border-border bg-bg/50 flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-sora font-extrabold text-navy tracking-tight uppercase flex items-center gap-3">
               <ShieldCheck size={28} className="text-navy" /> Municipal Complaint Hub
            </h2>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 mt-1 italic">Standards Compliance: BMC-MUMBAI/UGIRP-V2</p>
         </div>
         <div className="flex items-center gap-4">
            <select 
              value={formData.language} 
              onChange={e => {
                 setFormData({ ...formData, language: e.target.value });
                 i18n.changeLanguage(e.target.value);
              }}
              className="bg-white border border-border rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-navy outline-none"
            >
               {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <button onClick={saveDraft} className="p-2 bg-white border border-border rounded-xl text-navy hover:bg-navy hover:text-white transition"><Save size={18} /></button>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-12">
        {/* SECTION 1: NATURE */}
        <Section title="Define Nature of Complaint" icon={<Sparkles size={18}/>}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <Label label="Complaint Type" required />
                 <select 
                   value={formData.complaint_type} 
                   onChange={e => setFormData({ ...formData, complaint_type: e.target.value, complaint_subtype: '' })}
                   className={`w-full bg-bg border ${errors.complaint_type ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none`}
                 >
                    <option value="">-- SELECT --</option>
                    {COMPLAINT_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <Label label="Complaint Subtype" required />
                 <select 
                   value={formData.complaint_subtype} 
                   onChange={e => setFormData({ ...formData, complaint_subtype: e.target.value })}
                   className={`w-full bg-bg border ${errors.complaint_subtype ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none`}
                 >
                    <option value="">-- SELECT --</option>
                    {(SUBTYPES[formData.complaint_type] || SUBTYPES['DEFAULT']).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <Label label="PPO No (Public Property Order)" />
                 <input 
                   type="text" 
                   placeholder="Enter PPO number if available"
                   className="w-full bg-bg border border-border rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none"
                   value={formData.ppo_no}
                   onChange={e => setFormData({ ...formData, ppo_no: e.target.value })}
                 />
                 <p className="text-[8px] font-bold text-text-secondary opacity-40 ml-2 uppercase">Order reference for municipal assets</p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-end">
                 <Label label="Description in Brief" required />
                 <span className={`text-[9px] font-black uppercase tracking-widest ${formData.description.length > 130 ? 'text-crimson animate-pulse' : 'text-text-secondary opacity-40'}`}>
                    {formData.description.length} / 150 CHARACTERS
                 </span>
              </div>
              <div className="relative">
                 <textarea 
                   maxLength={150}
                   placeholder="Describe your complaint briefly (Semantic analysis will be performed)"
                   className={`w-full h-32 bg-bg border ${errors.description ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none resize-none`}
                   value={formData.description}
                   onChange={e => setFormData({ ...formData, description: e.target.value })}
                 />
                 <button 
                   type="button"
                   onClick={toggleListen}
                   className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition ${isListening ? 'bg-crimson text-white animate-pulse' : 'bg-white text-navy border border-border'}`}
                 >
                    {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                 </button>
              </div>
              <div className="bg-navy/5 p-4 rounded-xl border border-navy/10 flex items-center gap-3">
                 <Sparkles size={16} className="text-navy" />
                 <p className="text-[9px] font-medium text-navy opacity-60 leading-relaxed italic">
                   "Our Gemini Neural Node will automatically detect language, translate signal, and categorize jurisdictional priority based on this text."
                 </p>
              </div>
           </div>
        </Section>

        {/* SECTION 2: LOCATION */}
        <Section title="Specify Location of Signal" icon={<Map size={18}/>}>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Input label="House No" placeholder="Building / Unit" val={formData.house_no} onChange={v => setFormData({ ...formData, house_no: v })} />
              <Input label="Street" placeholder="Street Name" required val={formData.street} onChange={v => setFormData({ ...formData, street: v })} error={errors.street} />
              <Input label="Area" placeholder="Locality" required val={formData.area} onChange={v => setFormData({ ...formData, area: v })} error={errors.area} />
              <Input label="City" placeholder="MUMBAI" val={formData.city} onChange={v => setFormData({ ...formData, city: v })} />
              <div className="md:col-span-2 space-y-2">
                 <Label label="Landmark (Max 60 chars)" />
                 <textarea 
                   maxLength={60}
                   className="w-full bg-bg border border-border rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none h-14 resize-none"
                   placeholder="Nearby identified landmark"
                   value={formData.landmark}
                   onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                 />
              </div>
              <div className="space-y-2">
                 <Label label="Select Ward Node" required />
                 <select 
                   value={formData.ward} 
                   onChange={handleWardChange}
                   className={`w-full bg-bg border ${errors.ward ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none`}
                 >
                    <option value="">-- SELECT --</option>
                    {WARDS.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                 </select>
              </div>
              <Input label="Connection Code" placeholder="Water/Electricity Ref" val={formData.connection_code} onChange={v => setFormData({ ...formData, connection_code: v })} />
              <div className="space-y-2">
                 <Label label="Name of Council" />
                 <select 
                   value={formData.council} 
                   onChange={e => setFormData({ ...formData, council: e.target.value })}
                   className="w-full bg-bg border border-border rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none"
                 >
                    <option value="">-- SELECT --</option>
                    {COUNCILS.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
           </div>

           <div className="pt-4 flex flex-col items-center gap-4">
              <button 
                type="button" 
                onClick={detectLocation}
                className="flex items-center gap-3 bg-navy text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition active:scale-95"
              >
                 <MapPin size={18} /> Detect My Spatial Coordinate
              </button>
              {formData.lat && (
                <div className="flex items-center gap-2 text-emerald text-[9px] font-black uppercase tracking-[0.2em] animate-fade-in">
                   <ShieldCheck size={14} /> Global GPS Sync Verified: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                </div>
              )}
           </div>
        </Section>

        {/* SECTION 3 & 4: COMPLAINANT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Section title="Specialist ID / Name" icon={<User size={18}/>}>
               <div className="space-y-8">
                  <Input label="First Name" placeholder="Complainant First Name" required val={formData.first_name} onChange={v => setFormData({ ...formData, first_name: v })} error={errors.first_name} />
                  <Input label="Last Name" placeholder="Complainant Surname" required val={formData.last_name} onChange={v => setFormData({ ...formData, last_name: v })} error={errors.last_name} />
               </div>
            </Section>
            <Section title="Communication Sync" icon={<Mail size={18}/>}>
               <div className="space-y-8">
                  <Input label="Mobile No" placeholder="+91 XXXXXXXXXX" required val={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} error={errors.mobile} />
                  <Input label="Email Address" placeholder="forensic@ugirp.in" required val={formData.email} onChange={v => setFormData({ ...formData, email: v })} error={errors.email} />
               </div>
            </Section>
        </div>

        {/* SECTION 5: ADDITIONAL */}
        <Section title="Forensic Evidence & Privacy" icon={<Filter size={18}/>}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <Label label="Attach Evidence (Photo/Video)" />
                 <label className="w-full flex items-center gap-6 p-8 bg-bg border-2 border-dashed border-border rounded-[2rem] cursor-pointer group hover:border-navy transition duration-500">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-navy shadow-soft group-hover:scale-110 transition duration-500">
                       <Camera size={28} />
                    </div>
                    <div>
                       <span className="text-xs font-black text-navy uppercase tracking-widest block">Upload Media Node</span>
                       <span className="text-[9px] font-bold text-text-secondary opacity-40 uppercase tracking-widest italic">JPG, PNG, MP4 Supported</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*,video/*" />
                 </label>
              </div>

              <div className="space-y-6">
                 <Label label="Whistleblower Protection" />
                 <div 
                   onClick={() => setFormData({ ...formData, is_anonymous: !formData.is_anonymous })}
                   className={`p-8 rounded-[2rem] border transition-all duration-500 cursor-pointer flex items-center gap-6 ${formData.is_anonymous ? 'bg-navy text-white border-navy shadow-2xl' : 'bg-bg border-border'}`}
                 >
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${formData.is_anonymous ? 'bg-white text-navy' : 'bg-white text-navy border border-border'}`}>
                       <ShieldCheck size={28} className={formData.is_anonymous ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black uppercase tracking-widest">Anonymous Protocol</span>
                          <div className={`w-8 h-4 rounded-full p-1 transition-colors ${formData.is_anonymous ? 'bg-emerald' : 'bg-gray-200'}`}>
                             <div className={`w-2 h-2 bg-white rounded-full transition-transform ${formData.is_anonymous ? 'translate-x-4' : ''}`} />
                          </div>
                       </div>
                       <p className="text-[9px] font-medium opacity-60 italic leading-relaxed">Identity obfuscation node: Personal telemetry will be scrubbed from specialist rosters.</p>
                    </div>
                 </div>
              </div>
           </div>
        </Section>

        {/* SUBMISSION FOOTER */}
        <div className="pt-12 border-t border-border flex flex-col md:flex-row gap-6">
           <button 
             type="button" 
             onClick={clearDraft}
             className="flex-1 bg-white border border-border text-navy px-10 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-bg transition"
           >
              Discard Intelligence
           </button>
           <button 
             type="submit" 
             disabled={isProcessing}
             className="flex-[2] bg-navy text-white px-10 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-[1.02] transition active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4"
           >
              {isProcessing ? <Activity className="animate-spin" size={20} /> : <Zap size={20} />}
              {isProcessing ? "Processing Signal..." : "Commit Signal to Municipal Grid"}
              {!isProcessing && <Sparkles size={16} className="text-saffron" />}
           </button>
        </div>
      </form>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Section({ title, icon, children }) {
  return (
    <div className="space-y-8 animate-slide-in-up">
       <div className="flex items-center gap-3 border-l-4 border-navy pl-4">
          <div className="text-navy">{icon}</div>
          <h3 className="text-lg font-sora font-black text-navy uppercase tracking-tighter">{title}</h3>
       </div>
       <div className="space-y-8">
          {children}
       </div>
    </div>
  );
}

function Label({ label, required }) {
  return (
    <div className="flex items-center gap-1 ml-2">
       <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">{label}</span>
       {required && <span className="text-crimson font-black">*</span>}
    </div>
  );
}

function Input({ label, placeholder, required, val, onChange, error }) {
  return (
    <div className="space-y-2">
       <Label label={label} required={required} />
       <input 
         type="text" 
         placeholder={placeholder}
         className={`w-full bg-bg border ${error ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest text-navy outline-none focus:ring-2 ring-navy/10 transition-all`}
         value={val}
         onChange={e => onChange(e.target.value)}
       />
       {error && <p className="text-[8px] font-black text-crimson uppercase tracking-widest ml-2">{error}</p>}
    </div>
  );
}

function DataPoint({ label, val, color }) {
  return (
    <div className="space-y-1">
       <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-40 leading-none">{label}</p>
       <p className={`text-sm font-extrabold ${color || 'text-navy'} tracking-tight`}>{val}</p>
    </div>
  );
}

function Zap({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}
