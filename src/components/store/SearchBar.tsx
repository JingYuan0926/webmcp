type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
};

export function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  return (
    <div className="search-wrap">
      <label htmlFor="catalog-search" className="search-label">
        Search the catalog
      </label>
      <div className="search-field">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m16.5 16.5 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id="catalog-search"
          type="search"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Try audio or desk"
        />
        <span aria-live="polite">{resultCount} items</span>
      </div>
    </div>
  );
}

