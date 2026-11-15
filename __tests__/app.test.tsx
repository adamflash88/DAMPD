/**
 * Integration tests: render the real Expo Router app (src/app) and drive the
 * main rider flows through the UI, asserting on what's shown and stored.
 */
import { Alert } from 'react-native';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { getState, initialState, setState } from '../src/data/zustand/store';
import { getSettingValue } from '../src/domain/settings';

jest.setTimeout(30_000);

// Confirm dialogs: press the last (affirmative) button automatically.
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
  const confirm = buttons?.[buttons.length - 1];
  confirm?.onPress?.();
});

beforeEach(() => {
  setState(initialState(), true);
  alertSpy.mockClear();
});

const APP = './src/app';
/** Find (waiting through hydration / navigation) and press a button. */
const press = async (label: string | RegExp) => await fireEvent.press(await screen.findByRole('button', { name: label }));

/** Flush pending promises (fake timers are active, so no setTimeout). */
async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('navigation', () => {
  it('shows the four tabs and the dashboard for the seeded bike', async () => {
    await renderRouter(APP, { initialUrl: '/' });
    expect(await screen.findByText('2026 Kawasaki KX250')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'START TUNING' })).toBeTruthy();
    for (const tab of ['Home', 'Garage', 'Tune', 'History']) expect(screen.getAllByText(tab).length).toBeGreaterThan(0);
    // Single consolidated provenance indicator: a legend, not a badge per value.
    expect(screen.getAllByText('Demo value: not verified')).toHaveLength(1);
  });

  it.each([
    '/garage',
    '/tune',
    '/history',
    '/settings',
    '/bike/new',
    '/bike/switch',
  ])('renders %s without crashing', async (url) => {
    await renderRouter(APP, { initialUrl: url });
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
    await settle();
    expect(screen.toJSON()).toBeTruthy();
  });

  it('renders bike-scoped routes', async () => {
    const id = getState().activeBikeId!;
    for (const url of [`/bike/${id}`, `/bike/${id}/suspension`, `/bike/${id}/adjusters`, `/bike/${id}/setups`, `/bike/${id}/edit`]) {
      await renderRouter(APP, { initialUrl: url });
      await settle();
      expect(screen.toJSON()).toBeTruthy();
    }
  });
});

