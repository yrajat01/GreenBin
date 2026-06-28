import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const ReportIssue = () => {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [binCode, setBinCode] = useState('GB-042');
  const [validatedBin, setValidatedBin] = useState(null);
  
  // Issue details
  const [activeCategory, setActiveCategory] = useState('Foul Smell');
  const [notes, setNotes] = useState('');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [ticketId, setTicketId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate Bin Code
  const handleValidateBin = async () => {
    setError('');
    if (!binCode) {
      setError('Please enter a Bin Code');
      return;
    }
    setLoading(true);
    try {
      const data = await api.get(`/api/bins/${binCode.toUpperCase().trim()}`);
      setValidatedBin(data);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Bin code not found in database. Try GB-001, GB-003, or GB-042.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
  };

  const handleSubmitReport = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/reports', {
        binId: validatedBin.binId,
        issueType: activeCategory,
        description: notes,
        photoUrl: photoUploaded ? 'https://example.com/reported-waste.jpg' : ''
      });
      
      setTicketId(res.report.reportId);
      refreshProfile(); // Refresh citizen points
      setStep(4); // Success state
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex text-left">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col h-screen left-0 w-64 bg-surface-container-low border-r border-outline-variant py-md px-sm gap-xs shrink-0">
        <Link to="/" className="flex flex-col gap-base mb-lg px-sm hover:opacity-85 transition-opacity">
          <span className="font-title-lg text-title-lg font-black text-primary">Smart Waste</span>
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Operator Portal</span>
        </Link>
        <nav className="flex flex-col gap-xs flex-1">
          <Link className="flex items-center gap-sm text-on-surface-variant px-sm py-xs hover:bg-surface-variant transition-all rounded-xl" to="/citizen">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </Link>
          <Link className="flex items-center gap-sm bg-primary-container text-on-primary-container rounded-xl px-sm py-xs border-l-4 border-primary transition-all translate-x-1 font-semibold" to="/report">
            <span className="material-symbols-outlined">report_problem</span>
            <span className="font-label-md text-label-md">Report Issue</span>
          </Link>
          <Link className="flex items-center gap-sm text-on-surface-variant px-sm py-xs hover:bg-surface-variant transition-all rounded-xl" to="/leaderboard">
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="font-label-md text-label-md">Leaderboard</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-sm text-on-surface-variant px-sm py-xs hover:bg-surface-variant transition-all rounded-xl mt-xl text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 overflow-y-auto px-margin-mobile md:px-margin-desktop py-md">
        
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center mb-md">
          <Link to="/">
            <div className="font-headline-md text-headline-md font-bold text-primary hover:opacity-85 transition-opacity">GreenBin</div>
          </Link>
          <button className="p-base text-on-surface" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
          </button>
        </header>

        {/* Reporting Flow Header */}
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Submit Field Report</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Identify and document waste management issues in real-time.</p>
        </div>

        {/* Multi-Step Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter max-w-6xl">
          
          {/* Main Reporting Card */}
          <section className="lg:col-span-8 flex flex-col gap-gutter">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-md shadow-sm relative overflow-hidden">
              
              {/* Progress Tracker */}
              {step < 4 && (
                <div className="flex items-center gap-sm mb-lg">
                  <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary' : 'bg-surface-variant'}`}></div>
                  <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary' : 'bg-surface-variant'}`}></div>
                  <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-primary' : 'bg-surface-variant'}`}></div>
                </div>
              )}

              {error && (
                <div className="mb-md p-sm bg-error-container text-on-error-container rounded-xl text-body-md border border-error/20">
                  {error}
                </div>
              )}

              {/* Step 1: Find Your Bin */}
              {step === 1 && (
                <div className="step-transition">
                  <div className="flex items-center gap-xs mb-md">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Find Your Bin</h2>
                  </div>
                  
                  <div className="space-y-md">
                    <div className="relative">
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Bin Serial Code</label>
                      <div className="flex gap-xs">
                        <div className="relative flex-1">
                          <input 
                            className="w-full bg-surface border border-outline-variant rounded-xl px-md py-sm focus:ring-2 focus:ring-primary outline-none transition-all font-mono-data" 
                            placeholder="Enter ID (e.g. GB-042)" 
                            type="text" 
                            value={binCode}
                            onChange={(e) => setBinCode(e.target.value)}
                          />
                          <button 
                            onClick={() => { setBinCode('GB-042'); }} 
                            title="Mock Scanner"
                            className="absolute right-xs top-1/2 -translate-y-1/2 p-xs text-primary-container hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined">qr_code_scanner</span>
                          </button>
                        </div>
                        <button 
                          onClick={handleValidateBin}
                          className="bg-secondary-container text-on-secondary-container px-md py-sm rounded-xl font-label-md text-label-md flex items-center gap-xs hover:bg-secondary-container/80 transition-colors"
                        >
                          <span className="material-symbols-outlined">search</span>
                          Verify Asset
                        </button>
                      </div>
                    </div>

                    <div className="bg-surface p-sm rounded-xl border border-dashed border-outline flex items-center justify-between">
                      <div>
                        <p className="font-label-md text-label-md text-on-surface-variant">Default Demonstration Code</p>
                        <p className="font-title-lg text-title-lg text-primary font-bold">GB-042</p>
                        <p className="font-body-md text-body-md text-on-surface">Press search or edit code to scan nearby assets.</p>
                      </div>
                      <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-3xl">delete</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-md border-t border-outline-variant/30">
                      <button 
                        onClick={handleValidateBin}
                        disabled={loading}
                        className="bg-primary text-on-primary px-xl py-sm rounded-full font-label-md text-label-md hover:scale-95 active:scale-90 transition-transform"
                      >
                        {loading ? 'Verifying...' : 'Next Step'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Describe Issue */}
              {step === 2 && (
                <div className="step-transition">
                  <div className="flex items-center gap-xs mb-md">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                    <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Describe the Issue</h2>
                  </div>
                  
                  <div className="space-y-md">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-sm text-left">Issue Category</label>
                      <div className="flex flex-wrap gap-xs">
                        {['Foul Smell', 'Overflow', 'Damage/Vandalism', 'Missed Collection', 'Other'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => handleCategorySelect(cat)}
                            className={`px-md py-xs rounded-full border border-outline font-label-md text-label-md transition-all ${
                              activeCategory === cat 
                                ? 'bg-primary-container text-on-primary-container border-primary font-semibold' 
                                : 'text-on-surface-variant hover:bg-surface-variant'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Photo Evidence</label>
                      <div 
                        onClick={() => setPhotoUploaded(!photoUploaded)}
                        className={`border-2 border-dashed rounded-xl p-lg flex flex-col items-center justify-center gap-xs transition-colors cursor-pointer ${
                          photoUploaded 
                            ? 'border-secondary bg-secondary/5' 
                            : 'border-outline-variant bg-surface/50 hover:bg-surface'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-4xl ${photoUploaded ? 'text-secondary' : 'text-primary'}`}>
                          {photoUploaded ? 'check_circle' : 'cloud_upload'}
                        </span>
                        <p className="font-body-md text-body-md text-on-surface">
                          {photoUploaded ? 'Photo added: waste-image.jpg' : 'Drag & drop or browse'}
                        </p>
                        <p className="text-[10px] text-outline">JPEG or PNG up to 10MB (Click to simulate upload)</p>
                      </div>
                    </div>

                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Additional Details</label>
                      <textarea 
                        className="w-full bg-surface border border-outline-variant rounded-xl px-md py-sm focus:ring-2 focus:ring-primary outline-none transition-all h-24 font-body-md" 
                        placeholder="Briefly describe the situation..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="flex justify-between pt-md border-t border-outline-variant/30">
                      <button className="text-primary font-label-md text-label-md px-md py-sm rounded-full hover:bg-primary/5 transition-colors" onClick={() => setStep(1)}>Back</button>
                      <button className="bg-primary text-on-primary px-xl py-sm rounded-full font-label-md text-label-md hover:scale-95 active:scale-90 transition-transform" onClick={() => setStep(3)}>
                        Next Step
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm & Submit */}
              {step === 3 && (
                <div className="step-transition">
                  <div className="flex items-center gap-xs mb-md">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                    <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Confirm &amp; Submit</h2>
                  </div>
                  
                  <div className="space-y-md">
                    <div className="bg-surface-container rounded-xl p-md space-y-sm">
                      <div className="flex justify-between items-center pb-xs border-b border-outline-variant">
                        <span className="text-outline text-[12px] uppercase font-bold tracking-widest">Report Summary</span>
                        <span className="text-primary text-[12px] font-bold">Review Mode</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Asset Code</span>
                        <span className="text-on-surface font-bold">{validatedBin?.binId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Category</span>
                        <span className="text-on-surface font-bold">{activeCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Location</span>
                        <span className="text-on-surface">{validatedBin?.location.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Evidence</span>
                        <span className="text-on-surface font-bold">{photoUploaded ? '1 Attachment' : 'No photo uploaded'}</span>
                      </div>
                    </div>
                    
                    <p className="text-body-md text-on-surface-variant text-center px-lg">
                      By submitting, you confirm the accuracy of this report. Staff will be dispatched to resolve it.
                    </p>
                    
                    <div className="flex flex-col gap-sm pt-md border-t border-outline-variant/30">
                      <button 
                        onClick={handleSubmitReport}
                        disabled={loading}
                        className="w-full bg-primary text-on-primary py-md rounded-full font-label-md text-title-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-sm"
                      >
                        {loading ? 'Submitting...' : 'Submit Report'}
                        <span className="material-symbols-outlined">send</span>
                      </button>
                      <button className="text-outline font-label-md text-label-md text-center py-xs hover:underline" onClick={() => setStep(2)}>Go back and edit</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {step === 4 && (
                <div className="step-transition text-center py-lg">
                  <div className="w-24 h-24 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-md pulse-marker">
                    <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-xs font-bold">Report Submitted!</h2>
                  <p className="text-on-surface-variant mb-md">Ticket ID: <span className="font-mono-data text-mono-data text-primary font-bold">{ticketId}</span></p>
                  
                  <div className="bg-secondary-container/50 text-on-secondary-container px-md py-sm rounded-xl inline-flex items-center gap-xs font-bold mb-lg border border-secondary/20">
                    <span className="material-symbols-outlined">eco</span>
                    +10 points added 🌿
                  </div>
                  
                  <div className="flex flex-col gap-sm max-w-xs mx-auto">
                    <Link className="bg-on-surface text-surface py-sm rounded-full font-label-md text-label-md flex items-center justify-center gap-xs hover:opacity-90 transition-opacity" to="/citizen">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      Track Ticket Status
                    </Link>
                    <button 
                      className="text-primary font-label-md text-label-md py-sm hover:underline" 
                      onClick={() => {
                        setStep(1);
                        setValidatedBin(null);
                        setNotes('');
                        setPhotoUploaded(false);
                      }}
                    >
                      Submit Another Issue
                    </button>
                  </div>
                </div>
              )}

            </div>
            
            {/* Operator Tip Banner */}
            <div className="bg-tertiary-fixed text-on-tertiary-fixed p-md rounded-xl flex gap-md items-center text-left">
              <span className="material-symbols-outlined text-4xl opacity-70">info</span>
              <div>
                <p className="font-title-lg text-title-lg font-bold">Operator Tip</p>
                <p className="text-body-md opacity-90">Accurate reports help our AI optimize collection routes, reducing carbon emissions by up to 14%.</p>
              </div>
            </div>
          </section>

          {/* Right Side Panel */}
          <aside className="lg:col-span-4 flex flex-col gap-gutter">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm h-full text-left">
              
              {/* Static mini map wrapper */}
              <div className="h-64 relative bg-surface-container-highest flex items-center justify-center overflow-hidden">
                <img src="/stitch_assets/landscape.png" className="w-full h-full object-cover opacity-60" alt="Hub Map View" />
                <div className="absolute inset-0 bg-primary/10"></div>
                <div className="absolute w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg pulse-marker flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                </div>
              </div>
              
              <div className="p-md">
                <div className="flex items-center justify-between mb-sm">
                  <span className="bg-secondary text-on-secondary px-xs py-[2px] rounded text-[10px] font-bold uppercase tracking-widest">Active Zone</span>
                  <span className="text-outline text-[12px]">Updated just now</span>
                </div>
                <h3 className="font-title-lg text-title-lg font-bold mb-xs">
                  {validatedBin ? validatedBin.location.name : `${user?.zone || 'Zone-A'} Central Hub`}
                </h3>
                <p className="text-on-surface-variant text-body-md mb-md">
                  {validatedBin ? `Coordinates: ${validatedBin.location.lat.toFixed(4)}, ${validatedBin.location.lng.toFixed(4)}` : 'Select or scan a bin code to see geolocation.'}
                </p>
                
                <div className="grid grid-cols-2 gap-sm">
                  <div className="bg-surface p-sm rounded-lg border border-outline-variant/20">
                    <p className="text-outline text-[10px] uppercase font-bold">Fill Level</p>
                    <p className="text-headline-md text-on-surface font-bold">
                      {validatedBin ? `${validatedBin.fillLevel}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-surface p-sm rounded-lg border border-outline-variant/20">
                    <p className="text-outline text-[10px] uppercase font-bold">Zone</p>
                    <p className="text-headline-md text-on-surface font-bold">
                      {validatedBin ? validatedBin.zone : (user?.zone || 'Zone-A')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Local Conditions */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md text-left flex justify-between items-center shadow-sm">
              <div>
                <p className="text-outline text-label-md uppercase font-bold">Local Conditions</p>
                <p className="text-title-lg font-bold">72°F Sunny</p>
                <p className="text-xs text-on-surface-variant mt-1">High odor risk due to warm climate.</p>
              </div>
              <span className="material-symbols-outlined text-4xl text-primary">sunny</span>
            </div>
          </aside>

        </div>
      </main>

    </div>
  );
};

export default ReportIssue;
