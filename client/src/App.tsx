import { Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import MapView from "@/pages/map-view";
import ListView from "@/pages/list-view";
import SourcesView from "@/pages/sources-view";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Route path="/" component={AnalyticsDashboard} />
        <Route path="/map" component={MapView} />
        <Route path="/list" component={ListView} />
        <Route path="/sources" component={SourcesView} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
