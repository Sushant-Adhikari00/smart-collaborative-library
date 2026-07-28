import { useState, useRef } from 'react';
import { 
  ZoomInIcon, 
  ZoomOutIcon, 
  MaximizeIcon, 
  SearchIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  FileTextIcon, 
  DownloadIcon
} from 'lucide-react';

const PdfViewer = ({ fileUrl, title }) => {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 15, 50));

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error("Error attempting to enable full screen:", err);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-base-300 rounded-xl overflow-hidden border border-base-300">
      {/* Viewer Toolbar */}
      <div className="bg-base-200 border-b border-base-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm shrink-0">
        {/* Left: Page navigation */}
        <div className="flex items-center gap-2">
          <button 
            disabled={currentPage <= 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="btn btn-ghost btn-xs btn-square"
            title="Previous Page"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <span className="text-xs font-medium text-base-content/80">
            Page <input 
              type="number" 
              value={currentPage} 
              onChange={(e) => setCurrentPage(Number(e.target.value))} 
              className="w-10 text-center bg-base-100 border border-base-300 rounded text-xs py-0.5" 
            /> of {totalPages}
          </span>
          <button 
            disabled={currentPage >= totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="btn btn-ghost btn-xs btn-square"
            title="Next Page"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>

        {/* Middle: Search inside PDF */}
        <div className="relative flex-1 max-w-xs">
          <input 
            type="text" 
            placeholder="Search inside PDF..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-xs input-bordered w-full pr-7 bg-base-100 text-xs"
          />
          <SearchIcon className="size-3.5 absolute right-2 top-2 text-base-content/40" />
        </div>

        {/* Right: Zoom & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-base-100 px-2 py-0.5 rounded border border-base-300">
            <button onClick={handleZoomOut} className="hover:text-primary" title="Zoom Out">
              <ZoomOutIcon className="size-3.5" />
            </button>
            <span className="text-xs font-medium w-9 text-center">{zoom}%</span>
            <button onClick={handleZoomIn} className="hover:text-primary" title="Zoom In">
              <ZoomInIcon className="size-3.5" />
            </button>
          </div>

          <button onClick={toggleFullScreen} className="btn btn-ghost btn-xs btn-square" title="Full Screen">
            <MaximizeIcon className="size-4" />
          </button>
          {/* Fullscreen toggle */}
        </div>
      </div>

      {/* Main Canvas / Frame View */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-base-300/60 relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-base-content/60">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-xs">Loading PDF document...</p>
          </div>
        ) : fileUrl ? (
          <div 
            style={{ width: `${zoom}%`, transition: 'width 0.2s ease-out' }} 
            className="bg-white text-slate-900 rounded-lg shadow-xl min-h-[750px] p-2 transition-all flex flex-col justify-between"
          >
            <iframe 
              src={`${fileUrl}#page=${currentPage}`} 
              className="w-full h-[700px] rounded border-0" 
              title={title || "PDF Document"} 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-base-content/50 gap-2">
            <FileTextIcon className="size-16 stroke-1 text-base-content/30" />
            <p className="text-sm font-medium">Document Preview Not Available</p>
            <p className="text-xs text-base-content/40">You can download the resource to view locally.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
