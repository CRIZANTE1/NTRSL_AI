import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, Calendar, Info } from 'lucide-react';
import { colors } from '../theme/colors';
import { NAV_BOTTOM_CLASS } from '../lib/layout';

const GlassFilter: React.FC = () => (
  <svg style={{ display: 'none' }}>
    <filter
      id="glass-distortion-ntrsl"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="200"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

const GlassEffect: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`relative flex font-semibold overflow-hidden text-black transition-all duration-700 ${className}`}
    style={{
      boxShadow: '0 6px 6px rgba(0, 0, 0, 0.1), 0 0 20px rgba(0, 0, 0, 0.05)',
      transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
    }}
  >
    <div
      className="absolute inset-0 z-0 overflow-hidden rounded-[2rem]"
      style={{
        backdropFilter: 'blur(8px)',
        filter: 'url(#glass-distortion-ntrsl)',
        isolation: 'isolate',
      }}
    />
    <div
      className="absolute inset-0 z-10 rounded-[2rem]"
      style={{ background: 'rgba(255, 255, 255, 0.35)' }}
    />
    <div
      className="absolute inset-0 z-20 rounded-[2rem] overflow-hidden"
      style={{
        boxShadow:
          'inset 2px 2px 1px 0 rgba(255, 255, 255, 0.6), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.3)',
      }}
    />
    <div className="relative z-30 w-full">{children}</div>
  </div>
);

const tabs = [
  { to: '/dashboard', end: true, icon: LayoutDashboard, label: 'Resumo' },
  { to: '/home', end: false, icon: Home, label: 'Seu dia' },
  { to: '/historico', end: false, icon: Calendar, label: 'Histórico' },
  { to: '/sobre', end: false, icon: Info, label: 'Sobre' },
];

export function BottomNav() {
  return (
    <>
      <GlassFilter />
      <div className={`fixed ${NAV_BOTTOM_CLASS} left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50`}>
        <GlassEffect className="rounded-[2rem] p-2">
          <div className="flex items-center justify-between w-full px-2 py-1">
            {tabs.map(({ to, end, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={label}
                className={({ isActive }) =>
                  `relative p-3 rounded-2xl transition-all duration-500 flex items-center justify-center ${
                    isActive ? 'scale-110' : 'hover:scale-105'
                  }`
                }
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
                }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-white/50 rounded-2xl shadow-sm border border-white/60" />
                    )}
                    <Icon
                      className="w-6 h-6 relative z-10"
                      style={{ color: isActive ? colors.iconActive : colors.iconInactive }}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </GlassEffect>
      </div>
    </>
  );
}
