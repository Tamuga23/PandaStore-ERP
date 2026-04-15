import React, { useState } from 'react';
import { PackageSearch, Search, RefreshCw, Image as ImageIcon } from 'lucide-react';

interface InventoryViewProps {
  inventory: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function InventoryView({ inventory, isLoading, onRefresh }: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const id = (item.id || item.ID || '').toString().toLowerCase();
    const name = (item.description || item.Description || item.name || item.Name || '').toLowerCase();
    return id.includes(searchLower) || name.includes(searchLower);
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <PackageSearch className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Inventario Disponible</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ID o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Actualizar inventario"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <th className="p-3 font-medium">Imagen</th>
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">Descripción</th>
              <th className="p-3 font-medium text-right">Precio USD</th>
              <th className="p-3 font-medium text-center">Stock</th>
              <th className="p-3 font-medium text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item, idx) => {
                const id = item.id || item.ID;
                const name = item.description || item.Description || item.name || item.Name;
                const price = parseFloat(item.priceUSD || item['Precio USD'] || item.price || 0).toFixed(2);
                const stock = parseInt(item.stock || item.Stock || item.cantidad || 0);
                const status = item.status || item.Status || item.estado || item.Estado || 'Desconocido';
                const image = item.image || item.Image || item.imagen || item.Imagen;
                
                return (
                  <tr key={id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm">
                    <td className="p-3">
                      {image ? (
                        <img src={image} alt={name} className="w-10 h-10 object-cover rounded shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shadow-sm">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium text-gray-900">{id}</td>
                    <td className="p-3 text-gray-700">{name}</td>
                    <td className="p-3 text-right font-mono text-gray-600">${price}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {stock}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.toLowerCase() === 'activo' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  {isLoading ? 'Cargando inventario...' : 'No se encontraron artículos en el inventario.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