describe('trackside flow', () => {
  it('starts a session with no track, logs feedback, records an adjustment and ends it', async () => {
    const r = await renderRouter(APP, { initialUrl: '/tune' });
    await press('START SESSION');
    await waitFor(() => expect(r.getPathname()).toMatch(/^\/session\//));
    const sessionId = r.getPathname().split('/')[2]!;
    expect(await screen.findByText('Untitled session')).toBeTruthy();

    // Log feedback: one symptom, severity 4.
    await press('LOG FEEDBACK');
    await screen.findByText('What did you feel?');
    await fireEvent.press(await screen.findByRole('checkbox', { name: 'Rear-end kicking' }));
    await fireEvent.press(await screen.findByRole('tab', { name: '4' }));
    await press('Save run 1');
    await waitFor(() => expect(getState().sessions[sessionId]!.events).toHaveLength(1));
    const run = getState().sessions[sessionId]!.events[0]!;
    expect(run).toMatchObject({ type: 'testRun', runNumber: 1, outcome: null });
    if (run.type === 'testRun') expect(run.symptoms[0]).toMatchObject({ symptom: 'rearKicking', end: 'rear', severity: 4 });

    // Record adjustment: shock rebound 10 → 12 (two clicks out = softer).
    await r.findByText('Run 1');
    await press('RECORD ADJUSTMENT');
    await screen.findByText('1 · Where');
    await fireEvent.press(await screen.findByRole('tab', { name: 'Shock' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Rebound' }));
    await press('Increase New');
    await press('Increase New');
    expect(screen.getByText('+2 clicks out')).toBeTruthy();
    expect(screen.getByText(/10 clicks out → 12 clicks out · softer/)).toBeTruthy();
    await press('Save adjustment');
    await waitFor(() => expect(getState().sessions[sessionId]!.events).toHaveLength(2));
    expect(getState().sessions[sessionId]!.events[1]).toMatchObject({ type: 'adjustment', path: 'shock.adj.rebound', before: 10, after: 12 });

    // Second run asks for an outcome.
    await r.findByText('Shock rebound');
    await press('LOG FEEDBACK');
    expect(await screen.findByText('Did the bike feel better?')).toBeTruthy();
    await fireEvent.press(await screen.findByRole('radio', { name: 'Better' }));
    await press('Save run 2');
    await waitFor(() => expect(getState().sessions[sessionId]!.events).toHaveLength(3));
    expect(getState().sessions[sessionId]!.events[2]).toMatchObject({ type: 'testRun', outcome: 'better' });

    // End session (confirm auto-accepted).
    await r.findByText('Run 2');
    await press('END SESSION');
    await waitFor(() => expect(getState().sessions[sessionId]!.status).toBe('completed'));

    // The garage profile was never touched by the session.
    const bike = getState().bikes[getState().activeBikeId!]!;
    expect(getSettingValue(bike.suspension, 'shock.adj.rebound')?.value).toBe(10);
  });
});

describe('garage flow', () => {
  it('adds a motorcycle through the guided catalog flow and makes it active', async () => {
    const r = await renderRouter(APP, { initialUrl: '/bike/new' });
    await fireEvent.press(await screen.findByRole('button', { name: '2025' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Honda' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'CRF450R' }));
    await fireEvent.changeText(await screen.findByLabelText('Nickname (optional)'), 'Practice');
    await press('Save motorcycle');
    await waitFor(() => expect(r.getPathname()).toMatch(/^\/bike\/[^/]+$/));
    const bike = Object.values(getState().bikes).find((b) => b.model === 'CRF450R')!;
    expect(bike).toMatchObject({ year: 2025, make: 'Honda', nickname: 'Practice', catalogId: 'honda-crf450r' });
    expect(getState().activeBikeId).toBe(bike.id);
  });

  it('supports manual entry for bikes not in the catalog', async () => {
    await renderRouter(APP, { initialUrl: '/bike/new' });
    await fireEvent.press(await screen.findByRole('button', { name: '2024' }));
    await fireEvent.press(await screen.findByRole('link', { name: 'Enter manufacturer manually' }));
    await fireEvent.changeText(screen.getByLabelText('Manufacturer'), 'Beta');
    await press('Next');
    await fireEvent.changeText(await screen.findByLabelText('Model'), 'RX 300');
    await press('Next');
    await press('Save motorcycle');
    await waitFor(() => expect(Object.values(getState().bikes).some((b) => b.make === 'Beta' && b.catalogId === null)).toBe(true));
  });

  it('edits a clicker with the compact stepper and records it as a rider value', async () => {
    const id = getState().activeBikeId!;
    await renderRouter(APP, { initialUrl: `/bike/${id}/suspension` });
    await press('Increase Compression');
    await waitFor(() => expect(getSettingValue(getState().bikes[id]!.suspension, 'fork.adj.compression')).toEqual({ value: 11, source: 'user' }));
  });

  it('asks before keeping demo values, and never marks them manufacturer-verified', async () => {
    const id = getState().activeBikeId!;
    await renderRouter(APP, { initialUrl: `/bike/${id}/suspension` });
    await fireEvent.press(await screen.findByRole('link', { name: "I've checked them, keep as mine" }));
    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/demo values/), expect.stringMatching(/NOT be marked as manufacturer-verified/), expect.any(Array));
    await waitFor(() => expect(JSON.stringify(getState().bikes[id]!.suspension)).not.toContain('"demo"'));
    expect(JSON.stringify(getState().bikes[id]!.suspension)).not.toContain('"manufacturer"');
  });
});
