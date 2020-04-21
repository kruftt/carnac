# carnac

Carnac - Vue 3 State Management

Design Goals:
\- flux architecture
\- Avoid monolithic state
\- Automatically typed
\- Opinionated about store design

&nbsp;
### Store / ComponentStore
- state    (readonly singleton state tree)
- patch/set
- getters  (computed/state)
- actions  (return promises? - does this happen automatically with async?)

&nbsp;
### Depot / ModelStore
- models  // get/filter/where/reject/etc .. stored in Map
- patch   // patch(id, changes)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// patch(model, changes)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// patch(DepotQuery<T>, changes)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// patch({[K]: T})
- getters
- actions

Maintains a Map/Record<string, T>
.models allows iteration


```
const counterStore = useCounterStore()
const userDepot = useUserDepot()

return {
    ...counterStore.state,
    ...counterStore.getters,
    ...counterStore.actions,
    patchStore: counterStore.patch,

    users: userDepot.models,	// DepotModels<User> -- iterating over models iterates over users.all
    // for (model of models) { ...iterates all models }
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
items.patch(filterFn, {name: blender})
```

What about actions and so on for individual models?

History module can have optional stack ids for multi-store usage if desired.

naming:
flux
not monolithic - separate small chunks (branches vs maps)
singletons vs models (stores, depots) (shop, depot)
imported as needed..
