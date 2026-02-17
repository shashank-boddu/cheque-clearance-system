import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertCheque, type Cheque } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCheques() {
  return useQuery({
    queryKey: [api.cheques.list.path],
    queryFn: async () => {
      const res = await fetch(api.cheques.list.path);
      if (!res.ok) throw new Error("Failed to fetch cheques");
      return api.cheques.list.responses[200].parse(await res.json());
    },
  });
}

export function useCheque(id: number) {
  return useQuery({
    queryKey: [api.cheques.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.cheques.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch cheque details");
      return api.cheques.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateCheque() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCheque) => {
      const res = await fetch(api.cheques.create.path, {
        method: api.cheques.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload cheque");
      }
      return api.cheques.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cheques.list.path] });
      toast({
        title: "Cheque Uploaded",
        description: "The cheque has been submitted for processing.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useProcessCheque() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.cheques.process.path, { id });
      const res = await fetch(url, {
        method: api.cheques.process.method,
      });

      if (!res.ok) {
        throw new Error("Failed to process cheque");
      }
      return api.cheques.process.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.cheques.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.cheques.get.path, data.id] });
      // Also invalidate blocks and users because processing a cheque creates blocks and updates balances
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] }); 
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });

      toast({
        title: "Cheque Processed",
        description: `Status: ${data.status}`,
        variant: data.status === "CLEARED" ? "default" : "destructive",
      });
    },
  });
}
