import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Visual/Brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary-950 p-12 text-white">
        <div>
          <div className="flex items-center gap-3 text-2xl font-display font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white">
              <span className="text-xl">S</span>
            </div>
            <span>SCL Platform</span>
          </div>
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-display font-bold leading-tight mb-6">
            Your AI-Powered Academic Companion
          </h1>
          <p className="text-lg text-primary-200">
            Upload documents, generate intelligent summaries, and collaborate seamlessly with peers and instructors.
          </p>
        </div>
        <div className="text-sm text-primary-400">
          © {new Date().getFullYear()} Smart Collaborative Learning. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
