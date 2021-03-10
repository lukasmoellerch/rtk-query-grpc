import {
  EndpointDefinitions,
  MutationDefinition,
  QueryDefinition,
} from '@rtk-incubator/rtk-query';
import { EndpointBuilder } from '@rtk-incubator/rtk-query/dist/ts/endpointDefinitions';

export interface GrpcMessage {
  toObject(): any;
  serializeBinary: () => Uint8Array;
}

/**
 * his is the type of the objects that are passed between queries and the baseQuery method.
 * it indicates that the method X should be executed with the serialized data. The data is stored
 * as a normal because Uint8Arrays aren't serializable to standard JSON. There's a small performance
 * penalty associated with this decision.
 */
export type Action<X> = {
  method: X;
  data: number[];
  RequestType: unknown;
};

/**
 * Indicates a type that is newable and for which the new invocation results in a `Result`
 */
export type Constructor<Args extends any[], Result> = {
  new (...args: Args): Result;
};

/**
 * Extracts all callable properties that `T` has and replaces the other properties with `never`
 */
export type Methods<T> = {
  [Key in keyof T]: T[Key] extends (...args: any) => any ? T[Key] : never;
};

/**
 * Converts a grpc message class into its associated AsObject type by using the type of its
 * `toObject` method.
 */
export type AsObject<A> = A extends GrpcMessage ? ReturnType<A['toObject']> : A;

/**
 * The type that would be the result of an await expression `await t` if `t` was of type `T`
 */
export type Await<T> = T extends PromiseLike<infer U> ? U : T;

/**
 * Extracts the service definition from the grpc-web client. The return type is a record type where the
 * keys are the names of grpc methods and the mapped type is a type tuple `[A, B]` where `A` is the RequestType type
 * and `B` is the result type of the rpc.
 */
export type GrpcMethods<A> = {
  [Key in keyof Methods<A>]: Parameters<Methods<A>[Key]>[0] extends GrpcMessage
    ? Await<ReturnType<Methods<A>[Key]>> extends GrpcMessage
      ? [Parameters<Methods<A>[Key]>[0], Await<ReturnType<Methods<A>[Key]>>]
      : never
    : never;
};

export type GrpcQueryDefinition<
  MethodName extends keyof ClientGrpcMethods,
  QueryArgs,
  ClientType,
  ReducerPath extends string,
  EntityTypes extends string,
  ClientGrpcMethods extends Record<string, [GrpcMessage, GrpcMessage]>
> = Omit<
  QueryDefinition<
    QueryArgs,
    (a: Action<keyof ClientType>) => AsObject<ClientGrpcMethods[MethodName][1]>,
    EntityTypes,
    AsObject<ClientGrpcMethods[MethodName][1]>,
    ReducerPath
  >,
  'type' | 'query'
> & { query: (a: QueryArgs) => ClientGrpcMethods[MethodName][0] };

export type QueryBuilderType<
  ClientType,
  ReducerPath extends string,
  EntityTypes extends string,
  ClientGrpcMethods extends Record<string, [GrpcMessage, GrpcMessage]>
> = <
  MethodName extends keyof ClientGrpcMethods,
  QueryArgs = AsObject<ClientGrpcMethods[MethodName][0]>
>(
  methodName: MethodName,
  definition: GrpcQueryDefinition<
    MethodName,
    QueryArgs,
    ClientType,
    ReducerPath,
    EntityTypes,
    ClientGrpcMethods
  >
) => QueryDefinition<
  QueryArgs,
  (a: Action<keyof ClientType>) => AsObject<ClientGrpcMethods[MethodName][1]>,
  EntityTypes,
  AsObject<ClientGrpcMethods[MethodName][1]>,
  ReducerPath
>;

export type GrpcMutationDefinition<
  MethodName extends keyof ClientGrpcMethods,
  QueryArgs,
  ClientType,
  ReducerPath extends string,
  EntityTypes extends string,
  ClientGrpcMethods extends Record<string, [GrpcMessage, GrpcMessage]>
> = Omit<
  MutationDefinition<
    QueryArgs,
    (a: Action<keyof ClientType>) => AsObject<ClientGrpcMethods[MethodName][1]>,
    EntityTypes,
    AsObject<ClientGrpcMethods[MethodName][1]>,
    ReducerPath
  >,
  'type' | 'query'
> & { query: (a: QueryArgs) => ClientGrpcMethods[MethodName][0] };

export type MutationBuilderType<
  ClientType,
  ReducerPath extends string,
  EntityTypes extends string,
  ClientGrpcMethods extends Record<string, [GrpcMessage, GrpcMessage]>
> = <
  MethodName extends keyof ClientGrpcMethods,
  QueryArgs = AsObject<ClientGrpcMethods[MethodName][0]>
