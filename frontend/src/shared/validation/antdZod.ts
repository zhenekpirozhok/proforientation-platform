import type { FormInstance } from 'antd';
import type { ZodError } from 'zod';

export function applyZodErrorsToAntdForm<T extends object>(
    form: FormInstance<T>,
    err: ZodError,
) {
    const issues = err.issues ?? [];
    form.setFields(
        issues.map((i) => ({
            name: i.path as any,
            errors: [i.message],
        })),
    );
}
