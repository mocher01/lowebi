'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../components/layout/AdminLayout';
import AiQueueGrid from './components/AiQueueGrid';
import ProcessingModal from './components/ProcessingModal';
import { apiClient, AiRequest, QueueResponse } from '@/services/api-client';

export default function AIQueuePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AiRequest | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = 'https://admin.dev.lowebi.com/';
      return;
    }

    fetchQueue();
    
    // Real-time updates
    let interval: NodeJS.Timeout;
    if (realTimeEnabled) {
      interval = setInterval(fetchQueue, 10000); // Update every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router, realTimeEnabled]);

  const fetchQueue = async () => {
    try {
      console.log('🔍 Fetching AI queue...');
      const response: QueueResponse = await apiClient.getQueue();
      console.log('✅ AI Queue loaded:', response);
      setRequests(response.requests || []);
      setLoading(false);
    } catch (error) {
      console.error('❌ Failed to fetch AI queue:', error);
      
      // Check if it's an authentication error
      const errorMessage = (error as any)?.message || 'Unknown error';
      console.log('Error details:', errorMessage);
      
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        console.log('🔐 Authentication error detected - redirecting to login');
        showToast('Session expirée, reconnexion nécessaire', 'error');
        // Clear invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminToken');
        }
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = 'https://admin.dev.lowebi.com/';
        }, 2000);
      } else {
        showToast('Erreur lors du chargement de la queue IA: ' + errorMessage, 'error');
      }
      setLoading(false);
    }
  };

  const handleProcess = async (request: AiRequest) => {
    try {
      // Handle completed requests differently - just show the modal to view results
      if (request.status === 'completed') {
        console.log('👁️ Opening completed request for viewing:', request.id);
        setSelectedRequest(request);
        return;
      }
      
      console.log('🚀 Auto-assigning and starting processing for request:', request.id);
      
      // Auto-assign request to current admin
      if (request.status === 'pending' && !request.adminId) {
        console.log('📌 Assigning request to admin...');
        await apiClient.assignRequest(request.id);
      }
      
      // Auto-start processing if not already started
      if (request.status !== 'processing') {
        console.log('▶️ Starting processing...');
        await apiClient.startProcessing(request.id);
      }
      
      console.log('✅ Request ready for processing');
      setSelectedRequest(request);
    } catch (error) {
      console.error('❌ Failed to prepare request for processing:', error);
      showToast('Erreur lors de la préparation de la demande', 'error');
    }
  };

  const handleComplete = async (request: AiRequest, generatedContent: string) => {
    try {
      console.log('✅ Completing request:', request.id);
      
      // Show loading state
      showToast('Application du contenu...', 'success');
      
      // Parse the content from JSON string to object like V1 does
      let parsedContent;
      try {
        parsedContent = JSON.parse(generatedContent);
      } catch (error) {
        throw new Error('Le contenu doit être au format JSON valide');
      }
      
      await apiClient.completeRequest(request.id, { content: parsedContent });
      
      // Close modal first
      setSelectedRequest(null);
      
      // Show success message
      showToast('✅ Contenu appliqué avec succès! Status mis à jour.', 'success');
      
      // Refresh queue immediately
      await fetchQueue();
      
      console.log('✅ Request completed and queue refreshed');
    } catch (error) {
      console.error('❌ Failed to complete request:', error);
      showToast('Erreur lors du traitement - ' + (error as any)?.message || 'Erreur inconnue', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Chargement de la queue IA</h2>
            <p className="text-gray-600">Récupération des demandes en cours...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-full bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Compact header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Queue IA</h1>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {requests.length} demandes
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
                  <label className="text-sm text-gray-600">Temps réel</label>
                  <button
                    onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      realTimeEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      realTimeEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                
                <span className="text-xs text-gray-500">
                  MAJ: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Queue grid */}
          <AiQueueGrid 
            requests={requests}
            onProcess={handleProcess}
            onRefresh={fetchQueue}
            loading={loading}
          />

          {/* Processing Modal */}
          {selectedRequest && (
            <ProcessingModal 
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
              onComplete={handleComplete}
            />
          )}

          {/* Toast notification */}
          {toast && (
            <div className={`fixed top-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${
              toast.type === 'success' ? 'border-green-500' : 'border-red-500'
            } p-4 z-50 transform transition-all duration-300`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {toast.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {toast.message}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setToast(null)}
                    className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}