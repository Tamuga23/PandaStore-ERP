import React, { useState } from 'react';
import { Package, Plus, Loader2, Save, Upload, X, Edit, PackagePlus } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

interface ProductCatalogProps {
  scriptUrl: string;
  inventory: any[];
  onSuccess: () => void;
}

export function ProductCatalog({ scriptUrl, inventory, onSuccess }: ProductCatalogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const existingCategories = Array.from(new Set(
    inventory
      .map(item => item.category || item.Category || item.categoria || item.Categoria)
      .filter(Boolean)
  )).sort();

  const [formData, setFormData] = useState({
    id: '',
    description: '',
    priceUSD: '',
    category: '',
    status: 'Activo',
    image: '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImage(file);
      setFormData(prev => ({ ...prev, image: compressedBase64 }));
    } catch (error) {
      console.error("Error compressing image:", error);
      setFeedback({ message: 'Error al procesar la imagen', type: 'error' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData({ id: '', description: '', priceUSD: '', category: '', status: 'Activo', image: '' });
      setIsCustomCategory(false);
      return;
    }
    const product = inventory.find(p => (p.id || p.ID) === selectedId);
    if (product) {
      const cat = product.category || product.Category || '';
      setIsCustomCategory(!existingCategories.includes(cat) && cat !== '');
      setFormData({
        id: selectedId,
        description: product.description || product.Description || product.name?.split(' - ')[1] || '',
        priceUSD: product.priceUSD !== undefined ? product.priceUSD : 
                  (product.defaultPriceUSD !== undefined ? product.defaultPriceUSD : 
                  (product['Precio USD'] || product.price || '')),
        category: cat,
        status: product.status || product.Status || 'Activo',
        image: product.image || product.Image || '',
      });
    }
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
          action: isEditing ? 'update_product' : 'add_product',
          ...formData,
          priceUSD: parseFloat(formData.priceUSD) || 0,
        }),
        redirect: 'follow',
      });

      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (result.status === 'success') {
        setFeedback({ message: isEditing ? 'Producto actualizado exitosamente' : 'Producto agregado exitosamente', type: 'success' });
        setFormData({
          id: '',
          description: '',
          priceUSD: '',
          category: '',
          status: 'Activo',
          image: '',
        });
        setIsCustomCategory(false);
        onSuccess(); // Refresh catalog if needed
      } else {
        setFeedback({ message: result.message || (isEditing ? 'Error al actualizar producto' : 'Error al agregar producto'), type: 'error' });
      }
    } catch (error) {
      console.error('Error adding/updating product:', error);
      setFeedback({ message: 'Error de red al procesar la solicitud', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="bg-green-600 p-2 rounded-lg">
          <Package className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Catálogo de Productos</h2>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedback.message}
        </div>
      )}

      {/* Toggle Nuevo vs Editar */}
      <div className="flex gap-2 mb-6 bg-gray-50 p-1 rounded-lg w-fit border border-gray-200">
        <button
          type="button"
          onClick={() => { setIsEditing(false); setFormData({ id: '', description: '', priceUSD: '', category: '', status: 'Activo', image: '' }); setIsCustomCategory(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${!isEditing ? 'bg-white text-green-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <PackagePlus className="w-4 h-4" />
          Nuevo Producto
        </button>
        <button
          type="button"
          onClick={() => { setIsEditing(true); setFormData({ id: '', description: '', priceUSD: '', category: '', status: 'Activo', image: '' }); setIsCustomCategory(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isEditing ? 'bg-white text-green-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Edit className="w-4 h-4" />
          Actualizar Existente
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID del Producto</label>
            {isEditing ? (
              <select
                name="id"
                required
                value={formData.id}
                onChange={handleProductSelect}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Seleccionar producto a editar...</option>
                {inventory.map((p, idx) => {
                  const id = p.id || p.ID;
                  const name = p.description || p.Description || p.name || p.Name;
                  return <option key={id || idx} value={id}>{id} - {name}</option>;
                })}
              </select>
            ) : (
              <input
                type="text"
                name="id"
                required
                value={formData.id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Ej: 1001"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Ej: Amazon Fire TV Stick 4K"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio USD</label>
            <input
              type="number"
              name="priceUSD"
              required
              min="0"
              step="0.01"
              value={formData.priceUSD}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            {!isCustomCategory ? (
              <select
                name="categorySelect"
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === 'NEW_CATEGORY') {
                    setIsCustomCategory(true);
                    setFormData(prev => ({ ...prev, category: '' }));
                  } else {
                    setFormData(prev => ({ ...prev, category: e.target.value }));
                  }
                }}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Seleccionar categoría...</option>
                {existingCategories.map((cat, idx) => (
                  <option key={idx} value={cat as string}>{cat as string}</option>
                ))}
                <option value="NEW_CATEGORY" className="font-semibold text-green-600">+ Agregar nueva categoría</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Nueva categoría..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setFormData(prev => ({ ...prev, category: '' }));
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
          
          {/* Subida de Imagen */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto (Opcional)</label>
            {formData.image ? (
              <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden group">
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
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
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isEditing ? 'Actualizar Producto' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
