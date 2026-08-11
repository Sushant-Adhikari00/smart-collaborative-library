import { useNavigate } from 'react-router';
import { LockIcon, SparklesIcon, X } from 'lucide-react';

/**
 * AuthPromptModal
 * Shown when a guest user tries to use a restricted feature.
 *
 * Props:
 *   isOpen    — boolean
 *   onClose   — callback to dismiss
 *   feature   — optional string describing what requires auth (e.g. "rate documents")
 */
export default function AuthPromptModal({ isOpen, onClose, feature }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center gap-5 border border-base-300 animate-pop relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 btn btn-ghost btn-circle btn-xs"
          title="Dismiss"
        >
          <X className="size-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary shadow-inner">
          <LockIcon className="size-7" />
        </div>

        {/* Heading */}
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold text-base-content">Login Required</h2>
          <p className="text-sm text-base-content/60 leading-relaxed">
            {feature
              ? <>You need to be logged in to <span className="font-semibold text-primary">{feature}</span>.</>
              : <>Please log in or create an account to access this feature.</>
            }
          </p>
        </div>

        {/* Perks list */}
        <ul className="w-full text-xs text-base-content/70 space-y-2 bg-base-200/50 rounded-xl px-4 py-3">
          {[
            'Rate and bookmark resources',
            'Comment & discuss with peers',
            'Chat with AI Assistant',
            'Collaborate in real-time workspaces',
            'Upload and manage your documents',
          ].map(perk => (
            <li key={perk} className="flex items-center gap-2">
              <SparklesIcon className="size-3 text-accent shrink-0" />
              {perk}
            </li>
          ))}
        </ul>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => { onClose(); navigate('/login'); }}
            className="btn btn-primary flex-1 font-bold"
          >
            Log In
          </button>
          <button
            onClick={() => { onClose(); navigate('/signup'); }}
            className="btn btn-outline btn-primary flex-1 font-bold"
          >
            Sign Up
          </button>
        </div>

        <p className="text-[11px] text-base-content/40 text-center">
          You can still <span className="font-semibold">browse and view</span> all documents without an account.
        </p>
      </div>
    </div>
  );
}
