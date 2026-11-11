import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '../../services/googleMapsService';

interface Props {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<Props> = ({ children }) => {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    // Listen for custom quota-exceeded event dispatched on 429 or OverQuotaMapError
    const handleQuota = () => {
      setQuotaExceeded(true);
    };

    window.addEventListener('gmp-quota-exceeded', handleQuota);

    // Global Google Maps Auth Failure listener
    (window as any).gm_authFailure = () => {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    };

    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuota);
    };
  }, []);

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={['places', 'routes', 'geometry', 'marker']}
      language="en"
      region="IN"
    >
      {/* Tier 2 Quota Exceeded Banner per Google Maps skill specification */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
          <button
            onClick={() => setQuotaExceeded(false)}
            className="text-amber-700 hover:text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full hover:bg-amber-100"
          >
            ✕
          </button>
        </div>
      )}

      {children}
    </APIProvider>
  );
};
