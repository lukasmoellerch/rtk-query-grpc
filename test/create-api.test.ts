import {
  AsObject,
  createGrpcDefinition,
  GrpcMessage,
  GrpcMethods,
} from '../src';
import { createApi } from '@rtk-incubator/rtk-query';

class ListUserRequest implements GrpcMessage {
  toObject() {
    return {
      a: 42,
    };
  }
  serializeBinary() {
    return new Uint8Array();
  }
  setA(a: number) {
    return this;
  }
}
class CreateUserRequest implements GrpcMessage {
  toObject() {
    return {
      a: 42,
    };
  }
  serializeBinary() {
    return new Uint8Array();
  }
  setA(a: number) {
    return this;
  }
}
class Response implements GrpcMessage {
  toObject() {
    return {
      a: 42,
    };
  }
  serializeBinary() {
    return new Uint8Array();
  }
  setA(a: number) {
    return this;
  }
}

class Client {
  constructor(parameter: 42) {}
  listUsers(req: ListUserRequest) {
    return Promise.resolve(new Response());
  }
  createUser(req: CreateUserRequest) {
    return Promise.resolve(new Response());
  }
}

const api = createApi(
  createGrpcDefinition({
    client: Client,
    clientArgs: [42],
    reducerPath: 'reducerPath',
    entityTypes: ['User'],
    endpoints: builder => ({
      test: builder.query('listUsers', {
        query: (req: AsObject<ListUserRequest>) =>
          new ListUserRequest().setA(req.a),
        provides: [builder.result('User', 'LIST')],
      }),
    }),
  })
);

describe('createGrpcApi', () => {
  it('works', () => {
    expect(1 + 1).toEqual(2);
  });
});
