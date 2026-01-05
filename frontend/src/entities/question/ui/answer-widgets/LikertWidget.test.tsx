import { render, screen, fireEvent } from '@testing-library/react';
import { LikertWidget } from './LikertWidget';

jest.mock('framer-motion', () => {
  const strip = (props: any) => {
    const { initial, animate, transition, variants, whileHover, whileTap, ...rest } = props || {};
    return rest;
  };

  return {
    motion: {
      div: ({ children, ...props }: any) => <div {...strip(props)}>{children}</div>,
      span: ({ children, ...props }: any) => <span {...strip(props)}>{children}</span>,
    },
  };
});


jest.mock('./SingleChoiceWidget', () => ({
  SingleChoiceWidget: () => <div>single-choice-fallback</div>,
}));

function setMatchMedia(matches: boolean) {
  (window as any).matchMedia = () => ({
    matches,
    media: '(max-width: 640px)',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

function makeQuestion(qtype: string, count: number) {
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
    const onSelect = jest.fn();
    render(
      <LikertWidget
        question={makeQuestion('liker_scale_5', 10) as any}
        selectedOptionId={null as any}
        onSelect={onSelect}
        disabled={false}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(5);
  });

  test('renders correct number of radio buttons for liker_scale_7 (max 7)', () => {
    const onSelect = jest.fn();
    render(
      <LikertWidget
        question={makeQuestion('liker_scale_7', 10) as any}
        selectedOptionId={null as any}
        onSelect={onSelect}
        disabled={false}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(7);
  });

  test('click selects the option', () => {
    const onSelect = jest.fn();
    const q = makeQuestion('liker_scale_5', 5);

    render(
      <LikertWidget
        question={q as any}
        selectedOptionId={null as any}
        onSelect={onSelect}
        disabled={false}
      />,
    );

    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[2]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(1, 102);
  });

  test('keyboard ArrowRight selects next; ArrowLeft selects previous', () => {
    const onSelect = jest.fn();
    const q = makeQuestion('liker_scale_5', 5);

    render(
      <LikertWidget
        question={q as any}
        selectedOptionId={101 as any}
        onSelect={onSelect}
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
    const onSelect = jest.fn();
    const q = makeQuestion('liker_scale_5', 5);

    render(
      <LikertWidget
        question={q as any}
        selectedOptionId={102 as any}
        onSelect={onSelect}
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
    const onSelect = jest.fn();
    const q = makeQuestion('liker_scale_5', 5);

    render(
      <LikertWidget
        question={q as any}
        selectedOptionId={101 as any}
        onSelect={onSelect}
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
