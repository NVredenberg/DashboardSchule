import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { dashboardText } from '../i18n/dashboardText';
import { serviceIconNames, type ServiceIconName } from '../types/Service';

export type ServiceTileFormValue = {
  href: string;
  icon: ServiceIconName;
  name: string;
};

type ServiceTileDialogProps = {
  initialValue: ServiceTileFormValue;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (value: ServiceTileFormValue) => void;
  open: boolean;
};

const normalizeServiceHref = (href: string): string => {
  const trimmedHref = href.trim();

  if (trimmedHref.length === 0) {
    throw new Error(dashboardText.serviceDialog.hrefRequired);
  }

  const hrefWithProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedHref)
    ? trimmedHref
    : `http://${trimmedHref}`;

  try {
    const url = new URL(hrefWithProtocol);

    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error(dashboardText.serviceDialog.hrefInvalid);
  }
};

export function ServiceTileDialog({
  initialValue: {
    href: initialHref,
    icon: initialIcon,
    name: initialName,
  },
  isEditing,
  onClose,
  onSubmit,
  open,
}: ServiceTileDialogProps) {
  const [formValue, setFormValue] = useState<ServiceTileFormValue>({
    href: initialHref,
    icon: initialIcon,
    name: initialName,
  });
  const [hrefError, setHrefError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormValue({
        href: initialHref,
        icon: initialIcon,
        name: initialName,
      });
      setHrefError(null);
      setNameError(null);
    }
  }, [initialHref, initialIcon, initialName, open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextName = formValue.name.trim();

    if (nextName.length === 0) {
      setNameError(dashboardText.serviceDialog.nameRequired);
      return;
    }

    try {
      onSubmit({
        href: normalizeServiceHref(formValue.href),
        icon: formValue.icon,
        name: nextName,
      });
    } catch (error) {
      setHrefError(
        error instanceof Error ? error.message : dashboardText.serviceDialog.hrefInvalid,
      );
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>
        {isEditing ? dashboardText.serviceDialog.editTitle : dashboardText.serviceDialog.addTitle}
      </DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          gap={2}
          id="service-tile-form"
          onSubmit={handleSubmit}
          paddingTop={1}
        >
          <TextField
            autoFocus
            error={nameError !== null}
            fullWidth
            helperText={nameError}
            label={dashboardText.serviceDialog.nameLabel}
            onChange={(event) => {
              setFormValue((currentValue) => ({
                ...currentValue,
                name: event.target.value,
              }));
              setNameError(null);
            }}
            value={formValue.name}
          />
          <TextField
            error={hrefError !== null}
            fullWidth
            helperText={hrefError ?? dashboardText.serviceDialog.hrefHint}
            label={dashboardText.serviceDialog.hrefLabel}
            onChange={(event) => {
              setFormValue((currentValue) => ({
                ...currentValue,
                href: event.target.value,
              }));
              setHrefError(null);
            }}
            value={formValue.href}
          />
          <TextField
            fullWidth
            label={dashboardText.serviceDialog.iconLabel}
            onChange={(event) => {
              setFormValue((currentValue) => ({
                ...currentValue,
                icon: event.target.value as ServiceIconName,
              }));
            }}
            select
            value={formValue.icon}
          >
            {serviceIconNames.map((iconName) => (
              <MenuItem key={iconName} value={iconName}>
                {dashboardText.serviceDialog.iconOptions[iconName]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{dashboardText.serviceDialog.cancel}</Button>
        <Button
          form="service-tile-form"
          startIcon={isEditing ? <SaveIcon /> : <AddIcon />}
          type="submit"
          variant="contained"
        >
          {isEditing ? dashboardText.serviceDialog.save : dashboardText.serviceDialog.add}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
