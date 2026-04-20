import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import createWebStorage from 'redux-persist/lib/storage/createWebStorage'
import { combineReducers } from '@reduxjs/toolkit'

import userReducer from './slices/authSlice'
import schoolReducer from './slices/schoolSlice'
import uiReducer from './slices/uiSlice'
import { baseApi } from './api/baseApi'


// Create a noop storage for SSR
const createNoopStorage = () => {
    return {
        getItem(_key: string) {
            return Promise.resolve(null)
        },
        setItem(_key: string, value: any) {
            return Promise.resolve(value)
        },
        removeItem(_key: string) {
            return Promise.resolve()
        },
    }
}

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage()

// Persist configuration
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['user','school','ui'], 
}

// Combine all reducers
const rootReducer = combineReducers({
    user: userReducer,
    school: schoolReducer,
    ui: uiReducer,
    [baseApi.reducerPath]: baseApi.reducer,


    
})

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

const storeConfig = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        })
            .concat(baseApi.middleware)
            //api middleware
            
})

export const persistor = persistStore(storeConfig)
export type RootState    = ReturnType<typeof rootReducer>
export type AppDispatch  = typeof storeConfig.dispatch
export default storeConfig