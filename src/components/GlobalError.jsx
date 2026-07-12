import { useRouteError, useNavigate } from "react-router";

export const GlobalError = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="p-8 bg-card text-card-foreground rounded-2xl shadow-xl border border-destructive/50 max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-extrabold mb-4 text-primary">Oops! Something went wrong.</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Don't worry, your data is safe. We just hit a small bump in the road. Let's get you back on track.
        </p>
        
        {error && (
           <div className="bg-destructive/5 text-destructive text-xs font-mono p-4 rounded-lg mb-8 border border-destructive/20 text-left overflow-auto max-h-32">
             {error.statusText || error.message || String(error)}
           </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-primary/20 active:scale-[0.98] inline-flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </button>
      </div>
    </div>
  );
};
