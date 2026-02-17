import { useCreateCheque, useProcessCheque } from "@/hooks/use-cheques";
import { useUsers } from "@/hooks/use-users";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud, DollarSign, User, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function UploadCheque() {
  const [, setLocation] = useLocation();
  const { mutateAsync: createCheque, isPending: isCreating } = useCreateCheque();
  const { mutate: processCheque } = useProcessCheque();
  const { data: users } = useUsers();

  const [formData, setFormData] = useState({
    payeeName: "",
    amount: "",
    payerAccountId: "",
    imageUrl: "https://images.unsplash.com/photo-1550565118-c974fb627141?w=800&auto=format&fit=crop" // Default placeholder
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.payeeName || !formData.amount || !formData.payerAccountId) return;

    try {
      // 1. Create Cheque
      const cheque = await createCheque({
        payeeName: formData.payeeName,
        amount: Math.round(parseFloat(formData.amount) * 100), // Convert to cents
        payerAccountId: parseInt(formData.payerAccountId),
        imageUrl: formData.imageUrl,
      });

      // 2. Auto-Process it
      processCheque(cheque.id);

      // 3. Redirect
      setLocation("/cheques");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold">Upload Cheque</h1>
        <p className="text-muted-foreground">Digitize and process a new cheque for clearance.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border bg-card/50 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Image Upload Area (Mocked) */}
              <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 text-center cursor-pointer bg-muted/20">
                <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="font-medium">Drag & drop cheque image</h3>
                <p className="text-xs text-muted-foreground mt-1">Or click to browse files</p>
                {/* Hidden input in real app */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Payee Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="John Doe" 
                      className="pl-9"
                      value={formData.payeeName}
                      onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      className="pl-9"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payer Account</Label>
                <Select 
                  onValueChange={(val) => setFormData({ ...formData, payerAccountId: val })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account to debit" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.accountNumber}) - Bal: ${(user.balance / 100).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                 <Label>Cheque Image URL (Optional Mock)</Label>
                 <div className="relative">
                    <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={formData.imageUrl} 
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="pl-9 text-xs font-mono text-muted-foreground"
                    />
                 </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit & Process"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
