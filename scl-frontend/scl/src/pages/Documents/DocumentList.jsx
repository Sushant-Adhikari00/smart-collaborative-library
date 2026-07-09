import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, FileText, Search, Filter } from "lucide-react";
import { useDocumentStore } from "../../store/documentStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function DocumentList() {
  const { documents, isLoading, fetchDocuments, uploadDocument } = useDocumentStore();
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadDocument(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadDocument(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600 mt-1">Manage, upload, and organize your academic materials.</p>
        </div>
        <Button onClick={() => document.getElementById('file-upload').click()}>
          <UploadCloud className="h-4 w-4 mr-2" />
          Upload New
        </Button>
      </div>

      {/* Upload Zone */}
      <div 
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-white hover:border-primary-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="p-4 bg-primary-50 rounded-full text-primary-600 mb-4">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Drag & drop your PDF here</h3>
          <p className="text-slate-500 mb-4">or click to browse from your computer</p>
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept="application/pdf"
            onChange={handleFileInput}
          />
          <Button variant="secondary" onClick={() => document.getElementById('file-upload').click()}>
            Browse Files
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-10" placeholder="Search documents..." />
        </div>
        <Button variant="secondary" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl border border-slate-200">
              <div className="h-10 w-10 bg-slate-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Link key={doc.id} to={`/documents/${doc.id}`} className="group block">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                    {doc.size}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                  {doc.title}
                </h3>
                <p className="text-sm text-slate-500 mt-auto pt-4">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
