import type { QuestionType } from '../../model/types';
import type { AnswerWidgetProps } from './types';
import type { ComponentType } from 'react';

import { SingleChoiceWidget } from './SingleChoiceWidget';
import { MultiChoiceWidget } from './MultiChoiceWidget';
import { LikertWidget } from './LikertWidget';

export const answerWidgetByType: Record<
  QuestionType,
  ComponentType<AnswerWidgetProps>
> = {
  single_choice: SingleChoiceWidget,
  multi_choice: MultiChoiceWidget,
  liker_scale_5: LikertWidget,
  liker_scale_7: LikertWidget,
};
