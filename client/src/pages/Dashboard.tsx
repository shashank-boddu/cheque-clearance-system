import { useCheques } from "@/hooks/use-cheques";
import { useBlocks } from "@/hooks/use-blocks";
import { useUsers } from "@/hooks/use-users";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Wallet,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: cheques } = useCheques();
  const { data: blocks } = useBlocks();
  const { data: users } = useUsers();

  const totalProcessed = cheques?.filter(c => c.status !== 'PENDING').length || 0;
  const totalFraud = cheques?.filter(c => c.status === 'FRAUD').length || 0;
  const totalVolume = cheques?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const recentBlocks = blocks?.slice(0, 5) || [];
  
  // Mock data for the chart based on loaded cheques
  const chartData = cheques?.slice(-7).map((c, i) => ({
    name: format(new Date(c.createdAt || Date.now()), 'MMM dd'),
    amount: c.amount / 100,
  })) || [];

  const stats = [
    {
      title: "Total Volume",
      value: `$${(totalVolume / 100).toLocaleString()}`,
      change: "+12.5%",
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Processed Cheques",
      value: totalProcessed,
      change: "+4",
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Fraud Detected",
      value: totalFraud,
      change: "2 detected",
      icon: AlertTriangle,
      color: "text-rose-500",
      bg: "bg-rose-500/10"
    },
    {
      title: "Active Accounts",
      value: users?.length || 0,
      change: "Stable",
      icon: Wallet,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Real-time overview of clearance operations and blockchain ledger.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 bg-card hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className={`text-xs font-medium ${
                    stat.change.includes('+') ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold font-display mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="col-span-1 lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Blocks</CardTitle>
            <Activity className="w-4 h-4 text-primary animate-pulse" />
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-0">
              {recentBlocks.map((block) => (
                <div key={block.hash} className="px-6 py-4 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-primary">#{block.index}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(Number(block.timestamp)), 'HH:mm:ss')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-sm font-mono text-muted-foreground truncate w-full">
                      {block.hash.substring(0, 16)}...
                    </p>
                  </div>
                </div>
              ))}
              {recentBlocks.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No blocks mined yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cheques */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Cheques</CardTitle>
          <Link href="/cheques" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 pl-2">Payee</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {cheques?.slice(0, 5).map((cheque) => (
                  <tr key={cheque.id} className="group border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 pl-2 font-medium">{cheque.payeeName}</td>
                    <td className="py-3 text-emerald-500 font-mono font-medium">
                      ${(cheque.amount / 100).toFixed(2)}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {cheque.createdAt ? format(new Date(cheque.createdAt), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={cheque.status} />
                    </td>
                    <td className="py-3 text-right pr-2">
                      <Link href={`/cheques?id=${cheque.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