>(
  methodName: MethodName,
  definition: GrpcMutationDefinition<
    MethodName,
    QueryArgs,
    ClientType,
    ReducerPath,
    EntityTypes,
    ClientGrpcMethods
  >
) => MutationDefinition<
  QueryArgs,
  (a: Action<keyof ClientType>) => AsObject<ClientGrpcMethods[MethodName][1]>,
  EntityTypes,
  AsObject<ClientGrpcMethods[MethodName][1]>,
  ReducerPath
>;

export interface APIDefinition<
  ReducerPath extends string,
  Endpoints extends EndpointDefinitions,
  EntityTypes extends string,
  ClientConstructorArgs extends any[],
  ClientType extends any
> {
  reducerPath: ReducerPath;
  client: Constructor<ClientConstructorArgs, ClientType>;
  clientArgs: ClientConstructorArgs;
  entityTypes: EntityTypes[];
  endpoints: (builder: {
    result: (
      entityType: EntityTypes,
      id: string
    ) => { type: EntityTypes; id: string };
    query: QueryBuilderType<
      ClientType,
      ReducerPath,
      EntityTypes,
      GrpcMethods<ClientType>
    >;
    mutation: MutationBuilderType<
      ClientType,
      ReducerPath,
      EntityTypes,
      GrpcMethods<ClientType>
    >;
  }) => Endpoints;
}

/**
 *  Creates a new rtk-query api with associated react hooks which can be used to create a rtk-query
 * @param definition The definition of the API
 * @returns
 */
export function createGrpcDefinition<
  ReducerPath extends string,
  Endpoints extends EndpointDefinitions,
  EntityTypes extends string,
  ClientConstructorArgs extends any[],
  ClientType extends any
>(
  definition: APIDefinition<
    ReducerPath,
    Endpoints,
    EntityTypes,
    ClientConstructorArgs,
    ClientType
  >
) {
  const {
    reducerPath,
    client: C,
    clientArgs,
    entityTypes,
    endpoints,
  } = definition;
  /**
   * The grpc client that is constructed from the constructor that is passed to the api
   */
  const client = new C(...clientArgs);

  /**
   * Executes the action that is passed to it as an argument and returns a promise
   * @param action The grpc action that should be executed
   * @returns A promise that contains either the data or the error
   */
  const baseQuery = (action: Action<keyof ClientType>) =>
    (client as any)
      [action.method]({
        serializeBinary: () => Uint8Array.from(action.data),
      })
      .then(
        (u: { toObject: () => any }) => ({
          data: u.toObject(),
        }),
        (e: Error) => ({
          error: e,
        })
      ) as Promise<
      { data: unknown; error: never } | { data: never; error: Error }
    >;

  /**
   * Creates an action from a method and a RequestType, the RequestType is serialized and converted
   * into a plain `number[]` array. The JSON version of the RequestType is attached to the action as well.
   * @param method The method that the action should execute
   * @param req The grpc RequestType object that is of the type that `method` expects
   * @returns An action that when passed to the baseQuery invokes the RPC using the client
   */
  const queryWrapper = <MethodName extends keyof GrpcMethods<ClientType>>(
    method: MethodName,
    req: GrpcMethods<ClientType>[MethodName][0]
  ): Action<MethodName> => {
    return {
      method,
      data: Array.from(req.serializeBinary()),
      RequestType: req.toObject(),
    };
  };

  /**
   * The underlying rtk-query api
   */
  return {
    reducerPath,
    baseQuery,
    entityTypes,
    endpoints: (
      builder: EndpointBuilder<
        (a: Action<keyof ClientType>) => any,
        EntityTypes,
        ReducerPath
      >
    ) =>
      endpoints({
        result: (entityType, id) => ({ type: entityType, id }),
        // We explicity specify `MethodName` here so that the generic parameter can be passed
        // to `queryWrapper`.
        query: <QueryArgs, MethodName extends keyof GrpcMethods<ClientType>>(
          methodName: MethodName,
          definition: GrpcQueryDefinition<
            MethodName,
            QueryArgs,
            ClientType,
            ReducerPath,
            EntityTypes,
            GrpcMethods<ClientType>
          >
        ) =>
          builder.query({
            ...definition,
            query: r =>
              queryWrapper<MethodName>(methodName, definition.query(r)),
          }),
        mutation: <QueryArgs, MethodName extends keyof GrpcMethods<ClientType>>(
          methodName: MethodName,
          definition: GrpcMutationDefinition<
            MethodName,
            QueryArgs,
            ClientType,
            ReducerPath,
            EntityTypes,
            GrpcMethods<ClientType>
          >
        ) =>
          builder.mutation({
            ...definition,
            query: r =>
              queryWrapper<MethodName>(methodName, definition.query(r)),
          }),
      }),
  };
}
