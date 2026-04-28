'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Loader2, AlertCircle, Info } from 'lucide-react';
import { getGroups, createGroup } from '@/services/firebase/groups';
import { ChurchGroup } from '@/types';
import { toast } from 'sonner';

export default function GroupsPage() {
  const [groups, setGroups] = useState<ChurchGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      toast.error('Erro ao carregar grupos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setIsCreating(true);
    try {
      await createGroup(newGroupName, newGroupDesc);
      toast.success('Grupo criado com sucesso!');
      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups();
    } catch (error) {
      toast.error('Erro ao criar grupo');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Grupos & Ministérios</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie os departamentos e grupos oficiais da igreja.</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Creation Form */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Novo Grupo
            </h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Grupo</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Jovens, Louvor, Infantil"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição (Opcional)</label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Breve descrição do ministério..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !newGroupName.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Grupo'}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                Estes grupos ficarão disponíveis para seleção no Mural de Avisos e outras áreas do sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Groups List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Grupos Cadastrados
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
          ) : groups.length > 0 ? (
            <div className="grid gap-4">
              {groups.map((group) => (
                <div 
                  key={group.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold text-lg">
                      {group.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{group.name}</h3>
                      {group.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{group.description}</p>
                      )}
                    </div>
                  </div>
                  <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <p className="mt-4 text-slate-500">Nenhum grupo cadastrado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
