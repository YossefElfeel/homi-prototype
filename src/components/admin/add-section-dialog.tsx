'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/field';
import { useStore } from '@/mock/store';

/**
 * A new section of /construction.
 *
 * A dialog rather than a field on the page, and the reason is how often each
 * is used. Adding a trade happens a few times in the life of the business;
 * captioning and reordering pictures happens every week. A labelled text box
 * for the rare thing, sitting permanently between the tabs and the grid, put
 * the yearly job in the middle of the weekly one.
 *
 * It asks for one thing. The German title is the only field a section cannot
 * do without — §20.6 makes German the fallback for the other three, and the
 * two-colour display heading and the paragraph are writing that happens next,
 * in the editor this opens into.
 */
export function AddSectionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const t = useTranslations('admin.construction');
  const actionsT = useTranslations('actions');

  const sections = useStore((s) => s.data.constructionSections);
  const addSection = useStore((s) => s.addConstructionSection);

  const [title, setTitle] = useState('');

  const trimmed = title.trim();
  /* Not a uniqueness rule on the id — the store already makes that unique on
     its own. This is about the *reader*: two tabs reading «Spanndecken» are
     two tabs nobody can tell apart, whatever their ids say. */
  const duplicate = sections.some(
    (sec) => (sec.title.de ?? '').trim().toLowerCase() === trimmed.toLowerCase() && trimmed !== '',
  );

  function submit() {
    if (!trimmed || duplicate) return;
    const id = addSection(trimmed);
    setTitle('');
    onOpenChange(false);
    onCreated(id);
    toast.success(t('sectionAddDone'));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sectionNewTitle')}</DialogTitle>
          <DialogDescription>{t('sectionNewBody')}</DialogDescription>
        </DialogHeader>

        <Field label={t('sectionTitle')} hint={t('sectionNewHint')}>
          {(props) => (
            <Input
              {...props}
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          )}
        </Field>

        {duplicate && (
          <p className="text-sm text-status-danger-fg">{t('sectionDuplicate')}</p>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {actionsT('cancel')}
          </Button>
          <Button disabled={!trimmed || duplicate} onClick={submit}>
            {t('sectionAdd')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
