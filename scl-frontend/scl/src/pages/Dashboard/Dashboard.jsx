import { BookOpen, Clock, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { useAuthStore } from "../../store/authStore";

const stats = [
  { name: "Total Documents", value: "24", icon: FileText, change: "+3 this week" },
  { name: "Study Hours", value: "18.5", icon: Clock, change: "+2.5 from last week" },
  { name: "Courses Active", value: "4", icon: BookOpen, change: "On track" },
  { name: "Average Score", value: "92%", icon: TrendingUp, change: "+5% overall" },
];

export function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-slate-900">
          Welcome back, {user?.name || "Student"}
        </h1>
        <p className="text-slate-600">Here's an overview of your academic progress today.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">Machine Learning Lecture {i}</h4>
                        <p className="text-sm text-slate-500">Uploaded 2 days ago • PDF</p>
                      </div>
                    </div>
                    <span className="text-sm text-primary-600 font-medium">View</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-accent-50 border border-accent-100">
                  <h4 className="font-medium text-slate-900 mb-1">Review Chapter 4</h4>
                  <p className="text-sm text-slate-600 mb-3">Based on your recent questions, revisiting this chapter might help solidify your understanding.</p>
                  <button className="text-sm font-medium text-accent-700 hover:text-accent-800">
                    Open Document &rarr;
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
