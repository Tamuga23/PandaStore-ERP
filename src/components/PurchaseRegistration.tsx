import React, { useState } from 'react';
import { ShoppingCart, Loader2, Save, PackageSearch, PackagePlus, Upload, X } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

interface PurchaseRegistrationProps {
  scriptUrl: string;
  inventory: any[];
  onSuccess?: () => void;
}

export function PurchaseRegistration({ scriptUrl, inventory, onSuccess }: PurchaseRegistrationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);

  const existingCategories = Array.from(new Set(
    inventory
      .map(item => item.category || item.Category || item.categoria || item.Categoria)
      .filter(Boolean)
  )).sort();

  const [formData, setFormData] = useState({
    itemId: '',
    description: '',
    unitCost: '',
    quantity: '',
    supplier: '',
    platform: '',
    shippingChannel: '',
    shippingMode: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    catalogPriceUSD: '', // Para nuevo producto
    category: '', // Para nuevo producto
    image: '', // Para nuevo producto
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

  const SUPPLIERS = [
    "Amazon", "Shenzhen Hanying International Import & Export Co., Ltd.",
    "Magcubic Projectors Store", "70mai-Goldway Store", "Magcubic Store",
    "Transpeed Official Store", "XGODY Projector Flagship Store Store",
    "Xiaomi Mi Store", "HongKong Willvast Store", "Mi Global Zone Store",
    "Xiaomi Live Store", "Hongkong Willtrue Store", "Tapo",
    "Magcubic Flagship Store", "Hong Kong Goldway Store",
    "70mai Official Store", "Computer Online Store", "FANTACY TECHNOLOGY"
  ];
  const PLATFORMS = ["AliExpress", "Amazon", "ebay", "Alibaba"];
  const SHIPPING_CHANNELS = ["Correos de Nicaragua", "AWBOX Nicaragua", "Tetraigodetodo"];
  const SHIPPING_MODES = ["Sea Cargo", "Air Cargo"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'itemId' && !isNewProduct) {
      // Auto-completar descripción si es producto existente
      const selected = inventory.find(p => (p.id || p.ID) === value);
      setFormData(prev => ({
        ...prev,
        itemId: value,
        description: selected ? (selected.description || selected.Description || selected.name || selected.Name || '') : ''
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      // 1. Si es producto nuevo, primero lo agregamos al catálogo
      if (isNewProduct) {
        const productResponse = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'add_product',
            id: formData.itemId,
            description: formData.description,
            priceUSD: parseFloat(formData.catalogPriceUSD) || 0,
            category: formData.category,
            status: 'Activo',
            image: formData.image
          }),
          redirect: 'follow',
        });
        
        const productText = await productResponse.text();
        const productResult = JSON.parse(productText);
        
        if (productResult.status !== 'success') {
          throw new Error(productResult.message || 'Error al agregar el producto al catálogo');
        }
      }

      // 2. Registramos la compra
      const purchaseResponse = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'add_purchase',
          itemId: formData.itemId,
          description: formData.description,
          unitCost: parseFloat(formData.unitCost) || 0,
          quantity: parseInt(formData.quantity) || 0,
          supplier: formData.supplier,
          platform: formData.platform,
          shippingChannel: formData.shippingChannel,
          shippingMode: formData.shippingMode,
          acquisitionDate: formData.acquisitionDate,
        }),
        redirect: 'follow',
      });

      const responseText = await purchaseResponse.text();
      const result = JSON.parse(responseText);

      if (result.status === 'success') {
        setFeedback({ 
          message: isNewProduct ? 'Producto creado y compra registrada exitosamente' : 'Compra registrada exitosamente', 
          type: 'success' 
        });
        setFormData({
          itemId: '',
          description: '',
          unitCost: '',
          quantity: '',
          supplier: '',
          acquisitionDate: new Date().toISOString().split('T')[0],
          catalogPriceUSD: '',
          category: '',
          image: '',
        });
        if (onSuccess) onSuccess();
      } else {
        setFeedback({ message: result.message || 'Error al registrar compra', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error adding purchase:', error);
      setFeedback({ message: error.message || 'Error de red al registrar compra', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="bg-orange-600 p-2 rounded-lg">
          <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Registro de Compras</h2>
      </div>

      {feedback && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedback.message}
        </div>
      )}

      {/* Toggle Nuevo vs Existente */}
      <div className="flex gap-2 mb-6 bg-gray-50 p-1 rounded-lg w-fit border border-gray-200">
        <button
          type="button"
          onClick={() => setIsNewProduct(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${!isNewProduct ? 'bg-white text-orange-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <PackageSearch className="w-4 h-4" />
          Artículo Existente
        </button>
        <button
          type="button"
          onClick={() => setIsNewProduct(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isNewProduct ? 'bg-white text-orange-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <PackagePlus className="w-4 h-4" />
          Nuevo Artículo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ID del Artículo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID del Artículo</label>
            {!isNewProduct ? (
              <select
                name="itemId"
                required
                value={formData.itemId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">Seleccionar artículo...</option>
                {inventory.map((p, idx) => {
                  const id = p.id || p.ID;
                  const name = p.description || p.Description || p.name || p.Name;
                  return <option key={id || idx} value={id}>{id} - {name}</option>;
                })}
              </select>
            ) : (
              <input
                type="text"
                name="itemId"
                required
                value={formData.itemId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Ej: 1001"
              />
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Ej: Amazon Fire TV Stick 4K"
            />
          </div>

          {/* Campos Extra para Nuevo Producto */}
          {isNewProduct && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta USD (Catálogo)</label>
                <input
                  type="number"
                  name="catalogPriceUSD"
                  required={isNewProduct}
                  min="0"
                  step="0.01"
                  value={formData.catalogPriceUSD}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría (Catálogo)</label>
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
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {existingCategories.map((cat, idx) => (
                      <option key={idx} value={cat as string}>{cat as string}</option>
                    ))}
                    <option value="NEW_CATEGORY" className="font-semibold text-orange-600">+ Agregar nueva categoría</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
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
            </>
          )}

          {/* Campos Comunes de Compra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario USD (Compra)</label>
            <input
              type="number"
              name="unitCost"
              required
              min="0"
              step="0.01"
              value={formData.unitCost}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              name="quantity"
              required
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            {!isCustomSupplier ? (
              <select
                name="supplier"
                required
                value={formData.supplier}
                onChange={(e) => {
                  if (e.target.value === 'NEW_SUPPLIER') {
                    setIsCustomSupplier(true);
                    setFormData(prev => ({ ...prev, supplier: '' }));
                  } else {
                    handleChange(e);
                  }
                }}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">Seleccionar proveedor...</option>
                {SUPPLIERS.map((s, i) => <option key={i} value={s}>{s}</option>)}
                <option value="NEW_SUPPLIER" className="font-semibold text-orange-600">+ Agregar nuevo proveedor</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  name="supplier"
                  required
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Nombre del nuevo proveedor..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSupplier(false);
                    setFormData(prev => ({ ...prev, supplier: '' }));
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
            <select
              name="platform"
              required
              value={formData.platform}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="">Seleccionar plataforma...</option>
              {PLATFORMS.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canal de Envío</label>
            <select
              name="shippingChannel"
              required
              value={formData.shippingChannel}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="">Seleccionar canal...</option>
              {SHIPPING_CHANNELS.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
            <select
              name="shippingMode"
              required
              value={formData.shippingMode}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="">Seleccionar modalidad...</option>
              {SHIPPING_MODES.map((m, i) => <option key={i} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Adquisición</label>
            <input
              type="date"
              name="acquisitionDate"
              required
              value={formData.acquisitionDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isNewProduct ? 'Crear Producto y Registrar Compra' : 'Registrar Compra'}
          </button>
        </div>
      </form>
    </div>
  );
}
