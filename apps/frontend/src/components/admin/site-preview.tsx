'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw } from 'lucide-react';

interface SitePreviewProps {
  siteUrl: string;
  siteName: string;
}

type ViewportType = 'desktop' | 'tablet' | 'mobile';

const viewportWidths = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export default function SitePreview({ siteUrl, siteName }: SitePreviewProps) {
  const [viewport, setViewport] = useState<ViewportType>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Site Preview</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewport('desktop')}
              className={'p-2 rounded-md transition-colors ' + (viewport === 'desktop' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900')}
              title="Desktop View (1280px)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={'p-2 rounded-md transition-colors ' + (viewport === 'tablet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900')}
              title="Tablet View (768px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={'p-2 rounded-md transition-colors ' + (viewport === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900')}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className={'w-4 h-4 ' + (isLoading ? 'animate-spin' : '')} />
          </button>
        </div>
      </div>

      <div className="relative bg-gray-100 rounded-lg p-4 min-h-[600px] flex items-start justify-center overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-10">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading preview...</p>
            </div>
          </div>
        )}

        <div
          className="bg-white rounded-lg shadow-xl transition-all duration-300 overflow-hidden"
          style={{
            width: viewportWidths[viewport],
            maxWidth: '100%',
            height: '600px',
          }}
        >
          {siteUrl ? (
            <iframe
              key={iframeKey}
              src={siteUrl}
              title={'Preview of ' + siteName}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={() => setIsLoading(false)}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm">No site URL available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-center text-sm text-gray-500">
        Current viewport: {viewport === 'desktop' ? 'Desktop (100%)' : viewport === 'tablet' ? 'Tablet (768px)' : 'Mobile (375px)'}
      </div>
    </div>
  );
}
