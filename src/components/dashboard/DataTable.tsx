'use client';

import { useState, useMemo } from 'react';

interface DataItem {
  id: string;
  title: string;
  magnitude: number;
  depth: number;
  time: Date;
  place: string;
  coordinates: [number, number];
  type: string;
  status: string;
  url: string;
}

interface DataTableProps {
  data: DataItem[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sortField, setSortField] = useState<keyof DataItem>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const toggleSort = (field: keyof DataItem) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); 
    }
  };
  
  const processedData = useMemo(() => {
    let filteredData = data;
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filteredData = data.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.place.toLowerCase().includes(term) || 
        item.type.toLowerCase().includes(term)
      );
    }
    
    // Ordenar dados
    const sortedData = [...filteredData].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortedData;
  }, [data, searchTerm, sortField, sortDirection]);
  
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Pesquisar eventos..."
          className="w-full p-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); 
          }}
        />
      </div>
      
      <div className="flex-grow overflow-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('time')}
              >
                Hora {sortField === 'time' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('magnitude')}
              >
                Magnitude {sortField === 'magnitude' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('depth')}
              >
                Profundidade {sortField === 'depth' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('place')}
              >
                Local {sortField === 'place' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detalhes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.time.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span 
                      className={`font-medium px-2 py-1 rounded ${
                        item.magnitude >= 5 ? 'bg-red-100 text-red-800' : 
                        item.magnitude >= 3 ? 'bg-amber-100 text-amber-800' : 
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.magnitude.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.depth.toFixed(1)} km
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {item.place}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Ver detalhes
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                  Nenhum evento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Mostrando {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length} eventos
          </div>
          <div className="flex space-x-1">
            <button
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageToShow;
              if (totalPages <= 5) {
                pageToShow = i + 1;
              } else if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === pageToShow 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setCurrentPage(pageToShow)}
                >
                  {pageToShow}
                </button>
              );
            })}
            <button
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
