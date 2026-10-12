import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().trim().min(1, 'Название обязательно').max(255),
  description: z.string().max(5000).nullable().optional(),
  location: z.string().max(255).nullable().optional(),
  startTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Некорректная дата начала'),
  endTime: z.string().refine((v) => !isNaN(Date.parse(v)), 'Некорректная дата окончания'),
  allDay: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Некорректный цвет').optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
});

const isoDate = z.string().refine((v) => !isNaN(Date.parse(v)), 'Некорректная дата');

export const eventsQuerySchema = z
  .object({ rangeStart: isoDate.optional(), rangeEnd: isoDate.optional() })
  .refine((q) => !q.rangeStart === !q.rangeEnd, 'rangeStart и rangeEnd передаются вместе');
