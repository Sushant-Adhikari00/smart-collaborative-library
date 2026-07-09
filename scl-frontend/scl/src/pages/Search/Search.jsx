import { useState } from "react";
import { Search as SearchIcon, Filter, FileText, ChevronRight } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const mockResults = [
  { id: 1, title: "Machine Learning Basics", type: "PDF", snippet: "...which forms the foundation of modern neural networks. The loss function..." },
  { id: 2, title: "Advanced Data Structures", type: "PDF", snippet: "...B-Trees are heavily used in database indexing because of their..." },
  { id: 3, title: "Operating Systems Ch4", type: "PDF", snippet: "...multithreading allows concurrent execution of parts of a program..." },
];

export function Search() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-display font-bold text-slate-900">Semantic Search</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Search across all your documents using natural language. We'll find the exact concepts you're looking for.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center shadow-sm rounded-2xl bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all p-2">
          <SearchIcon className="absolute left-4 h-6 w-6 text-slate-400" />
          <input
            type="text"
            className="w-full h-14 pl-12 pr-4 bg-transparent outline-none text-lg text-slate-900 placeholder:text-slate-400"
            placeholder="e.g., How does backpropagation work?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" size="lg" className="shrink-0" isLoading={isSearching}>
            Search
          </Button>
        </div>
        
        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-sm text-slate-500 mr-2 flex items-center">
            <Filter className="h-4 w-4 mr-1" /> Filters:
          </span>
          {['My Documents', 'Shared with me', 'Computer Science', 'Lectures'].map(chip => (
            <button key={chip} type="button" className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              {chip}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      <div className="space-y-4 mt-8">
        {mockResults.map((result) => (
          <div key={result.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-primary-300 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-xl shrink-0 mt-1 sm:mt-0">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                  {result.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                  <span className="font-semibold text-slate-900">Match: </span>
                  {result.snippet}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 group-hover:text-primary-600 hidden sm:flex">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
