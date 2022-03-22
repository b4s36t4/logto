import { User } from '@logto/schemas';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Button from '@/components/Button';
import FormField from '@/components/FormField';
import ModalLayout from '@/components/ModalLayout';
import TextInput from '@/components/TextInput';
import useApi from '@/hooks/use-api';

import * as styles from './ResetPasswordForm.module.scss';

type FormData = {
  password: string;
};

type Props = {
  userId: string;
  onClose?: () => void;
};

const ResetPasswordForm = ({ onClose, userId }: Props) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'admin_console',
  });
  const { handleSubmit, register } = useForm<FormData>();
  const api = useApi();

  const [loading, setLoading] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);

    try {
      await api.patch(`/api/users/${userId}/password`, { json: data }).json<User>();
      onClose?.();
      toast.success(t('user_details.reset_password.reset_password_success'));
    } finally {
      setLoading(false);
    }
  });

  return (
    <ModalLayout title="user_details.reset_password.title" onClose={onClose}>
      <form className={styles.form} onSubmit={onSubmit}>
        <FormField
          isRequired
          title="admin_console.user_details.reset_password.label"
          className={styles.textField}
        >
          <TextInput {...register('password', { required: true })} />
        </FormField>
        <div className={styles.submit}>
          <Button
            disabled={loading}
            htmlType="submit"
            title="admin_console.user_details.reset_password.reset_password"
            size="large"
            type="primary"
          />
        </div>
      </form>
    </ModalLayout>
  );
};

export default ResetPasswordForm;
