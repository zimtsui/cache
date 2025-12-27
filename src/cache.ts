import { fromJS, Map, type FromJS } from 'immutable';


/**
 * @template Key Plain object
 */
export interface Cache<Key, Value> {
    (key: Key, read: Cache.Read<Value>, write: Cache.Write<Value>, gen: Cache.Gen<Value>): Promise<Value>;
}
export namespace Cache {
    export function create<Key, Value>(): Cache<Key, Value> {
        let map = Map<FromJS<Key>, Promise<Value>>();
        return async (key, read, write, gen) => {
            try {
                return await read();
            } catch (e) {
                if (e instanceof Cache.Miss) {} else throw e;
                const promise = map.get(fromJS(key));
                if (promise) return await promise;
                else try {
                    const promise = gen();
                    map = map.set(fromJS(key), promise);
                    const value = await promise;
                    await write(value);
                    return value;
                } finally {
                    map = map.delete(fromJS(key));
                }
            }
        };
    }
    export class Miss extends Error {}
    export interface Read<Value> {
        /**
         * @throws {@link Cache.Miss}
         */
        (): Promise<Value>;
    }
    export interface Write<Value> {
        (value: Value): Promise<void>;
    }
    export interface Gen<Value> {
        (): Promise<Value>;
    }
}
