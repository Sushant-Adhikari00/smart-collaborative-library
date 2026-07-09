import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export const Card = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = "Card";

export const CardHeader = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("px-6 py-4 border-b border-slate-100", className)} {...props}>
      {children}
    </div>
  );
});
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <h3 ref={ref} className={cn("text-lg font-semibold text-slate-900 font-display", className)} {...props}>
      {children}
    </h3>
  );
});
CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
});
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center", className)} {...props}>
      {children}
    </div>
  );
});
CardFooter.displayName = "CardFooter";
