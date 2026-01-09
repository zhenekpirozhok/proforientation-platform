import type { QuestionDtoQtype } from '@/shared/api/generated/model';
import { answerWidgetByType } from './registry';

describe('answerWidgetByType registry', () => {
  test('contains mapping for all supported question types', () => {
    const keys = Object.keys(answerWidgetByType).sort();
    expect(keys).toEqual(
      [
        'LIKER_SCALE_5',
        'LIKER_SCALE_7',
        'MULTI_CHOICE',
        'SINGLE_CHOICE',
      ].sort(),
    );
  });

  test('single_choice and multi_choice map to different widgets', () => {
    expect(answerWidgetByType.SINGLE_CHOICE).not.toBe(
      answerWidgetByType.MULTI_CHOICE,
    );
  });

  test('registry values are functions (React components)', () => {
    const values = Object.values(answerWidgetByType);
    for (const v of values) {
      expect(typeof v).toBe('function');
    }
  });

  test('is exhaustive for QuestionType at type level', () => {
    const assertExhaustive = (t: QuestionDtoQtype) => answerWidgetByType[t];
    expect(typeof assertExhaustive('SINGLE_CHOICE')).toBe('function');
  });
});
