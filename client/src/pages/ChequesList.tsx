import { useCheques, useProcessCheque } from "@/hooks/use-cheques";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { AIAnalysisModal } from "@/components/AIAnalysisModal";
import { Search, Filter, Loader2, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { type Cheque } from "@shared/schema";

export default function ChequesList() {
  const { data: cheques, isLoading } = useCheques();
  const { mutate: processCheque, isPending: isProcessing } = useProcessCheque();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);

  const filteredCheques = cheques?.filter(c => {
    const matchesSearch = c.payeeName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleProcess = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    processCheque(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Cheques List</h1>
          <p className="text-muted-foreground">Manage and track all cheque clearances.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search payee..." 
              className="pl-9 w-[200px] bg-card border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="h-10 rounded-md border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CLEARED">Cleared</option>
            <option value="BOUNCED">Bounced</option>
            <option value="FRAUD">Fraud</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredCheques?.map((cheque) => (
              <motion.div
                key={cheque.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <Card 
                  className="group hover:border-primary/50 transition-all cursor-pointer bg-card/50 backdrop-blur-sm"
                  onClick={() => setSelectedCheque(cheque)}
                >
                  <CardContent className="p-5 flex flex-col md:flex-row items-center gap-6">
                    {/* Image Preview */}
                    <div className="w-full md:w-24 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={cheque.imageUrl} 
                        alt="Cheque" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      {cheque.status === "PENDING" && (
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                           <span className="text-xs text-white font-medium">Draft</span>
                         </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="font-semibold text-foreground">{cheque.payeeName}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        ID: #{cheque.id.toString().padStart(6, '0')}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg text-foreground">
                        ${(cheque.amount / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(cheque.createdAt || Date.now()), 'MMM dd, HH:mm')}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-4 min-w-[140px] justify-end">
                      <StatusBadge status={cheque.status} />
                      
                      {cheque.status === "PENDING" && (
                        <Button 
                          size="sm" 
                          className="ml-2"
                          onClick={(e) => handleProcess(e, cheque.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredCheques?.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No cheques found matching your criteria.
            </div>
          )}
        </div>
      )}

      <AIAnalysisModal 
        cheque={selectedCheque} 
        isOpen={!!selectedCheque} 
        onClose={() => setSelectedCheque(null)} 
      />
    </div>
  );
}
