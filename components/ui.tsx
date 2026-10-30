// Minimal shadcn/ui style components (refs ISSUE-20).
// Plain Tailwind classes, same visual language as shadcn/ui: button, card,
// input, select, and a small badge. No other UI framework is used.
// No em dashes are used in this file.
'use client';
import React from 'react';

export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={'inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ' + (props.className || '')}
    >{children}</button>
  );
}
export function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-50 ' + (props.className || '')}
    >{children}</button>
  );
}
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={'rounded-lg border border-slate-200 bg-white p-4 shadow-sm ' + className}>{children}</div>;
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<span className="mt-1 block">{children}</span></label>;
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={'w-full rounded-md border border-slate-300 px-3 py-2 text-sm ' + (props.className || '')} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ' + (props.className || '')} />;
}
export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{message}</p>;
}
