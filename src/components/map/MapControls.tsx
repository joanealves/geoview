// components/map/MapControls.tsx
'use client';

import { useState } from 'react';

interface MapControlsProps {
    onSearch: (term: string) => void;
    onFilterChange: (filter: string) => void;
}

const MapControls: React.FC<MapControlsProps> = ({ onSearch, onFilterChange }) => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10">
            <div className="mb-4">
                <h3 className="font-bold mb-2">Busca</h3>
                <input
                    type="text"
                    placeholder="Pesquisar..."
                    className="border p-2 rounded w-full"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        onSearch(e.target.value);
                    }}
                />
            </div>

            <div>
                <h3 className="font-bold mb-2">Filtros</h3>
                <select
                    className="border p-2 rounded w-full"
                    onChange={(e) => onFilterChange(e.target.value)}
                >
                    <option value="all">Todos</option>
                    <option value="station">Estações</option>
                    <option value="event">Eventos</option>
                </select>
            </div>
        </div>
    );
};

export default MapControls;