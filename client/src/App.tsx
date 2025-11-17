import { Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AnalyticsDashboard from "@/pages/analytics-dashboard";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Route path="/" component={AnalyticsDashboard} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
