import { useEffect, useState } from "react";
import { BookOpen, Clock, FileText, TrendingUp, Sparkles, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";
import { recommendationApi } from "../../services/collaborationApi";
import ResourceViewerModal from "../../components/viewer/ResourceViewerModal";

export function Dashboard() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [docsRes, recsRes] = await Promise.all([
          api.get("/documents"),
          recommendationApi.getRecommendations()
        ]);
        
        if (docsRes.data && docsRes.data.data) {
          setDocuments(docsRes.data.data);
        }
        setRecommendations(recsRes || []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Compute real stats dynamically
  const totalDocs = documents.length;
  const userDocsCount = documents.filter(doc => doc.uploadedBy === user?.name || doc.uploadedBy === user?.email).length;
  
  const stats = [
    { name: "Total Documents", value: totalDocs, icon: FileText, change: "Library resources" },
    { name: "My Uploads", value: userDocsCount, icon: BookOpen, change: "Contributed" },
    { name: "AI recommendations", value: recommendations.length, icon: Sparkles, change: "Dynamic fit" },
    { name: "Active User", value: user ? "Yes" : "Guest", icon: Clock, change: user?.role || "Student" },
  ];

  // Get most recent 4 documents
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-slate-900">
          Welcome back, {user?.name || "Student"}
        </h1>
        <p className="text-slate-600">Here's an overview of your academic progress and tailored resource recommendations.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <p className="mt-2 text-3xl font-display font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-slate-600">
                <span>{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Documents */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
              ) : recentDocs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-4">
                  {recentDocs.map((doc) => (
                    <div 
                      key={doc.id} 
                      onClick={() => setSelectedDoc(doc)}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-primary/20 transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                          <p className="text-xs text-slate-500">
                            {doc.categoryName || "General"} • {doc.fileType?.toUpperCase()} • {doc.uploadedBy}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-primary-600 font-bold bg-primary/5 px-2.5 py-1 rounded-md">View</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-md text-accent"></span>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-sm text-slate-600">No tailored recommendations available yet.</p>
                  <p className="text-xs text-slate-500 mt-2">Rate documents in the library or upload files to get personalized academic suggestions!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((doc) => (
                    <div 
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className="p-4 rounded-xl bg-accent-50/40 border border-accent-100/60 hover:bg-accent-50 hover:border-accent-200 transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded bg-accent-100 text-[10px] font-bold text-accent-800 uppercase tracking-wider">
                          {doc.categoryName || "General"}
                        </span>
                        <div className="flex items-center gap-1 text-warning text-xs font-bold">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          <span>AI Recommended</span>
                        </div>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-1 line-clamp-1">{doc.title}</h4>
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                        {doc.description || "Revisiting this resource will help solidify your course concepts."}
                      </p>
                      <button className="text-xs font-bold text-accent-700 hover:text-accent-800 flex items-center gap-1">
                        Read Resource &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resource Viewer Modal */}
      {selectedDoc && (
        <ResourceViewerModal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          note={selectedDoc}
        />
      )}
    </div>
  );
}
