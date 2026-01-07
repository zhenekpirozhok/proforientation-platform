import type { FormInstance } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import type { ZodError } from 'zod';

export function applyZodErrorsToAntdForm<T extends object>(
  form: FormInstance<T>,
  err: ZodError,
) {
  const issues = err.issues ?? [];

  form.setFields(
    issues.map((i) => ({
      name: i.path as NamePath,
      errors: [i.message],
    })),
  );
}
