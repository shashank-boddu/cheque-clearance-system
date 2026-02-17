import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useBlocks() {
  return useQuery({
    queryKey: [api.blocks.list.path],
    queryFn: async () => {
      const res = await fetch(api.blocks.list.path);
      if (!res.ok) throw new Error("Failed to fetch blockchain data");
      return api.blocks.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll every 5s to simulate live blockchain updates
  });
}
