import React, { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Upload, X } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';
import { CompanyInfo } from '../types';

interface CompanySettingsProps {
  scriptUrl: string;
  initialData: CompanyInfo | null;
  onSuccess: () => void;
}

export function CompanySettings({ scriptUrl, initialData, onSuccess }: CompanySettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<CompanyInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
    logo: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImage(file);
      setFormData(prev => ({ ...prev, logo: compressedBase64 }));
    } catch (error) {
      console.error("Error compressing image:", error);
      setFeedback({ message: 'Error al procesar la imagen', type: 'error' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'update_company',
          ...formData,
        }),
        redirect: 'follow',
      });

      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (result.status === 'success') {
        setFeedback({ message: 'Configuración de la empresa actualizada exitosamente', type: 'success' });
        onSuccess(); // Refresh global app state
      } else {
        setFeedback({ message: result.message || 'Error al actualizar configuración', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating company info:', error);
      setFeedback({ message: 'Error de red al actualizar configuración', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="bg-slate-600 p-2 rounded-lg">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Configuración de la Empresa</h2>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-slate-500 outline-none"
              placeholder="Ej: Mi Empresa S.A."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-slate-500 outline-none"
              placeholder="Ej: +505 1234 5678"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <textarea
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-slate-500 outline-none resize-none"
              placeholder="Ej: Managua, Nicaragua"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-slate-500 outline-none"
              placeholder="Ej: contacto@miempresa.com"
            />
          </div>
          
          {/* Subida de Logo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Empresa</label>
            {formData.logo ? (
              <div className="relative w-48 h-32 border border-gray-200 rounded-lg overflow-hidden group bg-gray-50 flex items-center justify-center">
                <img src={formData.logo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                    <p className="text-xs text-gray-500">PNG, JPG o GIF (Max. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
}
