# Carnac

Vue 3 State Management Library

Design Goals:
- Flux architecture  
- Polylithic state  
- Automatically typed  
- Reduced boilerplate  
- Provide data for undo/redo  
- Additional features for collections.

&nbsp;

---
<h3 align='center'>!!! WARNING !!!</h3>
<div align='center'>Early work in progress. Use only for experimentation purposes.</div>

---  
&nbsp;
## Usage
### Store Creation

<!--
First just a state example
Then with patching multiple
Then inverse
Then with perform
Then inverse
Then with performing multiple
Then computed
Then actions
Then batching
-->
Stores are created using `buildStore`, which returns a composition function that returns the store instance.
```ts
import { buildStore } from 'carnac'

const useStore = buildStore({
    id: 'my store',    
    state: () => {
        a: 0,
        foo : { 
            bar: 'baz'
        },
        arr: [ 0, 1, 2, 3, 4 ]
    }
})

const store = useStore()
store.state.a // 0
store.state.foo.bar // 'baz'
```
&nbsp;
### Event Subscription
Subscribers can listen for state changes on the store. Direct assignments to the store state are logged as 'raw' events:
```ts
const unsubscribe = store.subscribe((evt, state) => {
    console.log(evt.type)
})

store.state.a = 42
> 'raw'
store.state.foo.bar = 'buzz'
> 'raw'
```
&nbsp;
### Patch
Mutating values directly on the state object only notifies subscribers that a mutation has occured, not what particular value has changed or what it was before, with each assignment generating a separate event.  The `patch` function addresses these issues by allowing multiple values to be assigned at once:
```ts
const oldPatch = store.patch({ a: 100, foo: { bar: 'patched!' } })
> 'patch'

oldPatch
> { a: 42, foo: { bar: 'buzz' } }
```
The value returned by the patch function, `oldPatch`, can be used to reverse the `patch`:
```ts
const patch = store.patch(oldPatch)
> 'patch'

patch
> { a: 100, foo: { bar: 'patched!' } } 
```
The patch event also passes this information along to any subscribers.

&nbsp;
### Perform
Patch works great for any time you need to assign new values to state variables.  However, when dealing with collections we may need to call mutator methods such as `Array.splice`.  These methods have the potential to generate many raw events, such as when splicing into the front of an array.  For these cases the `perform` function accepts a collection mutator object, analogous to a patch object, which specifies collection mutators to perform, along with their arguments:
```ts
// store.state.arr == [ 0, 1, 2, 3, 4 ]
store.perform({
    arr: { splice: [ 2, 2, 5, 6 ] }
}) 
> 'perform'

store.state.arr
> [ 0, 1, 5, 6, 4 ]
```
A sequence of collection mutations can be performed by passing in an array of mutations:
```ts
const result = store.perform({
    arr: [ { splice: [ 1, 0, 7 ] },
           { pop: [] },
           { push: [ 8, 9 ] }, ]
})
> 'perform'

store.state.arr
> [ 0, 7, 1, 5, 6, 8, 9 ]
```
`perform` returns both the results of each function call and an inverse mutator object:
```ts
result
> {
    returnValues : { arr: [{ splice: [] }, 
                           { pop: 4 },
                           { push: 7 }] }

    inverse: { arr: [{ splice: [5, 2] },
                     { push: [4] },
                     { splice: [1, 1] }] }
  }
```
&nbsp;
### Computed Properties
Stores may also contain computed properties, either as getters or as a configuration object with `get` and `set` methods:
```ts
const useStore = buildStore({
    ...

    computed: {
        doubleA: (state) => 2 * state.a,

        quadrupleA (state) {
            return 2 * this.doubleA.value  // ComputedRef
        },

        octupleA: {
            get (state) {
                return 2 * this.quadrupleA.value
            }
            set (state, value) {
                state.a = value / 8
                return value
            }
        }
    }
})

```
Events from setting computed properties contain the property name and the old/new values.
```ts
const store = useStore()
store.subscribe((evt, state) => {
    console.log(evt)
})

store.computed.octupleA.value = 16
> { type: 'computed', name: 'octupleA', value: 16, oldValue: 0 }
```
&nbsp;
### Actions
Actions are store methods, recieving the completed store as `this`.
```ts
const useStore = buildStore({
    
    // ...

    actions: {
        myAction() {
            this.computed.octupleA = 42
            this.patch({ foo: { bar: 'fuzz' } })
            this.perform({ arr: { push: [4, 5, 6] } })
        }
    }
})
```
Within actions it is useful to batch together various state mutations into a single batch event, by using the store's `batch` method:
```ts
const useStore = buildStore({
    // ...

    actions: {
        myAction() {
            this.batch(() => {
                this.computed.octupleA = 42
                this.patch(...)
                this.perform(...)
            })
        }
    }
})
```
When called, `myAction` will fire a single `'batch'` event. The sub-events for `'computed'`, `'patch'`, and `'perform'` will be accessible in an `evt.events` property.  Batched events can be nested so that batches can be composed into still larger batches which emit a single event.

&nbsp;  

---

&nbsp;
## Store
property | function
---|---
state    | Reactive state tree
computed | User-defined vue `ComputedRef`s
actions  | User-defined store methods
patch (changes)  | assigns all values from the changes object in a single event, returns an oldPatch of replaced values
perform (mutation)  | performs specified collection mutations in a single event, returns the results from the function calls and an inverse mutation
<!-- generated from a single getter callback `(this: computed, state) => val` or a `{ get() {...}, set() {...} }` configuration object. -->
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