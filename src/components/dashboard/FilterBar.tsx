'use client';

interface Filters {
  magnitude: number;
  timeRange: string;
  region: string;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-gray-50 p-4 border-y flex flex-wrap gap-4 items-center">
      {/* Filtro de magnitude */}
      <div className="flex flex-col">
        <label htmlFor="magnitude-filter" className="text-sm text-gray-600 mb-1">
          Magnitude mínima: {filters.magnitude}
        </label>
        <input
          id="magnitude-filter"
          type="range"
          min="0"
          max="8"
          step="0.5"
          value={filters.magnitude}
          onChange={(e) => onFilterChange({ magnitude: parseFloat(e.target.value) })}
          className="w-36"
          style={{ accentColor: '#3b82f6' }} // Alternativa universal para accent-color
        />
      </div>

      {/* Filtro de tempo */}
      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">
          Período de tempo
        </label>
        <div className="flex space-x-1">
          {['1h', '6h', '12h', '24h'].map((range) => (
            <button
              key={range}
              className={`px-3 py-1 text-sm rounded-md ${filters.timeRange === range
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              onClick={() => onFilterChange({ timeRange: range })}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de região (exemplo básico) */}
      <div className="flex flex-col">
        <label htmlFor="region-filter" className="text-sm text-gray-600 mb-1">
          Região
        </label>
        <select
          id="region-filter"
          value={filters.region}
          onChange={(e) => onFilterChange({ region: e.target.value })}
          className="px-3 py-1 border rounded-md text-sm bg-white"
        >
          <option value="all">Todas as regiões</option>
          <option value="us">Estados Unidos</option>
          <option value="japan">Japão</option>
          <option value="pacific">Pacífico</option>
          <option value="europe">Europa</option>
          <option value="alaska">Alasca</option>
          <option value="california">Califórnia</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;