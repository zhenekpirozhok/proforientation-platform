import type { QuestionDtoQtype } from '@/shared/api/generated/model';
import type { AnswerWidgetProps } from './types';
import type { ComponentType } from 'react';

import { SingleChoiceWidget } from './SingleChoiceWidget';
import { MultiChoiceWidget } from './MultiChoiceWidget';
import { LikertWidget } from './LikertWidget';

export const answerWidgetByType: Record<
  QuestionDtoQtype,
  ComponentType<AnswerWidgetProps>
> = {
  SINGLE_CHOICE: SingleChoiceWidget,
  MULTI_CHOICE: MultiChoiceWidget,
  LIKER_SCALE_5: LikertWidget,
  LIKER_SCALE_7: LikertWidget,
};
