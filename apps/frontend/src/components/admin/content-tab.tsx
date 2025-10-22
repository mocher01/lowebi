'use client';

import { useState, useEffect } from 'react';
import { FileText, BookOpen, Plus, Edit, Trash2, Eye, Clock, Briefcase, HelpCircle, MessageSquare, Rocket } from 'lucide-react';
import axios from 'axios';
import HeroEditorModal from './hero-editor-modal';
import PageEditorModal from './page-editor-modal';
import BlogEditorModal from './blog-editor-modal';
import ListEditorModal from './list-editor-modal';

interface ContentTabProps {
  siteId: string;
  siteName: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: 'draft' | 'published';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  isDraft: boolean;
}

interface PageContent {
  hero: any;
  about: any;
  services: any[];
  contact: any;
  faq: any[];
  testimonials: any[];
}

export default function ContentTab({ siteId, siteName }: ContentTabProps) {
  const [activeTab, setActiveTab] = useState<'pages' | 'services' | 'faq' | 'testimonials' | 'blog'>('pages');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Modal states
  const [showHeroEditor, setShowHeroEditor] = useState(false);
  const [showPageEditor, setShowPageEditor] = useState(false);
  const [showListEditor, setShowListEditor] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSectionName, setSelectedSectionName] = useState<string>('');
  const [selectedSectionData, setSelectedSectionData] = useState<any>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | undefined>(undefined);

  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (activeTab === 'blog') {
      fetchBlogPosts();
    } else {
      // Fetch page content for all non-blog tabs
      fetchPageContent();
    }
  }, [activeTab, siteId]);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('customer_access_token');
      const response = await axios.get(`/customer/sites/${siteId}/blog`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogPosts(response.data);
    } catch (err: any) {
      console.error('Error fetching blog posts:', err);
      setError(err.response?.data?.message || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPageContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('customer_access_token');
      const response = await axios.get(`/customer/sites/${siteId}/content`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPageContent(response.data);
    } catch (err: any) {
      console.error('Error fetching page content:', err);
      setError(err.response?.data?.message || 'Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEditPageSection = (section: string, name: string, data: any) => {
    setSelectedSection(section);
    setSelectedSectionName(name);
    setSelectedSectionData(data);

    if (section === 'hero') {
      setShowHeroEditor(true);
    } else if (Array.isArray(data)) {
      // Use list editor for array-based sections (services, faq, testimonials)
      setShowListEditor(true);
    } else {
      // Use generic page editor for other single-object sections
      setShowPageEditor(true);
    }
  };

  const handlePageSaved = () => {
    fetchPageContent();
    setShowPageEditor(false);
    setShowHeroEditor(false);
    setShowListEditor(false);
  };

  const handleCreateBlogPost = () => {
    setSelectedPost(null);
    setShowBlogEditor(true);
  };

  const handleEditBlogPost = (post: BlogPost) => {
    setSelectedPost(post);
    setShowBlogEditor(true);
  };

  const handleDeleteBlogPost = async (post: BlogPost) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${post.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('customer_access_token');
      await axios.delete(`/customer/sites/${siteId}/blog/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBlogPosts();
    } catch (err: any) {
      console.error('Error deleting blog post:', err);
      alert(err.response?.data?.message || 'Failed to delete blog post');
    }
  };

  const handleBlogSaved = () => {
    fetchBlogPosts();
    setShowBlogEditor(false);
  };

  const handleBlogDeleted = () => {
    fetchBlogPosts();
    setShowBlogEditor(false);
  };

  const handleEditListItem = (sectionKey: string, sectionName: string, index: number) => {
    const items = pageContent?.[sectionKey as keyof PageContent] || [];
    const item = items[index];
    setSelectedSection(sectionKey);
    setSelectedSectionName(sectionName);
    setSelectedSectionData([item]); // Only pass the single item being edited
    setSelectedItemIndex(index); // Track which item we're editing
    setShowListEditor(true);
  };

  const handleAddListItem = (sectionKey: string, sectionName: string) => {
    setSelectedSection(sectionKey);
    setSelectedSectionName(sectionName);
    setSelectedSectionData([]); // Empty array for adding new
    setSelectedItemIndex(undefined); // No index for new items
    setShowListEditor(true);
  };

  const handleDeleteListItem = async (sectionKey: string, sectionName: string, index: number) => {
    const confirmed = confirm(`Are you sure you want to delete this item? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const items = [...(pageContent?.[sectionKey as keyof PageContent] || [])];
      items.splice(index, 1); // Remove the item at index

      const token = localStorage.getItem('customer_access_token');
      await axios.patch(
        `/customer/sites/${siteId}/content/pages/${sectionKey}`,
        {
          data: items,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchPageContent(); // Refresh the data
    } catch (err: any) {
      console.error('Error deleting item:', err);
      alert(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const handlePublish = async () => {
    const confirmed = confirm(
      'This will regenerate and redeploy your site with all the changes you made. This process takes about 30-60 seconds. Continue?'
    );
    if (!confirmed) return;

    try {
      setPublishing(true);
      setPublishSuccess(false);
      const token = localStorage.getItem('customer_access_token');

      await axios.post(
        `/customer/sites/${siteId}/publish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error publishing changes:', err);
      alert(err.response?.data?.message || 'Failed to publish changes');
    } finally {
      setPublishing(false);
    }
  };

  const renderListContent = (sectionKey: 'services' | 'faq' | 'testimonials', sectionName: string, Icon: any) => {
    const items = pageContent?.[sectionKey] || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {sectionName} ({items.length})
          </h3>
          <button
            onClick={() => handleAddListItem(sectionKey, sectionName)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No {sectionName.toLowerCase()} yet</p>
            <button
              onClick={() => handleAddListItem(sectionKey, sectionName)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add {sectionName}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {item.title || item.question || item.name || `Item ${index + 1}`}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description || item.answer || item.content || 'No description'}
                    </p>
                    {item.position && (
                      <p className="text-xs text-gray-500 mt-1">{item.position}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditListItem(sectionKey, sectionName, index)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit item"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteListItem(sectionKey, sectionName, index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Publish Button - Sticky Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Content Editor</h3>
            <p className="text-sm text-gray-600">
              Edit your content below, then click Publish to update your live site
            </p>
          </div>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              publishSuccess
                ? 'bg-green-600 text-white'
                : publishing
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
            }`}
          >
            {publishing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Publishing...
              </>
            ) : publishSuccess ? (
              <>
                <Eye className="w-5 h-5" />
                Published!
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Publish Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'pages'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            Page Content
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Services
            {pageContent?.services && (
              <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                {pageContent.services.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            FAQ
            {pageContent?.faq && (
              <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                {pageContent.faq.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('testimonials')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'testimonials'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Testimonials
            {pageContent?.testimonials && (
              <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                {pageContent.testimonials.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'blog'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Blog Posts
            {blogPosts.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                {blogPosts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : activeTab === 'services' ? (
          renderListContent('services', 'Services', Briefcase)
        ) : activeTab === 'faq' ? (
          renderListContent('faq', 'FAQ', HelpCircle)
        ) : activeTab === 'testimonials' ? (
          renderListContent('testimonials', 'Testimonials', MessageSquare)
        ) : activeTab === 'pages' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editable Page Sections</h3>
            </div>

            {pageContent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Hero Section', key: 'hero', description: 'Main homepage banner' },
                  { name: 'About Section', key: 'about', description: 'About us content' },
                  { name: 'Contact', key: 'contact', description: 'Contact information' },
                ].map((section) => {
                  const data = pageContent[section.key as keyof PageContent];
                  const itemCount = Array.isArray(data) ? data.length : Object.keys(data || {}).length;

                  return (
                    <div
                      key={section.key}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{section.name}</h4>
                            {Array.isArray(data) && (
                              <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                                {data.length} items
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{section.description}</p>
                          {!Array.isArray(data) && data?.title && (
                            <p className="text-xs text-gray-500 mt-2 truncate">
                              {data.title}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            handleEditPageSection(
                              section.key,
                              section.name,
                              data
                            )
                          }
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                          title="Edit section"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Blog Posts ({blogPosts.length})
              </h3>
              <button
                onClick={handleCreateBlogPost}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Post
              </button>
            </div>

            {blogPosts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No blog posts yet</p>
                <button
                  onClick={handleCreateBlogPost}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Post
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {blogPosts.map((post) => (
                  <div
                    key={post.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{post.title}</h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              post.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {post.status === 'published' ? (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Published
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Draft
                              </span>
                            )}
                          </span>
                        </div>
                        {post.excerpt && (
                          <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Slug: /{post.slug}</span>
                          <span>Updated: {formatDate(post.updatedAt)}</span>
                          {post.publishedAt && (
                            <span>Published: {formatDate(post.publishedAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditBlogPost(post)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit post"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlogPost(post)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hero Editor Modal */}
      <HeroEditorModal
        isOpen={showHeroEditor}
        onClose={() => setShowHeroEditor(false)}
        siteId={siteId}
        initialData={selectedSectionData}
        onSaved={handlePageSaved}
      />

      {/* Page Editor Modal */}
      <PageEditorModal
        isOpen={showPageEditor}
        onClose={() => setShowPageEditor(false)}
        siteId={siteId}
        section={selectedSection}
        sectionName={selectedSectionName}
        initialData={selectedSectionData}
        onSaved={handlePageSaved}
      />

      {/* Blog Editor Modal */}
      <BlogEditorModal
        isOpen={showBlogEditor}
        onClose={() => setShowBlogEditor(false)}
        siteId={siteId}
        post={selectedPost}
        onSaved={handleBlogSaved}
        onDeleted={handleBlogDeleted}
      />

      {/* List Editor Modal (for services, FAQ, testimonials) */}
      {showListEditor && (
        <ListEditorModal
          isOpen={showListEditor}
          onClose={() => setShowListEditor(false)}
          siteId={siteId}
          sectionName={selectedSectionName}
          sectionKey={selectedSection}
          initialData={selectedSectionData || []}
          onSaved={handlePageSaved}
          fields={getFieldsForSection(selectedSection)}
          itemIndex={selectedItemIndex}
          allItems={selectedItemIndex !== undefined ? (pageContent?.[selectedSection as keyof PageContent] as any[] || []) : undefined}
        />
      )}
    </div>
  );
}

// Field configurations for different list-based sections
function getFieldsForSection(section: string) {
  switch (section) {
    case 'services':
      return [
        { key: 'title', label: 'Service Title', type: 'text' as const, required: true, placeholder: 'e.g., Web Development' },
        { key: 'description', label: 'Description', type: 'textarea' as const, required: true, placeholder: 'Describe this service...' },
        { key: 'icon', label: 'Icon Name (optional)', type: 'text' as const, placeholder: 'e.g., code, design, analytics' },
      ];
    case 'faq':
      return [
        { key: 'question', label: 'Question', type: 'text' as const, required: true, placeholder: 'What is your question?' },
        { key: 'answer', label: 'Answer', type: 'textarea' as const, required: true, placeholder: 'Provide a clear answer...' },
      ];
    case 'testimonials':
      return [
        { key: 'name', label: 'Customer Name', type: 'text' as const, required: true, placeholder: 'e.g., John Doe' },
        { key: 'position', label: 'Position/Title', type: 'text' as const, required: true, placeholder: 'e.g., CEO at Company' },
        { key: 'content', label: 'Testimonial', type: 'textarea' as const, required: true, placeholder: 'What did they say about your services?' },
        { key: 'rating', label: 'Rating (1-5)', type: 'text' as const, placeholder: '5' },
      ];
    default:
      return [
        { key: 'title', label: 'Title', type: 'text' as const },
        { key: 'description', label: 'Description', type: 'textarea' as const },
      ];
  }
}
