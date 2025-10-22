'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import axios from 'axios';

interface ListEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  sectionName: string;
  sectionKey: string;
  initialData: any[];
  onSaved: () => void;
  fields: FieldConfig[];
  itemIndex?: number; // If provided, only edit this single item
  allItems?: any[]; // Full array when editing single item
}

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
  required?: boolean;
}

export default function ListEditorModal({
  isOpen,
  onClose,
  sectionName,
  sectionKey,
  siteId,
  initialData,
  onSaved,
  fields,
  itemIndex,
  allItems,
}: ListEditorModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isSingleItemMode = itemIndex !== undefined;

  useEffect(() => {
    if (isOpen && initialData) {
      setItems(JSON.parse(JSON.stringify(initialData))); // Deep clone
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialData]);

  const handleAddItem = () => {
    const newItem: any = {};
    fields.forEach(field => {
      newItem[field.key] = '';
    });
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, fieldKey: string, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [fieldKey]: value };
    setItems(updatedItems);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('customer_access_token');

      // If editing a single item, merge it back into the full array
      const dataToSave = isSingleItemMode && allItems && itemIndex !== undefined
        ? allItems.map((item, idx) => idx === itemIndex ? items[0] : item)
        : items;

      await axios.patch(
        `/customer/sites/${siteId}/content/pages/${sectionKey}`,
        {
          section: sectionKey,
          data: dataToSave,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save:', err);
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit {sectionName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">Changes saved successfully!</p>
            </div>
          )}

          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                {!isSingleItemMode && (
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="absolute top-4 right-4 text-red-600 hover:text-red-700 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <div className={`space-y-4 ${isSingleItemMode ? '' : 'pr-12'}`}>
                  {fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={item[field.key] || ''}
                          onChange={(e) => handleFieldChange(index, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                          rows={3}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type="text"
                          value={item[field.key] || ''}
                          onChange={(e) => handleFieldChange(index, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No items yet. Click "Add Item" to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between bg-gray-50">
          {!isSingleItemMode && (
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}

          <div className={`flex items-center gap-3 ${isSingleItemMode ? 'ml-auto' : ''}`}>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
