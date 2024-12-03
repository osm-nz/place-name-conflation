import { createContext } from 'react';
import type { Output } from './types';

export const DataContext = createContext(undefined as never as Output);
DataContext.displayName = 'DataContext';
