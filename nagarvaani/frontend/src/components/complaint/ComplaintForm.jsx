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
  { labelKey: 'DRAINAGE', name: 'Drainage', internal: 'DRAINAGE' },
  { labelKey: 'STORM_WATER_DRAIN', name: 'Storm water drain', internal: 'DRAINAGE' },
  { labelKey: 'WATER_SUPPLY', name: 'Water supply', internal: 'WATER' },
  { labelKey: 'ROADS_AND_TRAFFIC', name: 'Roads and traffic', internal: 'ROADS' },
  { labelKey: 'SOLID_WASTE_MANAGEMENT', name: 'Solid Waste Management', internal: 'GARBAGE' },
  { labelKey: 'HEALTH', name: 'Health', internal: 'HEALTH' },
  { labelKey: 'GARDEN_TREE', name: 'Garden & Tree', internal: 'PARKS' },
  { labelKey: 'BUILDINGS', name: 'Buildings', internal: 'BUILDINGS' },
  { labelKey: 'PEST_CONTROL', name: 'Pest control', internal: 'PEST' },
  { labelKey: 'ENCROACHMENT', name: 'Encroachment', internal: 'ENCROACHMENT' },
  { labelKey: 'ELECTRICITY', name: 'Electricity', internal: 'ELECTRICITY' },
  { labelKey: 'LICENCE', name: 'Licence', internal: 'OTHER' },
  { labelKey: 'FACTORIES', name: 'Factories', internal: 'OTHER' },
  { labelKey: 'SCHOOL', name: 'School', internal: 'OTHER' }
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

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'mr', name: 'Marathi' }
];

// --- MAIN COMPONENT ---

