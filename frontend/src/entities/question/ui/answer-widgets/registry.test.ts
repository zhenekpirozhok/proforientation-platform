import type { QuestionType } from '../../model/types';
import { answerWidgetByType } from './registry';

describe('answerWidgetByType registry', () => {
    test('contains mapping for all supported question types', () => {
        const keys = Object.keys(answerWidgetByType).sort();
        expect(keys).toEqual(
            ['liker_scale_5', 'liker_scale_7', 'multi_choice', 'single_choice'].sort(),
        );
    });

    test('likert types map to the same widget', () => {
        expect(answerWidgetByType.liker_scale_5).toBe(answerWidgetByType.liker_scale_7);
    });

    test('single_choice and multi_choice map to different widgets', () => {
        expect(answerWidgetByType.single_choice).not.toBe(answerWidgetByType.multi_choice);
    });

    test('registry values are functions (React components)', () => {
        const values = Object.values(answerWidgetByType);
        for (const v of values) {
            expect(typeof v).toBe('function');
        }
    });

    test('is exhaustive for QuestionType at type level', () => {
        const assertExhaustive = (t: QuestionType) => answerWidgetByType[t];
        expect(typeof assertExhaustive('single_choice')).toBe('function');
    });
});
