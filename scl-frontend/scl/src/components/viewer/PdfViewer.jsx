import { useState, useRef, useEffect } from 'react';
import { 
  MaximizeIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FileTextIcon
} from 'lucide-react';

const PdfViewer = ({ fileUrl, title }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);

  // Fetch the PDF binary stream and parse the page count dynamically using PDF metadata tags
  useEffect(() => {
    if (!fileUrl) return;
    setIsLoading(true);
    fetch(fileUrl)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        const text = new TextDecoder('utf-8').decode(new Uint8Array(buffer));
        
        // Match /Count metadata tag inside pages catalog
        const countMatches = text.match(/\/Count\s+(\d+)/g);
        if (countMatches) {
          let maxCount = 1;
          for (const m of countMatches) {
            const num = parseInt(m.match(/\d+/)[0], 10);
            if (num > maxCount) maxCount = num;
          }
          setTotalPages(maxCount);
        } else {
          // Fallback: match /Type /Page objects count
          const pageMatches = text.match(/\/Type\s*\/Page\b/g);
          if (pageMatches) {
            setTotalPages(pageMatches.length);
          }
        }
      })
      .catch(err => {
        console.error("Error reading PDF page count:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fileUrl]);

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
      <div className="bg-base-200 border-b border-base-300 px-4 py-2 flex items-center justify-between gap-3 text-sm shrink-0">
        {/* Left: Document Title */}
        <span className="font-semibold text-xs text-base-content/80 truncate max-w-[120px] md:max-w-xs">
          {title || "Document Preview"}
        </span>

        {/* Middle: Page navigation controls */}
        {!isLoading && fileUrl && (
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage <= 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="btn btn-ghost btn-xs btn-square"
              title="Previous Page"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <span className="text-[11px] font-medium text-base-content/85">
              Page <input 
                type="number" 
                min="1"
                max={totalPages}
                value={currentPage} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= totalPages) setCurrentPage(val);
                }} 
                className="w-8 text-center bg-base-100 border border-base-300 rounded py-0.5 font-bold" 
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
        )}

        {/* Right: Fullscreen Actions */}
        <div className="flex items-center gap-2">
          <button onClick={toggleFullScreen} className="btn btn-ghost btn-xs btn-square" title="Full Screen">
            <MaximizeIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas - Set to overflow-hidden and full height to prevent double scrollbars */}
      <div className="flex-1 overflow-hidden p-4 flex justify-center bg-base-300/60 relative h-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-base-content/60">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-xs">Loading document...</p>
          </div>
        ) : fileUrl ? (
          <div 
            className="bg-white text-slate-900 rounded-lg shadow-xl p-2 w-full h-full transition-all flex flex-col justify-between"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Added #toolbar=0&navpanes=0 to hide download and printing options in the built-in PDF viewer */}
            <iframe 
              src={`${fileUrl}#page=${currentPage}&toolbar=0&navpanes=0`} 
              className="w-full h-full rounded border-0" 
              title={title || "PDF Document"} 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-base-content/50 gap-2">
            <FileTextIcon className="size-16 stroke-1 text-base-content/30" />
            <p className="text-sm font-medium">Document Preview Not Available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
