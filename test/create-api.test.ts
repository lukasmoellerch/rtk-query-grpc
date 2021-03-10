import { createBaseApi } from '@rtk-incubator/rtk-query';
import { AsObject, createGrpcDefinition, GrpcMessage } from '../src';

class ListUserRequest implements GrpcMessage {
  a: number = 0;
  toObject() {
    return {
      a: 42,
    };
  }
  serializeBinary() {
    return new Uint8Array();
  }
  setA(a: number) {
    this.a = a;
    return this;
  }
}
class CreateUserRequest implements GrpcMessage {
  a: number = 0;
  toObject() {
    return {
      a: 42,
    };
  }
  serializeBinary() {
    return new Uint8Array();
  }
  setA(a: number) {
    this.a = a;
    return this;
  }
}
class Response implements GrpcMessage {
  a: number = 0;
  toObject() {
    return {
      a: 42,
    };
  }
  serializeBinary() {
    return new Uint8Array();
  }
  setA(a: number) {
    this.a = a;
    return this;
  }
}

class Client {
  a: number;
  constructor(parameter: 42) {
    this.a = parameter;
  }
  listUsers(req: ListUserRequest) {
    if (req === undefined) throw new Error();
    return Promise.resolve(new Response());
  }
  createUser(req: CreateUserRequest) {
    if (req === undefined) throw new Error();
    return Promise.resolve(new Response());
  }
}

const api = createBaseApi(
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
    console.log(api);
    expect(1 + 1).toEqual(2);
  });
});
