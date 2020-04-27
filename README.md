# carnac

Carnac - Vue 3 State Management

Design Goals:
\- flux architecture
\- Polylithic state
\- Automatically typed
\- Reduce boilerplate code

---
# !!! WARNING !!!
Use only for experimentation, this is an extremely early work in progress.

&nbsp;
## Store
property | function
---|---
state    | readonly singleton state tree
patch    | Predefined action that assigns values from patch object
perform  | Predefined action that performs specified collection mutator method
computed | ComputedRefs generated from (this: computed, state) => val
actions  | Can mutate the state freely, responsible for their own notifications

&nbsp;
## Depot
property | function
---|---
models   | iterable query with get/filter/where/reject/etc .. models stored in a Map
&nbsp;   | contains own patch/perform batched methods
patch    | patch(changes)
&nbsp;   | patch(id, changes)
&nbsp;   | patch(model, changes)
&nbsp;   | patch(Iterable\<model>, changes)
perform  | Contains similar overrides as patch
computed | ComputedRefs generated from (this: computed, state) => val
actions  | Can mutate the state freely, responsible for their own notifications


&nbsp;
&nbsp;
```
const counterStore = useCounterStore()
const bundle = counterStore.bundle()
const userDepot = useUserDepot()

return {
    state: counterStore.state, // state.value -- a reactive object
    ...counterStore.computed, // { ComputedRef }
    ...counterStore.actions,
    patch: counterStore.patch,
    perform: counterStore.perform,

    users: userDepot.models  // DepotModels<User> -- iterates over all users
    // models.get(id);    : Model
    // models.all();      : DepotQuery<User>   // Array-like access and iteration, but limited API
    // users.sortBy(val_fn);  DepotQuery<User>
    // users.where({lastName:'Smith'}).first(5);   : DepotQuery<User>

}

return {
    ...counterStore, // could only do with one store because of state
    users: userStore.state,
    userQuery: userStore.query
}

userQuery.where({lastName: "smith"}).first(5)

let item = items[id]
item.name = "blender" // Error: Readonly!
items.patch(id, {name: blender})
items.patch(item, {name: blender})
```