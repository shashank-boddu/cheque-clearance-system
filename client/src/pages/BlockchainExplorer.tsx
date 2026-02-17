import { useBlocks } from "@/hooks/use-blocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Blocks, Hash, Clock, Database } from "lucide-react";
import { format } from "date-fns";

export default function BlockchainExplorer() {
  const { data: blocks } = useBlocks();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-accent/10 rounded-xl">
          <Blocks className="w-8 h-8 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Blockchain Ledger</h1>
          <p className="text-muted-foreground">Immutable record of all cleared transactions.</p>
        </div>
      </div>

      <div className="relative pl-8 border-l-2 border-border/50 space-y-12">
        {blocks?.map((block, index) => (
          <motion.div
            key={block.index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Connector Node */}
            <div className="absolute -left-[41px] top-6 w-5 h-5 rounded-full bg-background border-4 border-accent shadow-lg shadow-accent/20 z-10" />

            <Card className="bg-card/80 backdrop-blur border-border/50 hover:border-accent/50 transition-colors">
              <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                      BLOCK #{block.index}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground break-all">
                      {block.hash}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(Number(block.timestamp)), "PPpp")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1 mb-1">
                      <Hash className="w-3 h-3" /> Previous Hash
                    </span>
                    <div className="font-mono text-xs bg-black/20 p-2 rounded border border-white/5 break-all text-muted-foreground">
                      {block.previousHash}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1 mb-1">
                      <Database className="w-3 h-3" /> Transaction Data
                    </span>
                    <div className="font-mono text-xs bg-black/20 p-2 rounded border border-white/5 overflow-x-auto text-emerald-400">
                      {JSON.stringify(block.data, null, 2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {blocks?.length === 0 && (
          <div className="text-muted-foreground text-sm italic">
            Genesis block waiting to be mined...
          </div>
        )}
      </div>
    </div>
  );
}
