'use client';

import { useMemo } from 'react';
import { useAuth } from '@/store/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/paths';
import { useEffect } from 'react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Heart,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  trend?: number;
  colorClass: string;
  subLabel?: string;
  subValue?: number;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  colorClass,
  subLabel,
  subValue,
}: StatCardProps) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/80 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900/80">
    <div
      className={`absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-5 blur-2xl transition-all group-hover:opacity-10 ${colorClass.replace('text-', 'bg-')}`}
    ></div>

    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          <AnimatedNumber value={value} />
        </h3>
        {subValue !== undefined && (
          <p className="mt-1 text-xs text-slate-500">
            {subLabel}: <span className="font-medium text-slate-700 dark:text-slate-300">{subValue}</span>
          </p>
        )}
      </div>
      <div className={`rounded-xl p-3 shadow-inner ${colorClass} bg-opacity-10 ring-1 ring-blue-500/10 ring-inset`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>

    {trend !== undefined && (
      <div className="mt-4 flex items-center text-sm font-medium">
        <span className={`flex items-center ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
          {Math.abs(trend)}%
        </span>
        <span className="ml-2 text-slate-500">vs. mês anterior</span>
      </div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
        <p className="mb-2 font-semibold text-slate-900 dark:text-slate-200">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="mb-1 flex items-center gap-2 text-sm last:mb-0">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 dark:text-slate-400 capitalize">{entry.name}:</span>
            <span className="ml-auto font-medium text-slate-900 dark:text-slate-200">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const mockMonthlyData = [
  { month: 'Jan', membros: 45, pedidos: 12 },
  { month: 'Fev', membros: 52, pedidos: 18 },
  { month: 'Mar', membros: 48, pedidos: 15 },
  { month: 'Abr', membros: 61, pedidos: 22 },
  { month: 'Mai', membros: 75, pedidos: 28 },
  { month: 'Jun', membros: 89, pedidos: 25 },
];

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

const mockCategoryData = [
  { name: 'Homens', value: 35 },
  { name: 'Mulheres', value: 45 },
  { name: 'Jovens', value: 20 },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { permissions } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!permissions.canViewDashboardOverview) {
      router.replace(ROUTES.AUTHENTICATED.MURAL);
    }
  }, [permissions.canViewDashboardOverview, router]);

  if (!permissions.canViewDashboardOverview) {
    return null;
  }

  const userName = currentUser?.profile.full_name || 'Usuário';
  const firstName = userName.split(' ')[0];

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Bem-vindo ao painel de gestão do Hebrom Sys.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-10 px-4 text-sm font-medium">
            {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {permissions.canViewMetrics && (
          <StatCard
            title="Total de Membros"
            value={1248}
            icon={Users}
            trend={12}
            colorClass="text-blue-500"
            subLabel="Ativos"
            subValue={1150}
          />
        )}
        <StatCard
          title="Pedidos de Oração"
          value={42}
          icon={Heart}
          trend={-5}
          colorClass="text-rose-500"
          subLabel="Pendentes"
          subValue={8}
        />
        <StatCard
          title="Eventos este Mês"
          value={12}
          icon={Calendar}
          colorClass="text-amber-500"
          subLabel="Próximo"
          subValue={2}
        />
        <StatCard
          title="Novas Mensagens"
          value={8}
          icon={MessageSquare}
          trend={25}
          colorClass="text-emerald-500"
          subLabel="No Mural"
          subValue={3}
        />
      </div>

      {permissions.canViewMetrics && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Crescimento de Membros</h3>
                <p className="text-sm text-slate-500">Evolução nos últimos 6 meses</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:stroke-slate-800" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                  <Bar dataKey="membros" name="Novos Membros" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Distribuição por Perfil</h3>
                <p className="text-sm text-slate-500">Composição da congregação</p>
              </div>
            </div>
            <div className="flex h-[300px] w-full items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 dark:fill-white font-bold text-xl">
                    100%
                  </text>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-4 pr-4">
                {mockCategoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="text-sm text-slate-500">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ações Rápidas</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {permissions.canManageUsers && (
              <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <UserPlus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Novo Membro</span>
              </button>
            )}
            <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Heart className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-white">Novo Pedido</span>
            </button>
            {permissions.canManageAgenda && (
              <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Calendar className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Agendar Evento</span>
              </button>
            )}
            {permissions.canPostTargetedFeed && (
              <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Postar Mural</span>
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Aniversariantes</h3>
          <div className="space-y-4">
            {[
              { name: 'Maria Silva', date: 'Hoje', active: true },
              { name: 'João Santos', date: 'Amanhã', active: false },
              { name: 'Ana Oliveira', date: '29 de Jun', active: false },
            ].map((person, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{person.name}</p>
                  <p className="text-xs text-slate-500">{person.date}</p>
                </div>
                {person.active && (
                  <Badge className="bg-blue-500">Festa!</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
