declare module '@ts-query/core' {
  export type QueryKey = string | readonly unknown[];

  export interface QueryState<TData = unknown, TError = Error> {
    status: 'idle' | 'loading' | 'success' | 'error';
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    isFetching: boolean;
    isStale: boolean;
  }

  export interface QueryOptions<TData = unknown> {
    queryKey: QueryKey;
    queryFn: () => Promise<TData>;
    enabled?: boolean;
    retry?: number;
  }

  export interface MutationOptions<
    TData = unknown,
    TVariables = unknown,
    TError = Error,
  > {
    mutationFn: (variables: TVariables) => Promise<TData>;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: TError, variables: TVariables) => void;
    onSettled?: (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
    ) => void;
  }

  export interface MutationState<TData = unknown, TError = Error> {
    status: 'idle' | 'loading' | 'success' | 'error';
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
  }

  export class QueryClient {
    invalidateQueries(queryKey?: QueryKey): Promise<void>;
  }
}

declare module '@ts-query/react' {
  import type { ReactNode } from 'react';

  import type {
    MutationOptions,
    MutationState,
    QueryClient,
    QueryOptions,
    QueryState,
  } from '@ts-query/core';

  export interface QueryClientProviderProps {
    client: QueryClient;
    children: ReactNode;
  }

  export interface UseMutationResult<
    TData = unknown,
    TVariables = unknown,
    TError = Error,
  > {
    mutate: (variables: TVariables) => Promise<TData>;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    reset: () => void;
    state: MutationState<TData, TError>;
  }

  export function QueryClientProvider(
    props: QueryClientProviderProps,
  ): ReactNode;
  export function useQueryClient(): QueryClient;
  export function useQuery<TData = unknown, TError = Error>(
    options: QueryOptions<TData>,
  ): QueryState<TData, TError>;
  export function useMutation<
    TData = unknown,
    TVariables = unknown,
    TError = Error,
  >(
    options: MutationOptions<TData, TVariables, TError>,
  ): UseMutationResult<TData, TVariables, TError>;
  export function useStore<TState>(selector: (state: TState) => TState): TState;
}

declare module '@ts-query/ui-react' {
  import type * as React from 'react';

  export type SpaceValue = number | string;
  export type ButtonVariant = 'solid' | 'outline' | 'ghost';
  export type ButtonSize = 'sm' | 'md' | 'lg';
  export type ButtonColorScheme = 'blue' | 'gray' | 'red' | 'green';

  export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
    as?: React.ElementType;
    p?: SpaceValue;
    px?: SpaceValue;
    py?: SpaceValue;
    pt?: SpaceValue;
    pr?: SpaceValue;
    pb?: SpaceValue;
    pl?: SpaceValue;
    m?: SpaceValue;
    mx?: SpaceValue;
    my?: SpaceValue;
    mt?: SpaceValue;
    mr?: SpaceValue;
    mb?: SpaceValue;
    ml?: SpaceValue;
    bg?: string;
    color?: string;
    rounded?: number | string;
  }

  export interface StackProps extends React.HTMLAttributes<HTMLElement> {
    direction?: 'row' | 'column';
    gap?: SpaceValue;
    align?: React.CSSProperties['alignItems'];
    justify?: React.CSSProperties['justifyContent'];
  }

  export interface TextProps extends React.HTMLAttributes<HTMLElement> {
    as?: React.ElementType;
    fontSize?: string;
    fontWeight?: React.CSSProperties['fontWeight'];
  }

  export interface HeadingProps extends TextProps {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  }

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    colorScheme?: ButtonColorScheme;
  }

  export const Box: React.FC<BoxProps>;
  export const Stack: React.FC<StackProps>;
  export const Text: React.FC<TextProps>;
  export const Heading: React.FC<HeadingProps>;
  export const Button: React.FC<ButtonProps>;
}
