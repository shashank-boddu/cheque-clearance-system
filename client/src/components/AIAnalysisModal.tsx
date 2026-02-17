import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { type Cheque } from "@shared/schema";
import { ShieldCheck, ShieldAlert, Fingerprint, FileSearch, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAnalysisModalProps {
  cheque: Cheque | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAnalysisModal({ cheque, isOpen, onClose }: AIAnalysisModalProps) {
  if (!cheque) return null;

  const isRisk = cheque.riskLevel === "High";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isRisk ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
            )}>
              {isRisk ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-display">AI Fraud Analysis</DialogTitle>
              <DialogDescription>
                Detailed breakdown of automated verification for Cheque #{cheque.id}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Signature Analysis */}
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Fingerprint className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Signature Match</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confidence Score</span>
                <span className="font-mono font-bold">{cheque.signatureScore}%</span>
              </div>
              <Progress value={cheque.signatureScore || 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Compared against payer's historical signature database.
              </p>
            </div>
          </div>

          {/* Tamper Detection */}
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <FileSearch className="w-5 h-5 text-accent" />
              <h4 className="font-semibold">Tamper Check</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={cheque.tamperStatus === "High" ? "destructive" : "secondary"} className="uppercase">
                {cheque.tamperStatus} Risk
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Analyzed for pixel inconsistencies, digital alterations, and ink flow patterns.
            </p>
          </div>

          {/* Duplicate Check */}
          <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-blue-400" />
              <h4 className="font-semibold">Ledger Verification</h4>
            </div>
             <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duplicate Check</span>
              <Badge variant={cheque.duplicateCheck === "Passed" ? "outline" : "destructive"} className={cn(
                "uppercase",
                cheque.duplicateCheck === "Passed" && "text-emerald-500 border-emerald-500/50 bg-emerald-500/10"
              )}>
                {cheque.duplicateCheck}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Cross-referenced against global blockchain ledger for double-spending.
            </p>
          </div>

           {/* Risk Summary */}
           <div className={cn(
             "bg-muted/30 rounded-xl p-5 border border-border/50",
             isRisk ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"
           )}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className={cn("w-5 h-5", isRisk ? "text-red-500" : "text-emerald-500")} />
              <h4 className="font-semibold">Risk Assessment</h4>
            </div>
            <div className="flex flex-col gap-2">
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Final Risk Level</span>
                 <span className={cn("font-bold", isRisk ? "text-red-500" : "text-emerald-500")}>{cheque.riskLevel}</span>
               </div>
               <div className="h-px bg-border/50 my-2" />
               <p className="text-xs opacity-80">
                 {isRisk 
                   ? "Transaction flagged for manual review due to high risk indicators." 
                   : "Transaction approved for automatic clearance."}
               </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
