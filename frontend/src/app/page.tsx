'use client';

import { useState } from 'react';

const themes = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
  'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
  'night', 'coffee', 'winter', 'dim', 'nord', 'sunset', 'caramellatte',
  'abyss', 'silk'
];

export default function Home() {
  const [currentTheme, setCurrentTheme] = useState('light');

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">daisyUI Themes</a>
        </div>
        <div className="flex-none">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              Theme: {currentTheme}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-4 w-4 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
              {themes.map((theme) => (
                <li key={theme}>
                  <a onClick={() => changeTheme(theme)} className={currentTheme === theme ? 'active' : ''}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-8">
        <div className="hero bg-base-100 rounded-box mb-8">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">All DaisyUI Themes</h1>
              <p className="py-6">
                Explore all {themes.length} available themes in DaisyUI. Use the dropdown above to switch between themes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Primary Button</h2>
              <button className="btn btn-primary">Primary</button>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Secondary Button</h2>
              <button className="btn btn-secondary">Secondary</button>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Accent Button</h2>
              <button className="btn btn-accent">Accent</button>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Alert Components</h2>
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Info alert</span>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Progress Bar</h2>
              <progress className="progress progress-primary w-56" value="70" max="100"></progress>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Badge</h2>
              <div className="badge badge-primary">Primary</div>
              <div className="badge badge-secondary">Secondary</div>
              <div className="badge badge-accent">Accent</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
