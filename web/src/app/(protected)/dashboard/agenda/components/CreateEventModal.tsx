'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { agendaService } from '@/services/firebase/agenda';
import { toast } from 'sonner';
import { EventCategory } from '@/types';

const eventSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  location: z.string().min(1, 'Local é obrigatório'),
  category: z.enum(['Culto', 'Evento', 'Ensino', 'Grupo', 'Outro']),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      category: 'Evento',
    }
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      await agendaService.createEvent(data);
      toast.success('Evento criado com sucesso!');
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Erro ao criar evento');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...register('title')} placeholder="Ex: Culto de Jovens" />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" type="time" {...register('time')} />
              {errors.time && <p className="text-xs text-red-500">{errors.time.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input id="location" {...register('location')} placeholder="Ex: Templo Principal" />
            {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select 
              onValueChange={(value) => setValue('category', value as EventCategory)}
              defaultValue="Evento"
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Culto">Culto</SelectItem>
                <SelectItem value="Evento">Evento</SelectItem>
                <SelectItem value="Ensino">Ensino</SelectItem>
                <SelectItem value="Grupo">Grupo</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea 
              id="description" 
              {...register('description')} 
              placeholder="Detalhes sobre o evento..." 
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Criar Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
