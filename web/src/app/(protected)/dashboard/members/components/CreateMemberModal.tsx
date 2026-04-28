'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

const schema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['member', 'secretary', 'pastor', 'visitor']),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMemberModal({ isOpen, onClose, onSuccess }: CreateMemberModalProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'member'
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success('Membro criado com sucesso!');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar membro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Novo Membro
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo membro no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input id="full_name" {...register('full_name')} placeholder="Ex: João Silva" />
            {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha Provisória</Label>
              <Input id="password" type="password" {...register('password')} placeholder="******" />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cargo / Role</Label>
              <Select onValueChange={(v) => setValue('role', v as any)} defaultValue="member">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="secretary">Secretária</SelectItem>
                  <SelectItem value="pastor">Pastor</SelectItem>
                  <SelectItem value="visitor">Visitante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register('phone')} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input id="birth_date" type="date" {...register('birth_date')} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cadastrar Membro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
