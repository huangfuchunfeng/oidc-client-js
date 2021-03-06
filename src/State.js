// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './Log';
import random from './random';

export class State {
    constructor({id, data, created} = {}) {
        this._id = id || random();
        this._data = data;

        if (typeof created === 'number' && created > 0) {
            this._created = created;
        }
        else {
            this._created = parseInt(Date.now() / 1000);
        }
    }

    get id() {
        return this._id;
    }
    get data() {
        return this._data;
    }
    get created() {
        return this._created;
    }

    toStorageString() {
        Log.debug("State.toStorageString");
        return JSON.stringify({
            id: this.id,
            data: this.data,
            created: this.created
        });
    }

    static fromStorageString(storageString) {
        Log.debug("State.fromStorageString");
        return new State(JSON.parse(storageString));
    }

    static clearStaleState(storage, age) {

        var cutoff = Date.now() / 1000 - age;

        return storage.getAllKeys().then(keys => {
            Log.debug("State.clearStaleState: got keys", keys);

            var promises = [];
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                var p = storage.get(key).then(item => {
                    let remove = false;

                    if (item) {
                        try {
                            var state = State.fromStorageString(item)

                            Log.debug("State.clearStaleState: got item from key: ", key, state.created);

                            if (state.created <= cutoff) {
                                remove = true;
                            }
                        }
                        catch (e) {
                            Log.error("State.clearStaleState: Error parsing state for key", key, e.message);
                            remove = true;
                        }
                    }
                    else {
                        Log.debug("State.clearStaleState: no item in storage for key: ", key);
                        remove = true;
                    }

                    if (remove) {
                        Log.debug("State.clearStaleState: removed item for key: ", key);
                        return storage.remove(key);
                    }
                });

                promises.push(p);
            }

            Log.debug("State.clearStaleState: waiting on promise count:", promises.length);
            return Promise.all(promises);
        });
    }
}
