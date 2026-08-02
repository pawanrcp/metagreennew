import React, { useState } from 'react';
import { 
  Map, 
  MapPin, 
  Camera, 
  Video, 
  Sun, 
  Compass, 
  Home, 
  TreePine, 
  Zap, 
  FileText,
  Upload,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export default function SiteSurvey() {
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState({
    gpsLocation: '',
    roofType: 'Flat',
    roofArea: '',
    tiltAngle: '',
    shadeAnalysis: 'Minimal',
    compassDirection: 'South',
    nearbyBuildings: 'None',
    treeObstruction: 'None',
    electricalPanelType: 'Single Phase',
    meterNumber: ''
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = (Array.from(e.target.files) as File[]).map(f => f.name);
      setImages([...images, ...newImages]);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newVideos = (Array.from(e.target.files) as File[]).map(f => f.name);
      setVideos([...videos, ...newVideos]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'siteSurveys'), {
        ...surveyData,
        images,
        videos,
        createdAt: serverTimestamp()
      });
      alert('Site survey data submitted successfully!');
      setSurveyData({
        gpsLocation: '',
        roofType: 'Flat',
        roofArea: '',
        tiltAngle: '',
        shadeAnalysis: 'Minimal',
        compassDirection: 'South',
        nearbyBuildings: 'None',
        treeObstruction: 'None',
        electricalPanelType: 'Single Phase',
        meterNumber: ''
      });
      setImages([]);
      setVideos([]);
    } catch (err) {
      console.error('Error submitting site survey:', err);
      alert('Failed to submit site survey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Site Survey App</h1>
          <p className="text-slate-500 font-medium mt-1">Engineer field data collection</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
            
            {/* Location & Property */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> Location & Property
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GPS Coordinates</label>
                  <input 
                    type="text" 
                    value={surveyData.gpsLocation}
                    onChange={e => setSurveyData({...surveyData, gpsLocation: e.target.value})}
                    placeholder="Auto-detect or enter lat, long"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roof Type</label>
                  <select 
                    value={surveyData.roofType}
                    onChange={e => setSurveyData({...surveyData, roofType: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option>Flat Concrete</option>
                    <option>Sloped Tile</option>
                    <option>Tin Sheet</option>
                    <option>Asbestos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Usable Roof Area (sq. ft)</label>
                  <input 
                    type="number" 
                    value={surveyData.roofArea}
                    onChange={e => setSurveyData({...surveyData, roofArea: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Compass Direction</label>
                  <select 
                    value={surveyData.compassDirection}
                    onChange={e => setSurveyData({...surveyData, compassDirection: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option>South (Optimal)</option>
                    <option>East</option>
                    <option>West</option>
                    <option>North (Not Recommended)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sun className="w-5 h-5 text-amber-500" /> Technical Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roof Tilt Angle (°)</label>
                  <input 
                    type="number" 
                    value={surveyData.tiltAngle}
                    onChange={e => setSurveyData({...surveyData, tiltAngle: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shade Analysis</label>
                  <select 
                    value={surveyData.shadeAnalysis}
                    onChange={e => setSurveyData({...surveyData, shadeAnalysis: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option>Minimal (0-10%)</option>
                    <option>Moderate (10-30%)</option>
                    <option>Heavy (&gt;30%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Home className="w-4 h-4"/> Nearby Buildings</label>
                  <input 
                    type="text" 
                    value={surveyData.nearbyBuildings}
                    onChange={e => setSurveyData({...surveyData, nearbyBuildings: e.target.value})}
                    placeholder="Height and distance"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><TreePine className="w-4 h-4"/> Tree Obstruction</label>
                  <input 
                    type="text" 
                    value={surveyData.treeObstruction}
                    onChange={e => setSurveyData({...surveyData, treeObstruction: e.target.value})}
                    placeholder="Describe any trees blocking sun"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* Electricals */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Zap className="w-5 h-5 text-blue-500" /> Electrical Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Existing Panel Type</label>
                  <select 
                    value={surveyData.electricalPanelType}
                    onChange={e => setSurveyData({...surveyData, electricalPanelType: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white" 
                  >
                    <option>Single Phase (230V)</option>
                    <option>Three Phase (400V)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meter Number / Account</label>
                  <input 
                    type="text" 
                    value={surveyData.meterNumber}
                    onChange={e => setSurveyData({...surveyData, meterNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none" 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} 
              {isSubmitting ? 'Submitting...' : 'Submit Survey Report'}
            </button>
          </form>
        </div>

        {/* Media Uploads sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Camera className="w-5 h-5 text-emerald-600" /> Photos
            </h3>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Click to upload photos</p>
                </div>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {images.length > 0 && (
                <ul className="text-sm text-slate-600 space-y-1">
                  {images.map((img, i) => (
                    <li key={i} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500"/> {img}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Video className="w-5 h-5 text-emerald-600" /> Videos
            </h3>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Click to upload videos</p>
                </div>
                <input type="file" multiple accept="video/*" className="hidden" onChange={handleVideoUpload} />
              </label>
              {videos.length > 0 && (
                <ul className="text-sm text-slate-600 space-y-1">
                  {videos.map((vid, i) => (
                    <li key={i} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500"/> {vid}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
