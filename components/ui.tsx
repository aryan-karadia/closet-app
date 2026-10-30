// App UI barrel: re-exports the shadcn components in components/ui/.
// Pages should import shadcn components from here, or directly from
// components/ui/<component>. No hand written button, card, input, or
// select styling lives here anymore. Field and ErrorText are thin
// wrappers built on shadcn Label and Alert, kept so form pages stay
// readable. Pages use Button with variant="outline" directly for
// secondary actions. No em dashes are used in this file.
'use client';
import React from 'react';
import { cn } from 'cn';
import { Button as ShadcnButton } from './ui/button';
import { Card as ShadcnCard } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';

export { Button } from './ui/button';
export { buttonVariants } from './ui/button';
export { CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from './ui/card';
export { Input } from './ui/input';
export { Label } from './ui/label';
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from './ui/select';
export { Badge, badgeVariants } from './ui/badge';
export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption } from './ui/table';
export { Checkbox } from './ui/checkbox';
export { Switch } from './ui/switch';
export { Separator } from './ui/separator';
export { Alert, AlertTitle, AlertDescription, AlertAction } from './ui/alert';
export { Textarea } from './ui/textarea';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <ShadcnCard className={cn('p-4', className)}>{children}</ShadcnCard>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><Label>{label}</Label>{children}</div>;
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <Alert variant="destructive"><AlertDescription>{message}</AlertDescription></Alert>;
}
