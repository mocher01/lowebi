'use client';

import { useState, useEffect } from 'react';
import { AiRequest } from '@/services/api-client';

interface AiQueueGridProps {
  requests: AiRequest[];
  onProcess: (request: AiRequest) => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function AiQueueGrid({ requests, onProcess, onRefresh, loading }: AiQueueGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter and sort requests
  const filteredRequests = requests
    .filter(request => {
      const matchesSearch = (request.siteId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (request.businessType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (request.requestType || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'priority':
          return getPriority(b.status) - getPriority(a.status);
        case 'type':
          return a.requestType.localeCompare(b.requestType);
        default:
          return 0;
      }
    });

  const getPriority = (status: string) => {
    const priorities = { pending: 3, assigned: 2, processing: 4, completed: 1, rejected: 0 };
    return priorities[status as keyof typeof priorities] || 0;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400', label: 'En attente' },
      assigned: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400', label: 'Assignée' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-400', label: 'En cours' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400', label: 'Terminée' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400', label: 'Rejetée' },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getContentTypeColor = (type: string) => {
    // Image types should have special visual treatment
    const imageTypes = ['images', 'hero', 'logo', 'banner', 'gallery'];
    const isImageType = imageTypes.includes((type || '').toLowerCase());
    
    if (isImageType) {
      return 'bg-amber-100 text-amber-800 border-2 border-amber-300';
    }
    
    const colors = {
      services: 'bg-blue-100 text-blue-700',
      about: 'bg-green-100 text-green-700', 
      testimonials: 'bg-pink-100 text-pink-700',
      faq: 'bg-indigo-100 text-indigo-700',
      seo: 'bg-orange-100 text-orange-700'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getContentTypeIcon = (type: string) => {
    const imageTypes = ['images', 'hero', 'logo', 'banner', 'gallery'];
    const isImageType = imageTypes.includes((type || '').toLowerCase());
    
    if (isImageType) {
      return '🎨';
    }
    
    const icons = {
      services: '🛠️',
      about: 'ℹ️',
      testimonials: '💬',
      faq: '❓',
      seo: '🔍'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map(r => r.id));
    }
  };

  const handleSelectRequest = (requestId: number) => {
    if (selectedRequests.includes(requestId)) {
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
    } else {
      setSelectedRequests([...selectedRequests, requestId]);
    }
  };

  const statusCounts = requests.reduce((counts, request) => {
    counts[request.status] = (counts[request.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-3">
      {/* Compact controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between space-x-4">
          {/* Search and filters */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tous ({requests.length})</option>
              <option value="pending">En attente ({statusCounts.pending || 0})</option>
              <option value="processing">En cours ({statusCounts.processing || 0})</option>
              <option value="completed">Terminées ({statusCounts.completed || 0})</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="created">Date ↓</option>
              <option value="priority">Priorité</option>
              <option value="type">Type</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {selectedRequests.length > 0 && (
              <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
                {selectedRequests.length} sélectionnée{selectedRequests.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table view - Ultra compact with fixed layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left" style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '60px' }}>ID</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '20%' }}>Site</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '100px' }}>Type</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Customer</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '100px' }}>Statut</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '110px' }}>Date</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRequests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                const isSelected = selectedRequests.includes(request.id);

                return (
                  <tr
                    key={request.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRequest(request.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{request.id}
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {request.site?.name || request.wizardSession?.siteName || 'Site non spécifié'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {request.wizardSession?.businessType || request.businessType}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getContentTypeColor(request.requestType)}`}>
                        <span className="mr-0.5">{getContentTypeIcon(request.requestType)}</span>
                        <span className="truncate">{request.requestType}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {request.customer ? `${request.customer.firstName} ${request.customer.lastName}` : 'Client inconnu'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{request.customer?.email || request.customerId}</div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-1 ${statusConfig.dot} ${request.status === 'processing' ? 'animate-pulse' : ''}`}></div>
                        <span className="truncate">{statusConfig.label}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-500 truncate">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm font-medium">
                      {request.status !== 'completed' && (
                        <button
                          onClick={() => onProcess(request)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          Traiter
                        </button>
                      )}

                      {request.status === 'completed' && (
                        <button
                          onClick={() => onProcess(request)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          Voir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Affichage {startIndex + 1} à {Math.min(endIndex, filteredRequests.length)} sur {filteredRequests.length}
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value={10}>10 par page</option>
                <option value={25}>25 par page</option>
                <option value={50}>50 par page</option>
                <option value={100}>100 par page</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Premier
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant →
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dernier
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredRequests.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande trouvée</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all' ? 'Essayez de modifier vos filtres.' : 'Les nouvelles demandes apparaîtront ici.'}
          </p>
        </div>
      )}
    </div>
  );
}