import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LikertWidget } from './LikertWidget';

type MotionLikeProps = Record<string, unknown> & { children?: React.ReactNode };

jest.mock('framer-motion', () => {
  const strip = (props: MotionLikeProps): Omit<MotionLikeProps, 'children'> => {
    const {
      initial,
      animate,
      transition,
      variants,
      whileHover,
      whileTap,
      children,
      ...rest
    } = props || {};

    void initial;
    void animate;
    void transition;
    void variants;
    void whileHover;
    void whileTap;
    void children;

    return rest;
  };

  return {
    motion: {
      div: ({ children: c, ...props }: MotionLikeProps) => (
        <div {...strip(props)}>{c}</div>
      ),
      span: ({ children: c, ...props }: MotionLikeProps) => (
        <span {...strip(props)}>{c}</span>
      ),
    },
  };
});

jest.mock('./SingleChoiceWidget', () => ({
  SingleChoiceWidget: () => <div>single-choice-fallback</div>,
}));

type MatchMediaStub = {
  matches: boolean;
  media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null;
  addListener: (
    listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown,
  ) => void;
  removeListener: (
    listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown,
  ) => void;
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void;
  dispatchEvent: (event: Event) => boolean;
};

function setMatchMedia(matches: boolean) {
  const stub: MatchMediaStub = {
    matches,
    media: '(max-width: 640px)',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };

  window.matchMedia = () => stub as unknown as MediaQueryList;
}

type Option = { id: number; label: string };
type Question = { id: number; qtype: string; options: Option[] };

function makeQuestion(qtype: string, count: number): Question {
  return {
    id: 1,
    qtype,
    options: Array.from({ length: count }).map((_, i) => ({
      id: 100 + i,
      label: `Opt${i + 1}`,
    })),
  };
}

describe('LikertWidget', () => {
  beforeEach(() => {
    setMatchMedia(false);
  });

  test('renders correct number of radio buttons for liker_scale_5 (max 5)', () => {
    const onSelect = jest.fn<void, [number, number]>();
    render(
      <LikertWidget
        question={
          makeQuestion('liker_scale_5', 10) as unknown as Parameters<
            typeof LikertWidget
          >[0]['question']
        }
        selectedOptionId={
          null as unknown as Parameters<
            typeof LikertWidget
          >[0]['selectedOptionId']
        }
        onSelect={
          onSelect as unknown as Parameters<typeof LikertWidget>[0]['onSelect']
        }
        disabled={false}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(5);
  });

  test('renders correct number of radio buttons for liker_scale_7 (max 7)', () => {
    const onSelect = jest.fn<void, [number, number]>();
    render(
      <LikertWidget
        question={
          makeQuestion('liker_scale_7', 10) as unknown as Parameters<
            typeof LikertWidget
          >[0]['question']
        }
        selectedOptionId={
          null as unknown as Parameters<
            typeof LikertWidget
          >[0]['selectedOptionId']
        }
        onSelect={
          onSelect as unknown as Parameters<typeof LikertWidget>[0]['onSelect']
        }
        disabled={false}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(7);
  });

  test('click selects the option', () => {
    const onSelect = jest.fn<void, [number, number]>();
    const q = makeQuestion('liker_scale_5', 5);

    render(
      <LikertWidget
        question={
          q as unknown as Parameters<typeof LikertWidget>[0]['question']
        }
        selectedOptionId={
          null as unknown as Parameters<
            typeof LikertWidget
          >[0]['selectedOptionId']
        }
        onSelect={
          onSelect as unknown as Parameters<typeof LikertWidget>[0]['onSelect']
        }
        disabled={false}
      />,
    );

    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[2]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(1, 102);
  });

  test('keyboard ArrowRight selects next; ArrowLeft selects previous', () => {
    const onSelect = jest.fn<void, [number, number]>();
    const q = makeQuestion('liker_scale_5', 5);

    render(
      <LikertWidget
        question={
          q as unknown as Parameters<typeof LikertWidget>[0]['question']
        }
        selectedOptionId={
          101 as unknown as Parameters<
            typeof LikertWidget
          >[0]['selectedOptionId']
        }
        onSelect={
          onSelect as unknown as Parameters<typeof LikertWidget>[0]['onSelect']
        }
        disabled={false}
      />,
    );

    const group = screen.getByRole('radiogroup');

    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenCalledWith(1, 102);

    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onSelect).toHaveBeenCalledWith(1, 100);
  });

  test('keyboard Home selects first; End selects last', () => {
    const onSelect = jest.fn<void, [number, number]>();
    const q = makeQuestion('liker_scale_5', 5);

    render(
      <LikertWidget
        question={
          q as unknown as Parameters<typeof LikertWidget>[0]['question']
        }
        selectedOptionId={
          102 as unknown as Parameters<
            typeof LikertWidget
          >[0]['selectedOptionId']
        }
        onSelect={
          onSelect as unknown as Parameters<typeof LikertWidget>[0]['onSelect']
        }
        disabled={false}
      />,
    );

    const group = screen.getByRole('radiogroup');

    fireEvent.keyDown(group, { key: 'Home' });
    expect(onSelect).toHaveBeenCalledWith(1, 100);

    fireEvent.keyDown(group, { key: 'End' });
    expect(onSelect).toHaveBeenCalledWith(1, 104);
  });

  test('when disabled, click and keyboard do not call onSelect', () => {
    const onSelect = jest.fn<void, [number, number]>();
    const q = makeQuestion('liker_scale_5', 5);

    render(
      <LikertWidget
        question={
          q as unknown as Parameters<typeof LikertWidget>[0]['question']
        }
        selectedOptionId={
          101 as unknown as Parameters<
            typeof LikertWidget
          >[0]['selectedOptionId']
        }
        onSelect={
          onSelect as unknown as Parameters<typeof LikertWidget>[0]['onSelect']
        }
        disabled={true}
      />,
    );

    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);

    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    fireEvent.keyDown(group, { key: 'Home' });

    expect(onSelect).toHaveBeenCalledTimes(0);
  });
});
