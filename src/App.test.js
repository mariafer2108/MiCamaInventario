import { act, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./vercelService', () => ({
  getCurrentUser: jest.fn(async () => null),
  signIn: jest.fn(async () => ({ id: 'test-user' })),
  signInAnonymously: jest.fn(async () => ({ id: 'test-guest' })),
  signOut: jest.fn(async () => undefined),
  fetchInventory: jest.fn(async () => []),
  fetchSales: jest.fn(async () => []),
  addItem: jest.fn(async () => []),
  updateItem: jest.fn(async () => []),
  deleteItemFromDB: jest.fn(async () => []),
  sellProductWithTransfer: jest.fn(async () => []),
  updateSale: jest.fn(async () => []),
  deleteSaleFromDB: jest.fn(async () => []),
  fetchReservations: jest.fn(async () => []),
  addReservation: jest.fn(async () => []),
  updateReservation: jest.fn(async () => []),
  deleteReservationFromDB: jest.fn(async () => [])
}));

test('muestra la pantalla de login después del preloader', async () => {
  jest.useFakeTimers();
  render(<App />);

  await act(async () => {
    jest.advanceTimersByTime(2000);
  });

  expect(screen.getByText('MiCama')).toBeInTheDocument();
  expect(screen.getByText('Sistema de Inventario')).toBeInTheDocument();
});
