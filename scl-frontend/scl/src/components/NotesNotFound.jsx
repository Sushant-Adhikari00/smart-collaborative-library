import { NotebookIcon } from "lucide-react";
import { Link } from "react-router";

const NotesNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 max-w-lg mx-auto text-center bg-base-100 rounded-lg shadow-xl p-8">
      <div className="bg-primary/20 rounded-full p-6 flex items-center justify-center">
        <NotebookIcon className="size-12 text-primary" />
      </div>
      <h3 className="text-3xl font-bold text-base-content">No notes found</h3>
      <p className="text-base-content/80 leading-relaxed">
        It looks like there are no notes to display. Start by creating a new note to organize your thoughts and ideas.
      </p>
      <Link to="/create" className="btn btn-primary btn-lg animate-bounce">
        Create Your First Note
      </Link>
    </div>
  );
};
export default NotesNotFound;