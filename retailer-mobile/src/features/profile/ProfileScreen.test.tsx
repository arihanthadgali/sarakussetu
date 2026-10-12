import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ComponentProps, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { cartQueryKey } from '@/features/cart/cart-store';
import { ordersQueryKey } from '@/features/orders/orders';
import { useSession } from '@/features/auth/session-store';

import { ProfileScreen } from './ProfileScreen';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

async function renderProfile(props: Partial<ComponentProps<typeof ProfileScreen>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <SafeAreaProvider initialMetrics={metrics}><QueryClientProvider client={client}>{children}</QueryClientProvider></SafeAreaProvider>;
  const callbacks = { onOpenOrders: jest.fn(), onOpenCart: jest.fn(), onSignedOut: jest.fn(), onSignIn: jest.fn(), ...props };
  const rendered = await render(<ProfileScreen {...callbacks} />, { wrapper });
  return { ...rendered, client, callbacks };
}

describe('ProfileScreen', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useSession.setState({ status: 'signedOut', token: null, customer: null });
  });

  it('renders the authenticated customer information and account navigation', async () => {
    useSession.setState({ status: 'signedIn', token: 'token', customer: { id: '1', phoneNumber: '9876543210' } });
    const { callbacks } = await renderProfile();

    expect(screen.getByText('+91 98765 43210')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('My Orders'));
    await fireEvent.press(screen.getByLabelText('Cart'));
    expect(callbacks.onOpenOrders).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenCart).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state while the session profile is restored', async () => {
    useSession.setState({ status: 'booting', token: null, customer: null });
    await renderProfile();
    expect(screen.getByText('Loading profile…')).toBeTruthy();
  });

  it('shows an unavailable-profile state with retry', async () => {
    const bootstrap = jest.fn();
    useSession.setState({ status: 'unreachable', bootstrap });
    await renderProfile();
    expect(screen.getByText('Unable to load your profile.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Retry'));
    expect(bootstrap).toHaveBeenCalledTimes(1);
  });

  it('handles a signed-out profile safely', async () => {
    useSession.setState({ status: 'signedOut', token: null, customer: null });
    const signedOut = await renderProfile();
    expect(screen.getByText('Sign in when you are ready to place an order.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Sign in'));
    expect(signedOut.callbacks.onSignIn).toHaveBeenCalledTimes(1);
  });

  it('logs out, clears authenticated cart/order query state, and returns to browsing', async () => {
    useSession.setState({ status: 'signedIn', token: 'token', customer: { id: '1', phoneNumber: '9876543210' } });
    const { client, callbacks } = await renderProfile();
    client.setQueryData(cartQueryKey, { id: '1' });
    client.setQueryData(ordersQueryKey, [{ id: '1' }]);

    await fireEvent.press(screen.getByLabelText('Logout'));

    await waitFor(() => expect(useSession.getState().status).toBe('signedOut'));
    expect(client.getQueryData(cartQueryKey)).toBeUndefined();
    expect(client.getQueryData(ordersQueryKey)).toBeUndefined();
    expect(callbacks.onSignedOut).toHaveBeenCalledTimes(1);
  });
});