export default function HighFidelityComplaintForm({ onSubmit, isSubmitting: parentSubmitting }) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    complaint_type: '',
    complaint_subtype: '',
    ppo_no: '',
    description: '',
    house_no: '',
    street: '',
    area: '',
    city: 'Mumbai',
    landmark: '',
    ward: '',
    lat: null,
    lng: null,
    connection_code: '',
    council: '',
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    is_anonymous: false,
    media: null,
    mediaPreview: null,
    language: 'en'
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [successData, setSuccessData] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN';

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

    const draft = localStorage.getItem('ugirp_complaint_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) { }
    }
  }, []);

  const saveDraft = () => {
    localStorage.setItem('ugirp_complaint_draft', JSON.stringify(formData));
    toast.success(t("DraftSaved"), { duration: 1000 });
  };

  const clearDraft = () => {
    localStorage.removeItem('ugirp_complaint_draft');
    toast.success(t("DraftCleared"));
  };

  const aiExtract = async (transcript) => {
    const loadId = toast.loading(t("AIAnalyzing"));
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
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

      toast.success(t("AIExtracted"), { id: loadId });
    } catch (err) {
      console.error("AI extraction failed", err);
      toast.error(t("AIExtractionFailed"), { id: loadId });
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

      recognition.onend = () => setIsListening(false);

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
    if (!navigator.geolocation) return toast.error(t("GPSSignalUnavailable"));

    toast.loading(t("TriangulatingGPS"), { id: 'gps' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
        toast.success(t("LocationLocked"), { id: 'gps' });
      },
      () => toast.error(t("SatelliteLinkFailed"), { id: 'gps' })
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
    if (!formData.complaint_type) newErrors.complaint_type = t("ErrComplaintType");
    if (!formData.complaint_subtype) newErrors.complaint_subtype = t("ErrSubtype");
    if (formData.description.trim().split(/\s+/).length < 1) newErrors.description = t("ErrDescriptionMinWords");
    if (!formData.street) newErrors.street = t("ErrStreet");
    if (!formData.area) newErrors.area = t("ErrArea");
    if (!formData.ward) newErrors.ward = t("ErrWard");
    if (!formData.first_name) newErrors.first_name = t("ErrFirstName");
    if (!formData.last_name) newErrors.last_name = t("ErrLastName");
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) newErrors.mobile = t("ErrMobile");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t("ErrEmail");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(t("ErrCorrectForm"));
      return;
    }

    setIsProcessing(true);
    setProcessStep(4);

    try {
      const typeObj = COMPLAINT_TYPES.find(tOption => tOption.name === formData.complaint_type);

      const fd = new FormData();
      const fields = {
        ...formData,
        ward: formData.ward_code || formData.ward,
        category: typeObj?.internal || 'OTHER',
        raw_text: formData.description,
        source: 'web',
        filed_at: new Date().toISOString()
      };

      Object.entries(fields).forEach(([key, val]) => {
        if (key !== 'media' && key !== 'mediaPreview' && val !== null && val !== undefined) {
          fd.append(key, String(val));
        }
      });

      if (formData.media) {
        fd.append('photo', formData.media);
      }

      await onSubmit(fd);
      clearDraft();
    } catch (err) {
      toast.error(t("SignalIngestionFailed"));
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
          <h2 className="text-2xl font-sora font-extrabold text-navy uppercase tracking-tight">{t('SignalIngestedSuccessfully')}</h2>
          <p className="text-sm font-bold text-text-secondary opacity-60">{t('SynchronizedMunicipalGrid')}</p>
        </div>

        <div className="bg-bg p-8 rounded-3xl border border-border space-y-6 text-left">
          <div className="flex justify-between items-end border-b border-border pb-4">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">{t('ComplaintTrackingID')}</span>
            <span className="text-2xl font-sora font-black text-navy">{successData.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <DataPoint label={t('CategoryDetected')} val={t(successData.category)} />
            <DataPoint label={t('PriorityNode')} val={successData.priority} color="text-saffron" />
            <DataPoint label={t('AssignedSpecialist')} val={successData.officer} />
            <DataPoint label={t('HaversineDelta')} val={successData.distance} />
          </div>
          <div className="pt-4 border-t border-border flex justify-between items-center text-xs font-bold">
            <span className="text-text-secondary opacity-40 uppercase tracking-widest">{t('SLADeadline')}</span>
            <span className="text-crimson animate-pulse">{successData.deadline}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-navy/5 p-4 rounded-xl border border-navy/10 flex items-center justify-between">
            <span className="text-[10px] font-bold text-navy truncate">ugirp.in/track/{successData.id}</span>
            <button onClick={() => { navigator.clipboard.writeText(`ugirp.in/track/${successData.id}`); toast.success(t('Copied')); }} className="p-2 hover:bg-navy/10 rounded-lg text-navy"><Activity size={14} /></button>
          </div>
          <p className="text-[10px] font-medium opacity-60 italic leading-relaxed">"{t('ConfirmationSentEmail')}"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-[2.5rem] card-shadow overflow-hidden relative">
      {isProcessing && (
        <div className="absolute inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center space-y-10 animate-fade-in">
          <div className="relative">
            <Loader2 size={80} className="text-navy opacity-10 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={32} className="text-saffron animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-sora font-extrabold text-navy uppercase tracking-tighter">{t("ProcessingIngestionNode")}</h3>
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex items-center gap-3 justify-center text-[10px] font-black uppercase tracking-widest">
                  <div className={`w-2 h-2 rounded-full transition-colors ${processStep >= s ? 'bg-emerald' : 'bg-gray-200'}`} />
                  <span className={processStep >= s ? 'text-navy' : 'text-gray-300 opacity-40'}>
                    {s === 1 ? t("ProcessStep1") : s === 2 ? t("ProcessStep2") : s === 3 ? t("ProcessStep3") : t("ProcessStep4")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-10 border-b border-border bg-bg/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-sora font-extrabold text-navy tracking-tight uppercase flex items-center gap-3">
            <ShieldCheck size={28} className="text-navy" /> {t("MunicipalComplaintHub")}
          </h2>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 mt-1 italic">{t("StandardsCompliance")}</p>
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
        <Section title={t("DefineNatureOfComplaint")} icon={<Sparkles size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label label={t("ComplaintType")} required />
              <select
                value={formData.complaint_type}
                onChange={e => setFormData({ ...formData, complaint_type: e.target.value, complaint_subtype: '' })}
                className={`w-full bg-bg border ${errors.complaint_type ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold tracking-widest text-navy outline-none`}
              >
                <option value="">{t("SelectPlaceholder")}</option>
                {COMPLAINT_TYPES.map(tOption => <option key={tOption.name} value={tOption.name}>{t(tOption.labelKey || tOption.name)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label label={t("ComplaintSubtype")} required />
              <select
                value={formData.complaint_subtype}
                onChange={e => setFormData({ ...formData, complaint_subtype: e.target.value })}
                className={`w-full bg-bg border ${errors.complaint_subtype ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold tracking-widest text-navy outline-none`}
              >
                <option value="">{t("SelectPlaceholder")}</option>
                {(SUBTYPES[formData.complaint_type] || SUBTYPES['DEFAULT']).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label label={t("PPONo")} />
              <input
                type="text"
                placeholder={t("EnterPPONo")}
                className="w-full bg-bg border border-border rounded-2xl px-6 py-4 text-xs font-bold tracking-widest text-navy outline-none"
                value={formData.ppo_no}
                onChange={e => setFormData({ ...formData, ppo_no: e.target.value })}
              />
              <p className="text-[8px] font-bold text-text-secondary opacity-40 ml-2 uppercase">{t("OrderReference")}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <Label label={t("DescriptionInBrief")} required />
              <span className={`text-[9px] font-black uppercase tracking-widest ${formData.description.length > 130 ? 'text-crimson animate-pulse' : 'text-text-secondary opacity-40'}`}>
                {formData.description.length} / {t("OutOf150Chars")}
              </span>
            </div>
            <div className="relative">
              <textarea
                maxLength={150}
                placeholder={t("DescribeBriefly")}
                className={`w-full h-32 bg-bg border ${errors.description ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold tracking-widest text-navy outline-none resize-none`}
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
                "{t("GeminiNodeInfo")}"
              </p>
            </div>
          </div>
        </Section>

        <Section title={t("SpecifyLocation")} icon={<Map size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Input label={t("HouseNo")} placeholder={t("BuildingUnit")} val={formData.house_no} onChange={v => setFormData({ ...formData, house_no: v })} />
            <Input label={t("Street")} placeholder={t("StreetName")} required val={formData.street} onChange={v => setFormData({ ...formData, street: v })} error={errors.street} />
            <Input label={t("Area")} placeholder={t("Locality")} required val={formData.area} onChange={v => setFormData({ ...formData, area: v })} error={errors.area} />
            <Input label={t("City")} placeholder={t("City")} val={formData.city} onChange={v => setFormData({ ...formData, city: v })} />
            <div className="md:col-span-2 space-y-2">
              <Label label={t("LandmarkMax60")} />
              <textarea
                maxLength={60}
                className="w-full bg-bg border border-border rounded-2xl px-6 py-4 text-xs font-bold tracking-widest text-navy outline-none h-14 resize-none"
                placeholder={t("NearbyLandmark")}
                value={formData.landmark}
                onChange={e => setFormData({ ...formData, landmark: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label label={t("SelectWardNode")} required />
              <select
                value={formData.ward}
                onChange={handleWardChange}
                className={`w-full bg-bg border ${errors.ward ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold tracking-widest text-navy outline-none`}
              >
                <option value="">{t("SelectPlaceholder")}</option>
                {WARDS.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
              </select>
            </div>
            <Input label={t("ConnectionCode")} placeholder={t("WaterElecRef")} val={formData.connection_code} onChange={v => setFormData({ ...formData, connection_code: v })} />
            <div className="space-y-2">
              <Label label={t("NameOfCouncil")} />
              <select
                value={formData.council}
                onChange={e => setFormData({ ...formData, council: e.target.value })}
                className="w-full bg-bg border border-border rounded-2xl px-6 py-4 text-xs font-bold tracking-widest text-navy outline-none"
              >
                <option value="">{t("SelectPlaceholder")}</option>
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
              <MapPin size={18} /> {t("DetectSpatialCoord")}
            </button>
            {formData.lat && (
              <div className="flex items-center gap-2 text-emerald text-[9px] font-black uppercase tracking-[0.2em] animate-fade-in">
                <ShieldCheck size={14} /> {t("GlobalGPSSyncVerified")}: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
              </div>
            )}
          </div>
        </Section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Section title={t("SpecialistIDName")} icon={<User size={18} />}>
            <div className="space-y-8">
              <Input label={t("FirstName")} placeholder={t("ComplainantFirstName")} required val={formData.first_name} onChange={v => setFormData({ ...formData, first_name: v })} error={errors.first_name} />
              <Input label={t("LastName")} placeholder={t("ComplainantSurname")} required val={formData.last_name} onChange={v => setFormData({ ...formData, last_name: v })} error={errors.last_name} />
            </div>
          </Section>
          <Section title={t("CommunicationSync")} icon={<Mail size={18} />}>
            <div className="space-y-8">
              <Input label={t("MobileNo")} placeholder="+91 XXXXXXXXXX" required val={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} error={errors.mobile} />
              <Input label={t("EmailAddress")} placeholder="forensic@ugirp.in" required val={formData.email} onChange={v => setFormData({ ...formData, email: v })} error={errors.email} />
            </div>
          </Section>
        </div>

        <Section title={t("ForensicEvidencePrivacy")} icon={<Filter size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Label label={t("AttachEvidence")} />
              <label className={`w-full flex items-center gap-6 p-6 bg-bg border-2 border-dashed rounded-[2rem] cursor-pointer group transition duration-500 ${formData.media ? 'border-navy bg-navy/5' : 'border-border hover:border-navy'
                }`}>
                <div className="w-20 h-20 min-w-[80px] rounded-2xl overflow-hidden border border-border bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition duration-500">
                  {formData.mediaPreview
                    ? <img src={formData.mediaPreview} alt="preview" className="w-full h-full object-cover" />
                    : <Camera size={28} className="text-navy" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-navy uppercase tracking-widest block truncate">
                    {formData.media ? formData.media.name : t("UploadMediaNode")}
                  </span>
                  <span className="text-[9px] font-bold text-text-secondary opacity-60 uppercase tracking-widest italic">
                    {formData.media
                      ? `${(formData.media.size / 1024).toFixed(0)} KB · ${formData.media.type}`
                      : t("MediaSupported")}
                  </span>
                  {formData.mediaPreview && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[8px] font-black text-emerald uppercase tracking-widest">
                      <CheckCircle size={10} /> {t("PreviewReadyLabel")}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    if (!file) return;
                    const preview = file.type.startsWith('image/')
                      ? URL.createObjectURL(file)
                      : null;
                    setFormData(prev => ({ ...prev, media: file, mediaPreview: preview }));
                  }}
                />
              </label>
              {formData.media && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    media: null,
                    mediaPreview: prev.mediaPreview ? (URL.revokeObjectURL(prev.mediaPreview), null) : null
                  }))}
                  className="flex items-center gap-1.5 text-[9px] font-black text-crimson uppercase tracking-widest hover:opacity-70 transition ml-1"
                >
                  <X size={10} /> {t("RemoveFileLabel")}
                </button>
              )}
            </div>

            <div className="space-y-6">
              <Label label={t("WhistleblowerProtection")} />
              <div
                onClick={() => setFormData({ ...formData, is_anonymous: !formData.is_anonymous })}
                className={`p-8 rounded-[2rem] border transition-all duration-500 cursor-pointer flex items-center gap-6 ${formData.is_anonymous ? 'bg-navy text-white border-navy shadow-2xl' : 'bg-bg border-border'}`}
              >
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${formData.is_anonymous ? 'bg-white text-navy' : 'bg-white text-navy border border-border'}`}>
                  <ShieldCheck size={28} className={formData.is_anonymous ? 'animate-pulse' : ''} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black uppercase tracking-widest">{t("AnonymousProtocol")}</span>
                    <div className={`w-8 h-4 rounded-full p-1 transition-colors ${formData.is_anonymous ? 'bg-emerald' : 'bg-gray-200'}`}>
                      <div className={`w-2 h-2 bg-white rounded-full transition-transform ${formData.is_anonymous ? 'translate-x-4' : ''}`} />
                    </div>
                  </div>
                  <p className="text-[9px] font-medium opacity-60 italic leading-relaxed">{t("IdentityObfuscationNode")}</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <div className="pt-12 border-t border-border flex flex-col md:flex-row gap-6">
          <button
            type="button"
            onClick={clearDraft}
            className="flex-1 bg-white border border-border text-navy px-10 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-bg transition"
          >
            {t('DiscardIntelligence')}
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="flex-[2] bg-navy text-white px-10 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-[1.02] transition active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4"
          >
            {isProcessing ? <Activity className="animate-spin" size={20} /> : <Zap size={20} />}
            {isProcessing ? t('ProcessingSignal') : t('CommitSignal')}
            {!isProcessing && <Sparkles size={16} className="text-saffron" />}
          </button>
        </div>
      </form>
    </div>
  );
}

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
        className={`w-full bg-bg border ${error ? 'border-crimson' : 'border-border'} rounded-2xl px-6 py-4 text-xs font-bold tracking-widest text-navy outline-none focus:ring-2 ring-navy/10 transition-all`}
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