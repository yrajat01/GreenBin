import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-background text-on-background min-h-screen">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 px-margin-desktop py-base flex justify-between items-center shadow-sm">
        <Link to="/" className="flex items-center gap-xs hover:opacity-90">
          <svg className="h-10 w-10 text-primary" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L4.5 9C4.5 9 3 11.5 3 15C3 18.5 5.5 21 9 21C11.5 21 13.5 19.5 15 17.5C16.5 19.5 18.5 21 21 21C24.5 21 27 18.5 27 15C27 11.5 25.5 9 25.5 9L18 2" />
            <path d="M12 2C12 2 13.5 4.5 13.5 8C13.5 11.5 12 14 12 14" stroke="#4CAF50" />
            <path d="M12 22V14" />
          </svg>
          <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">GreenBin</span>
        </Link>
        <nav className="hidden md:flex items-center gap-lg">
          <a className="font-body-md text-body-md text-primary font-semibold border-b-2 border-primary pb-1" href="#home">Home</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#how-it-works">How It Works</a>
          <Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" to="/login">Login</Link>
        </nav>
        <Link 
          to="/login"
          className="bg-primary text-white px-md py-xs rounded-full font-label-md text-label-md hover:bg-opacity-90 active:scale-95 transition-all"
        >
          Sign In
        </Link>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section id="home" className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('/stitch_assets/landscape.png')" }}>
            <div className="absolute inset-0 hero-gradient"></div>
          </div>
          <div className="container mx-auto px-margin-mobile md:px-margin-desktop relative z-10 grid md:grid-cols-2 gap-xl items-center">
            <div className="max-w-2xl text-left">
              <span className="inline-block bg-secondary-container text-on-secondary-container px-sm py-base rounded-full font-label-md text-label-md mb-md uppercase tracking-wider">
                Future of City Logistics
              </span>
              <h1 className="font-display-lg text-display-lg text-white mb-md leading-[1.1]">
                Smart Waste.<br/>Cleaner Cities.
              </h1>
              <p className="font-body-lg text-body-lg text-primary-fixed mb-lg opacity-90 max-w-xl">
                Real-time bin monitoring, citizen reporting &amp; optimized collection routes — all in one platform designed for sustainable urban ecosystems.
              </p>
              <div className="flex flex-wrap gap-sm">
                <Link 
                  to="/login?role=citizen"
                  className="bg-secondary text-white px-lg py-sm rounded-full font-label-md text-label-md hover:bg-secondary-fixed-dim transition-all shadow-lg active:scale-95 text-center"
                >
                  Citizen Login
                </Link>
                <Link 
                  to="/login?role=admin"
                  className="border-2 border-white text-white px-lg py-sm rounded-full font-label-md text-label-md hover:bg-white hover:text-primary transition-all active:scale-95 text-center"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
            {/* Ambient Pulse Card */}
            <div className="hidden md:block relative h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 bg-secondary/20 rounded-full blur-[100px] animate-pulse"></div>
              </div>
              <div className="absolute top-1/4 right-0 bg-surface/90 backdrop-blur-lg p-md rounded-xl shadow-xl border border-white/20 transition-transform duration-[3000ms]">
                <div className="flex items-center gap-sm">
                  <div className="p-xs bg-primary-container rounded-lg">
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                  </div>
                  <div className="text-left">
                    <p className="text-label-md font-label-md text-on-surface-variant">Carbon Saved</p>
                    <p className="text-title-lg font-title-lg text-primary">12.4 Tons</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="how-it-works" className="py-xl bg-surface">
          <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="mb-lg max-w-3xl text-left">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-xs">Platform Capabilities</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Leveraging IoT and community engagement to revolutionize municipal waste management.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {/* Card 1: Sensors */}
              <div className="bento-card bg-surface-container-low border border-outline-variant/30 p-md rounded-xl flex flex-col justify-between group text-left">
                <div className="mb-lg">
                  <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-on-primary-container text-[28px]">sensors</span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-primary mb-sm">Live Bin Monitoring</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Real-time fill level sensors notify operators the moment a bin requires servicing, preventing overflow before it happens.
                  </p>
                </div>
                <Link to="/login" className="flex items-center gap-xs text-secondary font-semibold cursor-pointer">
                  <span className="text-label-md">Learn more</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              {/* Card 2: Reports */}
              <div className="bento-card bg-surface-container-low border border-outline-variant/30 p-md rounded-xl flex flex-col justify-between group text-left">
                <div className="mb-lg">
                  <div className="w-12 h-12 rounded-xl bg-tertiary-container flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-on-tertiary-container text-[28px]">air</span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-primary mb-sm">Citizen Smell Reports</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Direct feedback loop for residents to report odor issues or damaged bins, automatically geotagged for rapid response.
                  </p>
                </div>
                <Link to="/login?role=citizen" className="flex items-center gap-xs text-secondary font-semibold cursor-pointer">
                  <span className="text-label-md">Open reporter</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              {/* Card 3: Optimization */}
              <div className="bento-card bg-surface-container-low border border-outline-variant/30 p-md rounded-xl flex flex-col justify-between group text-left">
                <div className="mb-lg">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-on-secondary-container text-[28px]">route</span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-primary mb-sm">Smart Route Optimization</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Dynamic routing algorithms reduce fuel consumption by up to 30% by only targeting bins that need collection.
                  </p>
                </div>
                <Link to="/login?role=admin" className="flex items-center gap-xs text-secondary font-semibold cursor-pointer">
                  <span className="text-label-md">View demo</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Map Preview Section */}
        <section className="py-xl bg-surface-container">
          <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid md:grid-cols-5 gap-xl items-center">
              <div className="md:col-span-2 order-2 md:order-1 text-left">
                <h2 className="font-headline-lg text-headline-lg text-primary mb-md leading-tight">Total City Visibility at Your Fingertips</h2>
                <ul className="space-y-md mb-lg">
                  <li className="flex items-start gap-sm">
                    <div className="mt-1 p-xs bg-primary/10 rounded-full">
                      <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div>
                      <p className="font-body-lg font-bold text-on-surface">98% Service Reliability</p>
                      <p className="font-body-md text-body-md text-on-surface-variant">Drastically reduce complaints through predictive maintenance.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-sm">
                    <div className="mt-1 p-xs bg-primary/10 rounded-full">
                      <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div>
                      <p className="font-body-lg font-bold text-on-surface">Geofenced Fleet Alerts</p>
                      <p className="font-body-md text-body-md text-on-surface-variant">Automated alerts when collection vehicles enter critical zones.</p>
                    </div>
                  </li>
                </ul>
                <Link to="/login" className="bg-primary text-white px-lg py-sm rounded-xl font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-all flex items-center justify-center gap-xs w-fit">
                  Request Demo Access
                  <span className="material-symbols-outlined">launch</span>
                </Link>
              </div>
              <div className="md:col-span-3 order-1 md:order-2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-video md:aspect-[4/3] bg-surface-container-high">
                  {/* Decorative map mockup */}
                  <img src="/stitch_assets/landscape.png" className="w-full h-full object-cover opacity-60" alt="Smart City Map Mockup" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent flex items-center justify-center">
                    <div className="bg-white/95 p-md rounded-2xl shadow-xl border border-outline-variant max-w-xs text-left">
                      <div className="flex items-center gap-xs mb-xs">
                        <div className="w-3 h-3 bg-error rounded-full animate-pulse"></div>
                        <span className="text-label-md font-bold text-on-surface">Critical Zone Alert</span>
                      </div>
                      <p className="text-body-md text-on-surface-variant font-semibold">Sector 14: Central Park Entrance</p>
                      <p className="text-[11px] text-outline uppercase mt-xs">Capacity: 94% • Foul Smell</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="bg-primary-container py-lg text-on-primary-container px-margin-mobile md:px-margin-desktop">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <Link to="/" className="flex items-center gap-xs hover:opacity-90">
            <svg className="h-8 w-8 text-white" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L4.5 9C4.5 9 3 11.5 3 15C3 18.5 5.5 21 9 21C11.5 21 13.5 19.5 15 17.5C16.5 19.5 18.5 21 21 21C24.5 21 27 18.5 27 15C27 11.5 25.5 9 25.5 9L18 2" />
              <path d="M12 2C12 2 13.5 4.5 13.5 8C13.5 11.5 12 14 12 14" stroke="#4CAF50" />
              <path d="M12 22V14" />
            </svg>
            <span className="font-title-lg text-title-lg font-bold text-white">GreenBin</span>
          </Link>
          <div className="flex gap-lg font-label-md text-label-md">
            <a className="hover:text-secondary-fixed transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-secondary-fixed transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-secondary-fixed transition-colors" href="#">Contact Support</a>
          </div>
          <p className="font-body-md text-body-md opacity-60">© 2026 GreenBin Technology. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
