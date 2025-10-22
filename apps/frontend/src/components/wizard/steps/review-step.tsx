import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWizard } from '../wizard-provider';
import { GenerationProgressModal } from '../generation-progress-modal';
import {
  Rocket,
  Edit,
  Layout,
  FileText,
  Image as ImageIcon,
  Settings,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  XCircle
} from 'lucide-react';

/**
 * Step 7: Review & Site Generation - TOUT ÉDITABLE
 */
export function ReviewStep() {
  const { wizardData, updateWizardData, sessionId } = useWizard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTaskId, setGenerationTaskId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  // Content tab state
  const [activeContentTab, setActiveContentTab] = useState('principal');

  // Image upload refs
  const heroInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoFooterInputRef = useRef<HTMLInputElement>(null);
  const faviconLightInputRef = useRef<HTMLInputElement>(null);
  const faviconDarkInputRef = useRef<HTMLInputElement>(null);
  const serviceInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const blogInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // CRITICAL: Validate sessionId exists before allowing generation
  if (!sessionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">❌ Erreur de Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Aucune session active détectée. Impossible de générer le site.</p>
          <Button onClick={() => window.location.href = '/wizard?new=true'}>
            Recommencer le wizard
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleGenerate = async () => {
    // CRITICAL: Double-check sessionId before calling API
    if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
      alert('❌ Erreur: Aucune session valide. Veuillez recommencer le wizard avec ?new=true');
      return;
    }

    console.log('🚀 Starting site generation with sessionId:', sessionId);
    setIsGenerating(true);

    try {
      const response = await fetch('/customer/sites/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('customer_access_token')}`,
        },
        body: JSON.stringify({ wizardSessionId: sessionId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Generation API error:', response.status, errorText);
        alert(`❌ Erreur ${response.status}: ${errorText}`);
        setIsGenerating(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setGenerationTaskId(data.taskId);
      } else {
        console.error('Generation failed:', data);
        alert('❌ Échec de la génération: ' + (data.message || 'Erreur inconnue'));
        setIsGenerating(false);
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
      alert('❌ Erreur réseau: ' + (error?.message || 'Erreur inconnue'));
      setIsGenerating(false);
    }
  };

  const handleEdit = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
      setEditData({ ...wizardData });
      if (section === 'content') {
        setActiveContentTab('principal');
      }
    }
  };

  const handleSave = () => {
    updateWizardData(editData);
    setExpandedSection(null);
  };

  const handleCancel = () => {
    setExpandedSection(null);
    setEditData({});
  };

  // Image upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, imageType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    const newImages = { ...editData.images };

    if (imageType.startsWith('service_')) {
      const index = parseInt(imageType.split('_')[1]);
      (newImages as any)[`service_${index}`] = imageUrl;
    } else if (imageType.startsWith('blog_')) {
      const index = parseInt(imageType.split('_')[1]);
      (newImages as any)[`blog_${index}`] = imageUrl;
    } else {
      (newImages as any)[imageType] = imageUrl;
    }

    setEditData({ ...editData, images: newImages });
  };

  // Service handlers
  const addService = () => {
    const newService = { id: Date.now().toString(), name: '', title: '', description: '', features: [] };
    setEditData({ ...editData, services: [...(editData.services || []), newService] });
  };

  const removeService = (index: number) => {
    const updated = editData.services?.filter((_: any, i: number) => i !== index) || [];
    setEditData({ ...editData, services: updated });
  };

  const updateService = (index: number, field: string, value: string) => {
    const updated = [...(editData.services || [])];
    if (updated[index]) {
      (updated[index] as any)[field] = value;
      setEditData({ ...editData, services: updated });
    }
  };

  // FAQ handlers
  const addFaq = () => {
    const newFaq = { question: '', answer: '' };
    setEditData({ ...editData, faq: [newFaq, ...(editData.faq || [])] });
  };

  const removeFaq = (index: number) => {
    const updated = editData.faq?.filter((_: any, i: number) => i !== index) || [];
    setEditData({ ...editData, faq: updated });
  };

  // Testimonial handlers
  const addTestimonial = () => {
    const newTestimonial = { text: '', name: '', position: '', rating: 5 };
    setEditData({ ...editData, testimonials: [newTestimonial, ...(editData.testimonials || [])] });
  };

  const removeTestimonial = (index: number) => {
    const updated = editData.testimonials?.filter((_: any, i: number) => i !== index) || [];
    setEditData({ ...editData, testimonials: updated });
  };

  // Blog handlers
  const addBlogArticle = () => {
    const newArticle = { title: '', excerpt: '', content: '', category: '', tags: [] };
    const updatedArticles = [newArticle, ...(editData.blog?.articles || [])];
    setEditData({ ...editData, blog: { ...editData.blog, articles: updatedArticles } });
  };

  const removeBlogArticle = (index: number) => {
    const updatedArticles = editData.blog?.articles?.filter((_: any, i: number) => i !== index) || [];
    setEditData({ ...editData, blog: { ...editData.blog, articles: updatedArticles } });
  };

  // Content tabs
  const contentTabs = [
    { id: 'principal', label: '🎯 Principal', icon: '🎯' },
    { id: 'services', label: `📋 ${wizardData.terminology || 'Services'}`, icon: '📋' },
    { id: 'about', label: '📖 À Propos', icon: '📖' },
    { id: 'testimonials', label: '💬 Témoignages', icon: '💬' },
    { id: 'faq', label: '❓ FAQ', icon: '❓' },
    { id: 'blog', label: '📝 Blog', icon: '📝' }
  ];

  return (
    <div className="wizard-step p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Révision & Génération</h2>
        <p className="text-gray-700">Vérifiez et éditez toutes les informations avant de générer votre site</p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Template - NOT Editable */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Layout className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-xl font-bold">Modèle de Site</CardTitle>
                  <CardDescription className="text-gray-700">Template sélectionné (non modifiable)</CardDescription>
                </div>
              </div>
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Badge variant="info" className="text-base px-4 py-2">
              {wizardData.selectedTemplate || 'template-base'}
            </Badge>
          </CardContent>
        </Card>

        {/* Section 2: Business Info & Contact - EDITABLE */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-xl font-bold">Informations & Contact</CardTitle>
                  <CardDescription className="text-gray-700">Informations de l'entreprise et coordonnées</CardDescription>
                </div>
              </div>
              <Button onClick={() => handleEdit('business')} variant="outline" size="sm">
                {expandedSection === 'business' ? <XCircle className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {expandedSection === 'business' ? 'Annuler' : 'Modifier'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {expandedSection === 'business' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Nom du site *</label>
                    <input
                      type="text"
                      value={editData.siteName || ''}
                      onChange={(e) => setEditData({ ...editData, siteName: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Type d'activité *</label>
                    <input
                      type="text"
                      value={editData.businessType || ''}
                      onChange={(e) => setEditData({ ...editData, businessType: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                  <textarea
                    value={editData.businessDescription || ''}
                    onChange={(e) => setEditData({ ...editData, businessDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Slogan</label>
                    <input
                      type="text"
                      value={editData.slogan || ''}
                      onChange={(e) => setEditData({ ...editData, slogan: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Domaine</label>
                    <input
                      type="text"
                      value={editData.domain || ''}
                      onChange={(e) => setEditData({ ...editData, domain: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <h4 className="font-bold text-gray-900 text-lg mb-3">Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Email *</label>
                    <input
                      type="email"
                      value={editData.contact?.email || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        contact: { ...editData.contact, email: e.target.value }
                      })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={editData.contact?.phone || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        contact: { ...editData.contact, phone: e.target.value }
                      })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={editData.contact?.address || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      contact: { ...editData.contact, address: e.target.value }
                    })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" /> Enregistrer
                  </Button>
                  <Button onClick={handleCancel} variant="outline">Annuler</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-gray-900">Nom:</span> <span className="text-gray-800">{wizardData.siteName}</span></div>
                  <div><span className="font-semibold text-gray-900">Type:</span> <span className="text-gray-800">{wizardData.businessType}</span></div>
                  <div className="col-span-2"><span className="font-semibold text-gray-900">Description:</span> <span className="text-gray-800">{wizardData.businessDescription}</span></div>
                  <div><span className="font-semibold text-gray-900">Slogan:</span> <span className="text-gray-800">{wizardData.slogan}</span></div>
                  <div><span className="font-semibold text-gray-900">Domaine:</span> <span className="text-gray-800">{wizardData.domain}</span></div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-gray-900">Email:</span> <span className="text-gray-800">{wizardData.contact?.email}</span></div>
                  <div><span className="font-semibold text-gray-900">Téléphone:</span> <span className="text-gray-800">{wizardData.contact?.phone}</span></div>
                  <div className="col-span-2"><span className="font-semibold text-gray-900">Adresse:</span> <span className="text-gray-800">{wizardData.contact?.address}</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Content & Services - WITH TABS */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-xl font-bold">Contenu & Services</CardTitle>
                  <CardDescription className="text-gray-700">Tout le contenu textuel de votre site</CardDescription>
                </div>
              </div>
              <Button onClick={() => handleEdit('content')} variant="outline" size="sm">
                {expandedSection === 'content' ? <XCircle className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {expandedSection === 'content' ? 'Annuler' : 'Modifier'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {expandedSection === 'content' ? (
              <div className="space-y-6">
                {/* Tab Navigation - NO AI GENERATION IN REVIEW */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
                    {contentTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveContentTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                          activeContentTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab: Principal */}
                {activeContentTab === 'principal' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">🎯 Contenu Principal de la Page d'Accueil</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Titre Principal</label>
                      <input
                        type="text"
                        value={editData.hero?.title || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          hero: { ...editData.hero, title: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
                      <input
                        type="text"
                        value={editData.hero?.subtitle || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          hero: { ...editData.hero, subtitle: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={editData.hero?.description || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          hero: { ...editData.hero, description: e.target.value }
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Services */}
                {activeContentTab === 'services' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        📋 Vos {editData.terminology || 'Services'}
                      </h3>
                      <button
                        onClick={addService}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        + Ajouter
                      </button>
                    </div>

                    {editData.services && editData.services.map((service: any, index: number) => (
                      <div key={service.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Titre du Service</label>
                              <input
                                type="text"
                                value={service.title || ''}
                                onChange={(e) => updateService(index, 'title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={service.description || ''}
                                onChange={(e) => updateService(index, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          {editData.services && editData.services.length > 1 && (
                            <button
                              onClick={() => removeService(index)}
                              className="text-red-600 hover:text-red-800 mt-6"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: About */}
                {activeContentTab === 'about' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">📖 À Propos de votre Entreprise</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Titre de la Section</label>
                      <input
                        type="text"
                        value={editData.about?.title || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          about: { ...editData.about, title: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
                      <input
                        type="text"
                        value={editData.about?.subtitle || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          about: { ...editData.about, subtitle: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description de l'Entreprise</label>
                      <textarea
                        value={editData.about?.description || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          about: { ...editData.about, description: e.target.value }
                        })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Testimonials */}
                {activeContentTab === 'testimonials' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">💬 Témoignages Clients</h3>
                      <button
                        onClick={addTestimonial}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        + Ajouter
                      </button>
                    </div>
                    {editData.testimonials && editData.testimonials.length > 0 ? (
                      <div className="space-y-4">
                        {editData.testimonials.map((testimonial: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Témoignage</label>
                                  <textarea
                                    value={testimonial.text || ''}
                                    onChange={(e) => {
                                      const updated = [...(editData.testimonials || [])];
                                      updated[index] = { ...updated[index], text: e.target.value };
                                      setEditData({ ...editData, testimonials: updated });
                                    }}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                    <input
                                      type="text"
                                      value={testimonial.name || ''}
                                      onChange={(e) => {
                                        const updated = [...(editData.testimonials || [])];
                                        updated[index] = { ...updated[index], name: e.target.value };
                                        setEditData({ ...editData, testimonials: updated });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                                    <input
                                      type="text"
                                      value={testimonial.position || ''}
                                      onChange={(e) => {
                                        const updated = [...(editData.testimonials || [])];
                                        updated[index] = { ...updated[index], position: e.target.value };
                                        setEditData({ ...editData, testimonials: updated });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>
                              {editData.testimonials && editData.testimonials.length > 1 && (
                                <button
                                  onClick={() => removeTestimonial(index)}
                                  className="text-red-600 hover:text-red-800 mt-6"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-8">
                        Aucun témoignage. Cliquez sur "+ Ajouter" ou "Générer par IA".
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: FAQ */}
                {activeContentTab === 'faq' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">❓ Questions Fréquemment Posées</h3>
                      <button
                        onClick={addFaq}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        + Ajouter
                      </button>
                    </div>
                    {editData.faq && editData.faq.length > 0 ? (
                      <div className="space-y-4">
                        {editData.faq.map((item: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                                  <input
                                    type="text"
                                    value={item.question || ''}
                                    onChange={(e) => {
                                      const updated = [...(editData.faq || [])];
                                      updated[index] = { ...updated[index], question: e.target.value };
                                      setEditData({ ...editData, faq: updated });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Réponse</label>
                                  <textarea
                                    value={item.answer || ''}
                                    onChange={(e) => {
                                      const updated = [...(editData.faq || [])];
                                      updated[index] = { ...updated[index], answer: e.target.value };
                                      setEditData({ ...editData, faq: updated });
                                    }}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              {editData.faq && editData.faq.length > 1 && (
                                <button
                                  onClick={() => removeFaq(index)}
                                  className="text-red-600 hover:text-red-800 mt-6"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-8">
                        Aucune FAQ. Cliquez sur "+ Ajouter" ou "Générer par IA".
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Blog */}
                {activeContentTab === 'blog' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">📝 Articles de Blog</h3>
                      <button
                        onClick={addBlogArticle}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        + Ajouter
                      </button>
                    </div>
                    {editData.blog?.articles && editData.blog.articles.length > 0 ? (
                      <div className="space-y-4">
                        {editData.blog.articles.map((article: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                                  <input
                                    type="text"
                                    value={article.title || ''}
                                    onChange={(e) => {
                                      const updated = [...(editData.blog?.articles || [])];
                                      updated[index] = { ...updated[index], title: e.target.value };
                                      setEditData({
                                        ...editData,
                                        blog: { ...editData.blog, articles: updated }
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Résumé</label>
                                  <textarea
                                    value={article.excerpt || ''}
                                    onChange={(e) => {
                                      const updated = [...(editData.blog?.articles || [])];
                                      updated[index] = { ...updated[index], excerpt: e.target.value };
                                      setEditData({
                                        ...editData,
                                        blog: { ...editData.blog, articles: updated }
                                      });
                                    }}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                                  <textarea
                                    value={article.content || ''}
                                    onChange={(e) => {
                                      const updated = [...(editData.blog?.articles || [])];
                                      updated[index] = { ...updated[index], content: e.target.value };
                                      setEditData({
                                        ...editData,
                                        blog: { ...editData.blog, articles: updated }
                                      });
                                    }}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              {editData.blog?.articles && editData.blog.articles.length > 1 && (
                                <button
                                  onClick={() => removeBlogArticle(index)}
                                  className="text-red-600 hover:text-red-800 mt-6"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-8">
                        Aucun article. Cliquez sur "+ Ajouter" ou "Générer par IA".
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" /> Enregistrer
                  </Button>
                  <Button onClick={handleCancel} variant="outline">Annuler</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div><span className="font-semibold text-gray-900">Services:</span> <span className="text-gray-800">{wizardData.services?.length || 0}</span></div>
                <div><span className="font-semibold text-gray-900">Témoignages:</span> <span className="text-gray-800">{wizardData.testimonials?.length || 0}</span></div>
                <div><span className="font-semibold text-gray-900">FAQ:</span> <span className="text-gray-800">{wizardData.faq?.length || 0}</span></div>
                <div><span className="font-semibold text-gray-900">Articles de Blog:</span> <span className="text-gray-800">{wizardData.blog?.articles?.length || 0}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Images & Colors - WITH IMAGE PREVIEWS */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-xl font-bold">Images & Couleurs</CardTitle>
                  <CardDescription className="text-gray-700">Visuels et palette de couleurs</CardDescription>
                </div>
              </div>
              <Button onClick={() => handleEdit('images')} variant="outline" size="sm">
                {expandedSection === 'images' ? <XCircle className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {expandedSection === 'images' ? 'Annuler' : 'Modifier'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {expandedSection === 'images' ? (
              <div className="space-y-6">
                {/* Color Pickers */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">🎨 Palette de Couleurs</h4>
                  <p className="text-xs text-blue-600 mb-4 bg-blue-50 p-2 rounded">
                    💡 <strong>Règle 60-30-10:</strong> Primaire (60% dominant) + Secondaire (30% profondeur) + Accent (10% attention)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                      <label className="block text-sm font-bold text-blue-900 mb-2">🎯 Couleur Primaire (60%)</label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="color"
                          value={editData.colors?.primary || '#4F46E5'}
                          onChange={(e) => setEditData({
                            ...editData,
                            colors: { ...editData.colors, primary: e.target.value }
                          })}
                          className="w-24 h-12 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm"
                        />
                        <span className="text-gray-900 font-mono text-sm font-semibold">{editData.colors?.primary || '#4F46E5'}</span>
                      </div>
                      <p className="text-xs text-blue-700 font-medium">Couleur dominante</p>
                      <p className="text-xs text-gray-600 mt-1">Navigation, en-têtes, pieds de page, texte principal, arrière-plans</p>
                    </div>
                    <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                      <label className="block text-sm font-bold text-green-900 mb-2">🌈 Couleur Secondaire (30%)</label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="color"
                          value={editData.colors?.secondary || '#10B981'}
                          onChange={(e) => setEditData({
                            ...editData,
                            colors: { ...editData.colors, secondary: e.target.value }
                          })}
                          className="w-24 h-12 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm"
                        />
                        <span className="text-gray-900 font-mono text-sm font-semibold">{editData.colors?.secondary || '#10B981'}</span>
                      </div>
                      <p className="text-xs text-green-700 font-medium">Profondeur et variété</p>
                      <p className="text-xs text-gray-600 mt-1">Dégradés de boutons, arrière-plans de sections, cartes, bordures</p>
                    </div>
                    <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                      <label className="block text-sm font-bold text-purple-900 mb-2">✨ Couleur d'Accent (10%)</label>
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="color"
                          value={editData.colors?.accent || '#A78BFA'}
                          onChange={(e) => setEditData({
                            ...editData,
                            colors: { ...editData.colors, accent: e.target.value }
                          })}
                          className="w-24 h-12 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm"
                        />
                        <span className="text-gray-900 font-mono text-sm font-semibold">{editData.colors?.accent || '#A78BFA'}</span>
                      </div>
                      <p className="text-xs text-purple-700 font-medium">Points d'attention</p>
                      <p className="text-xs text-gray-600 mt-1">Boutons CTA, liens, dégradés, notifications, badges, survol</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Main Images */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Images principales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Hero Image */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-900 mb-3">🌄 Hero Image</label>
                      <div className="flex justify-center">
                        <div
                          onClick={() => heroInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 cursor-pointer h-32 w-40 flex items-center justify-center bg-white"
                        >
                          {editData.images?.hero ? (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <img src={editData.images.hero} className="max-h-24 max-w-full mx-auto object-contain" alt="Hero" />
                              <p className="text-xs text-green-600 mt-1">✓ Image chargée</p>
                            </div>
                          ) : (
                            <div className="text-gray-600">
                              <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                              </svg>
                              <p className="text-xs">Cliquer pour uploader</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {editData.images?.hero && (
                        <button
                          onClick={(e) => { e.stopPropagation(); heroInputRef.current?.click(); }}
                          className="mt-2 w-full text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                        >
                          🔄 Remplacer
                        </button>
                      )}
                      <input
                        type="file"
                        ref={heroInputRef}
                        onChange={(e) => handleFileUpload(e, 'hero')}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    {/* Logo */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-900 mb-3">📱 Logo Navigation</label>
                      <div className="flex justify-center">
                        <div
                          onClick={() => logoInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 cursor-pointer h-32 w-40 flex items-center justify-center bg-white"
                        >
                          {editData.images?.logo ? (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <img src={editData.images.logo} className="max-h-24 max-w-full mx-auto object-contain" alt="Logo" />
                              <p className="text-xs text-green-600 mt-1">✓ Image chargée</p>
                            </div>
                          ) : (
                            <div className="text-gray-600">
                              <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                              </svg>
                              <p className="text-xs">Cliquer pour uploader</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {editData.images?.logo && (
                        <button
                          onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}
                          className="mt-2 w-full text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                        >
                          🔄 Remplacer
                        </button>
                      )}
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    {/* Logo Footer */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-900 mb-3">🦶 Logo Footer</label>
                      <div className="flex justify-center">
                        <div
                          onClick={() => logoFooterInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 cursor-pointer h-32 w-40 flex items-center justify-center bg-white"
                        >
                          {editData.images?.logoFooter ? (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <img src={editData.images.logoFooter} className="max-h-24 max-w-full mx-auto object-contain" alt="Logo Footer" />
                              <p className="text-xs text-green-600 mt-1">✓ Image chargée</p>
                            </div>
                          ) : (
                            <div className="text-gray-600">
                              <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                              </svg>
                              <p className="text-xs">Cliquer pour uploader</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {editData.images?.logoFooter && (
                        <button
                          onClick={(e) => { e.stopPropagation(); logoFooterInputRef.current?.click(); }}
                          className="mt-2 w-full text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                        >
                          🔄 Remplacer
                        </button>
                      )}
                      <input
                        type="file"
                        ref={logoFooterInputRef}
                        onChange={(e) => handleFileUpload(e, 'logoFooter')}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Favicons */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Favicons</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Favicon Light */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-900 mb-3">☀️ Favicon Clair</label>
                      <div className="flex justify-center">
                        <div
                          onClick={() => faviconLightInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 cursor-pointer h-24 w-32 flex items-center justify-center bg-white"
                        >
                          {editData.images?.faviconLight ? (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <img src={editData.images.faviconLight} className="max-h-16 max-w-full mx-auto object-contain" alt="Favicon Light" />
                              <p className="text-xs text-green-600 mt-1">✓</p>
                            </div>
                          ) : (
                            <div className="text-gray-600">
                              <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                              </svg>
                              <p className="text-xs">Upload</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {editData.images?.faviconLight && (
                        <button
                          onClick={(e) => { e.stopPropagation(); faviconLightInputRef.current?.click(); }}
                          className="mt-2 w-full text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                        >
                          🔄 Remplacer
                        </button>
                      )}
                      <input
                        type="file"
                        ref={faviconLightInputRef}
                        onChange={(e) => handleFileUpload(e, 'faviconLight')}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    {/* Favicon Dark */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-900 mb-3">🌙 Favicon Sombre</label>
                      <div className="flex justify-center">
                        <div
                          onClick={() => faviconDarkInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 cursor-pointer h-24 w-32 flex items-center justify-center bg-white"
                        >
                          {editData.images?.faviconDark ? (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <img src={editData.images.faviconDark} className="max-h-16 max-w-full mx-auto object-contain" alt="Favicon Dark" />
                              <p className="text-xs text-green-600 mt-1">✓</p>
                            </div>
                          ) : (
                            <div className="text-gray-600">
                              <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                              </svg>
                              <p className="text-xs">Upload</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {editData.images?.faviconDark && (
                        <button
                          onClick={(e) => { e.stopPropagation(); faviconDarkInputRef.current?.click(); }}
                          className="mt-2 w-full text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                        >
                          🔄 Remplacer
                        </button>
                      )}
                      <input
                        type="file"
                        ref={faviconDarkInputRef}
                        onChange={(e) => handleFileUpload(e, 'faviconDark')}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Service Images */}
                {editData.services && editData.services.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      Images de Services ({editData.services.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {editData.services.map((service: any, index: number) => {
                        const serviceKey = `service_${index}`;
                        const hasImage = !!(editData.images as any)?.[serviceKey];
                        const imageUrl = (editData.images as any)?.[serviceKey];

                        return (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-900 mb-3 truncate" title={service.name || service.title}>
                              🔧 {service.name || service.title || `Service ${index + 1}`}
                            </label>
                            <div className="flex justify-center">
                              <div
                                onClick={() => serviceInputRefs.current[index]?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 cursor-pointer h-20 w-24 flex items-center justify-center bg-white"
                              >
                                {hasImage ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center">
                                    <img src={imageUrl} className="max-h-14 max-w-full mx-auto object-contain" alt={`Service ${index + 1}`} />
                                    <p className="text-xs text-green-600 mt-1">✓</p>
                                  </div>
                                ) : (
                                  <div className="text-gray-600">
                                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    <p className="text-xs">Upload</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {hasImage && (
                              <button
                                onClick={(e) => { e.stopPropagation(); serviceInputRefs.current[index]?.click(); }}
                                className="mt-2 w-full text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                              >
                                🔄 Remplacer
                              </button>
                            )}
                            <input
                              type="file"
                              ref={(el) => { serviceInputRefs.current[index] = el; }}
                              onChange={(e) => handleFileUpload(e, serviceKey)}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Blog Images */}
                {editData.blog?.articles && editData.blog.articles.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      Images d'Articles de Blog ({editData.blog.articles.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {editData.blog.articles.map((article: any, index: number) => {
                        const blogKey = `blog_${index}`;
                        const hasImage = !!(editData.images as any)?.[blogKey];
                        const imageUrl = (editData.images as any)?.[blogKey];

                        return (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-900 mb-3 truncate" title={article.title}>
                              📝 {article.title || `Article ${index + 1}`}
                            </label>
                            <div className="flex justify-center">
                              <div
                                onClick={() => blogInputRefs.current[index]?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 cursor-pointer h-24 w-32 flex items-center justify-center bg-white"
                              >
                                {hasImage ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center">
                                    <img src={imageUrl} className="max-h-16 max-w-full mx-auto object-contain" alt={`Blog ${index + 1}`} />
                                    <p className="text-xs text-green-600 mt-1">✓</p>
                                  </div>
                                ) : (
                                  <div className="text-gray-600">
                                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"></path>
                                    </svg>
                                    <p className="text-xs">Upload</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {hasImage && (
                              <button
                                onClick={(e) => { e.stopPropagation(); blogInputRefs.current[index]?.click(); }}
                                className="mt-2 w-full text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                              >
                                🔄 Remplacer
                              </button>
                            )}
                            <input
                              type="file"
                              ref={(el) => { blogInputRefs.current[index] = el; }}
                              onChange={(e) => handleFileUpload(e, blogKey)}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" /> Enregistrer
                  </Button>
                  <Button onClick={handleCancel} variant="outline">Annuler</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {wizardData.images?.logo && <div className="text-green-700 font-semibold">✓ Logo</div>}
                  {wizardData.images?.logoFooter && <div className="text-green-700 font-semibold">✓ Logo Footer</div>}
                  {wizardData.images?.hero && <div className="text-green-700 font-semibold">✓ Image Hero</div>}
                  {wizardData.images?.faviconLight && <div className="text-green-700 font-semibold">✓ Favicon Clair</div>}
                  {wizardData.images?.faviconDark && <div className="text-green-700 font-semibold">✓ Favicon Sombre</div>}
                </div>
                <Separator />
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">Couleur primaire:</span>{' '}
                  <span className="inline-block w-4 h-4 rounded" style={{backgroundColor: wizardData.colors?.primary || '#4F46E5'}}></span>{' '}
                  <span className="text-gray-800">{wizardData.colors?.primary || '#4F46E5'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Advanced Features */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-xl font-bold">Fonctionnalités Avancées</CardTitle>
                  <CardDescription className="text-gray-700">Configuration des fonctionnalités</CardDescription>
                </div>
              </div>
              <Button onClick={() => handleEdit('advanced')} variant="outline" size="sm">
                {expandedSection === 'advanced' ? <XCircle className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {expandedSection === 'advanced' ? 'Annuler' : 'Modifier'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {expandedSection === 'advanced' ? (
              <div className="space-y-6">
                {/* Email Configuration */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Configuration Email</h4>
                  <div className="space-y-3">
                    {/* Option 1: OAuth2 Gmail */}
                    <label
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        editData.step6?.emailConfig?.scenario === 'oauth2'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="emailScenario"
                        value="oauth2"
                        checked={editData.step6?.emailConfig?.scenario === 'oauth2'}
                        onChange={() => setEditData({
                          ...editData,
                          step6: {
                            ...editData.step6,
                            emailConfig: { ...editData.step6?.emailConfig, scenario: 'oauth2' }
                          }
                        })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Utiliser mon Gmail
                          <span className="ml-2 text-xs font-normal text-blue-600">Recommandé</span>
                        </div>
                        <div className="text-sm text-gray-500">Débloque toutes les fonctions</div>
                      </div>
                    </label>

                    {editData.step6?.emailConfig?.scenario === 'oauth2' && (
                      <div className="ml-7 pl-4 border-l-2 border-blue-200">
                        {editData.step6?.emailConfig?.oauth?.connected ? (
                          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-green-900">Connecté</div>
                              <div className="text-xs text-green-700">{editData.step6.emailConfig.oauth.email}</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Voulez-vous déconnecter ce compte Gmail et en connecter un autre ?')) {
                                  // Déconnecter et sauvegarder immédiatement dans wizardData
                                  const disconnectedConfig = {
                                    step6: {
                                      ...editData.step6,
                                      emailConfig: {
                                        ...editData.step6?.emailConfig,
                                        scenario: 'oauth2', // Garder oauth2 comme choix
                                        oauth: {
                                          connected: false,
                                          email: '',
                                          oauthCredentialId: ''
                                        }
                                      }
                                    }
                                  };

                                  setEditData({
                                    ...editData,
                                    ...disconnectedConfig
                                  });

                                  // Sauvegarder immédiatement dans wizardData
                                  updateWizardData(disconnectedConfig);
                                }
                              }}
                              className="text-xs text-red-600 hover:text-red-800 hover:underline font-medium"
                            >
                              Changer de compte
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                            ℹ️ Retournez à l'étape Fonctionnalités pour connecter Gmail
                          </div>
                        )}
                      </div>
                    )}

                    {/* Option 2: Locod.ai default */}
                    <label
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        editData.step6?.emailConfig?.scenario === 'locodai-default'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="emailScenario"
                        value="locodai-default"
                        checked={editData.step6?.emailConfig?.scenario === 'locodai-default'}
                        onChange={() => setEditData({
                          ...editData,
                          step6: {
                            ...editData.step6,
                            emailConfig: { ...editData.step6?.emailConfig, scenario: 'locodai-default' }
                          }
                        })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Email Locod.ai</div>
                        <div className="text-sm text-gray-500">Géré par Locod.ai</div>
                      </div>
                    </label>

                    {editData.step6?.emailConfig?.scenario === 'locodai-default' && (
                      <div className="ml-7 pl-4 border-l-2 border-blue-200 space-y-3">
                        <input
                          type="email"
                          value={editData.step6?.emailConfig?.locodaiDefault?.businessEmail || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            step6: {
                              ...editData.step6,
                              emailConfig: {
                                ...editData.step6?.emailConfig,
                                locodaiDefault: {
                                  ...editData.step6?.emailConfig?.locodaiDefault,
                                  businessEmail: e.target.value
                                }
                              }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Votre email pour recevoir les messages"
                        />
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editData.step6?.emailConfig?.locodaiDefault?.gdprConsent?.accepted || false}
                            onChange={(e) => setEditData({
                              ...editData,
                              step6: {
                                ...editData.step6,
                                emailConfig: {
                                  ...editData.step6?.emailConfig,
                                  locodaiDefault: {
                                    ...editData.step6?.emailConfig?.locodaiDefault,
                                    gdprConsent: {
                                      accepted: e.target.checked,
                                      acceptedAt: new Date().toISOString(),
                                      ipAddress: '',
                                      policyVersion: '1.0'
                                    }
                                  }
                                }
                              }
                            })}
                            className="mt-0.5"
                          />
                          <span className="text-gray-600">
                            J'accepte que Locod.ai envoie des emails pour mon compte
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Option 3: No form */}
                    <label
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        editData.step6?.emailConfig?.scenario === 'no-form'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="emailScenario"
                        value="no-form"
                        checked={editData.step6?.emailConfig?.scenario === 'no-form'}
                        onChange={() => setEditData({
                          ...editData,
                          step6: {
                            ...editData.step6,
                            emailConfig: { ...editData.step6?.emailConfig, scenario: 'no-form' }
                          }
                        })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Pas de formulaire</div>
                        <div className="text-sm text-gray-500">Téléphone et adresse affichés dans la section contact</div>
                      </div>
                    </label>
                  </div>
                </div>

                <Separator />

                {/* Automatic Features */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Fonctionnalités automatiques</h4>
                  <div className="space-y-3">
                    {/* N8N Automation */}
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🤖</span>
                          <div>
                            <div className="font-medium text-gray-900">Automatisation N8N</div>
                            <div className="text-sm text-gray-500">
                              {editData.step6?.emailConfig?.scenario !== 'no-form' ? (
                                editData.step6?.n8n?.enabled ? (
                                  <span className="text-blue-600">✓ Activé</span>
                                ) : (
                                  <span className="text-green-600">✓ Disponible</span>
                                )
                              ) : (
                                <span className="text-gray-400">Nécessite: Email configuré</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={editData.step6?.emailConfig?.scenario === 'no-form'}
                        onClick={() => setEditData({
                          ...editData,
                          step6: {
                            ...editData.step6,
                            n8n: { enabled: !editData.step6?.n8n?.enabled }
                          }
                        })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editData.step6?.emailConfig?.scenario !== 'no-form'
                            ? editData.step6?.n8n?.enabled
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {editData.step6?.n8n?.enabled ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>

                    {/* Google Analytics */}
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📊</span>
                          <div>
                            <div className="font-medium text-gray-900">Google Analytics</div>
                            <div className="text-sm text-gray-500">
                              {editData.step6?.emailConfig?.scenario === 'oauth2' ? (
                                editData.step6?.analytics?.enabled ? (
                                  <span className="text-blue-600">✓ Activé</span>
                                ) : (
                                  <span className="text-green-600">✓ Disponible</span>
                                )
                              ) : (
                                <span className="text-gray-400">Nécessite: Gmail OAuth2</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={editData.step6?.emailConfig?.scenario !== 'oauth2'}
                        onClick={() => setEditData({
                          ...editData,
                          step6: {
                            ...editData.step6,
                            analytics: { enabled: !editData.step6?.analytics?.enabled }
                          }
                        })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editData.step6?.emailConfig?.scenario === 'oauth2'
                            ? editData.step6?.analytics?.enabled
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {editData.step6?.analytics?.enabled ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>

                    {/* reCAPTCHA */}
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🛡️</span>
                          <div>
                            <div className="font-medium text-gray-900">Protection anti-spam (reCAPTCHA)</div>
                            <div className="text-sm text-gray-500">
                              {editData.step6?.emailConfig?.scenario !== 'no-form' ? (
                                editData.step6?.recaptcha?.enabled ? (
                                  <span className="text-blue-600">✓ Activé</span>
                                ) : (
                                  <span className="text-green-600">✓ Disponible</span>
                                )
                              ) : (
                                <span className="text-gray-400">Nécessite: Formulaire actif</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={editData.step6?.emailConfig?.scenario === 'no-form'}
                        onClick={() => setEditData({
                          ...editData,
                          step6: {
                            ...editData.step6,
                            recaptcha: { enabled: !editData.step6?.recaptcha?.enabled }
                          }
                        })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editData.step6?.emailConfig?.scenario !== 'no-form'
                            ? editData.step6?.recaptcha?.enabled
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {editData.step6?.recaptcha?.enabled ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" /> Enregistrer
                  </Button>
                  <Button onClick={handleCancel} variant="outline">Annuler</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">Email:</span>{' '}
                  <span className="text-gray-800">
                    {wizardData.step6?.emailConfig?.scenario === 'oauth2' && 'OAuth2 (Gmail)'}
                    {wizardData.step6?.emailConfig?.scenario === 'locodai-default' && 'Email Locod.AI'}
                    {wizardData.step6?.emailConfig?.scenario === 'no-form' && 'Pas de formulaire'}
                    {!wizardData.step6?.emailConfig?.scenario && 'Email Locod.AI (défaut)'}
                  </span>
                  {wizardData.step6?.emailConfig?.scenario === 'oauth2' && wizardData.step6?.emailConfig?.oauth?.connected && (
                    <span className="ml-2 text-green-600">✓ {wizardData.step6.emailConfig.oauth.email}</span>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div>🤖 N8N: {wizardData.step6?.n8n?.enabled ? '✓ Activé' : '○ Désactivé'}</div>
                  <div>📊 Analytics: {wizardData.step6?.analytics?.enabled ? '✓ Activé' : '○ Désactivé'}</div>
                  <div>🛡️ reCAPTCHA: {wizardData.step6?.recaptcha?.enabled ? '✓ Activé' : '○ Désactivé'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Card className="border-4 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Prêt à générer votre site ?</h3>
              <p className="text-gray-700 mb-6">Vérifiez toutes les informations ci-dessus avant de lancer la génération</p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Générer mon site
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {generationTaskId && (
        <GenerationProgressModal
          taskId={generationTaskId}
          onClose={() => {
            setGenerationTaskId(null);
            setIsGenerating(false);
          }}
        />
      )}
    </div>
  );
}
