/**
 * CartContext — global cart state for both Fertilizer Center and Marketplace.
 *
 * Two separate carts:
 *   - fertCart  : fertilizer products (/farmer/fertilizer)
 *   - cropCart  : crop listings       (/customer/marketplace)
 *
 * Also exposes fertCartOpen / cropCartOpen so the top-bar icons can open
 * the drawers from any page without prop drilling.
 *
 * Both carts are persisted to localStorage.
 */
import { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const exists = state.find(i => i.id === action.item.id);
      if (exists) {
        return state.map(i =>
          i.id === action.item.id
            ? { ...i, quantity: i.quantity + (action.item.quantity ?? 1) }
            : i
        );
      }
      return [...state, { ...action.item, quantity: action.item.quantity ?? 1 }];
    }
    case 'REMOVE':
      return state.filter(i => i.id !== action.id);
    case 'UPDATE_QTY':
      return state.map(i =>
        i.id === action.id ? { ...i, quantity: Math.max(1, action.qty) } : i
      );
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [fertCart, dispatchFert] = useReducer(cartReducer, undefined, () => load('cropx_fert_cart', []));
  const [cropCart, dispatchCrop] = useReducer(cartReducer, undefined, () => load('cropx_crop_cart', []));

  // Global drawer-open flags — top-bar icons use these
  const [fertCartOpen, setFertCartOpen] = useState(false);
  const [cropCartOpen, setCropCartOpen] = useState(false);

  useEffect(() => { localStorage.setItem('cropx_fert_cart', JSON.stringify(fertCart)); }, [fertCart]);
  useEffect(() => { localStorage.setItem('cropx_crop_cart', JSON.stringify(cropCart)); }, [cropCart]);

  const addFert    = useCallback(item      => dispatchFert({ type: 'ADD',        item }), []);
  const removeFert = useCallback(id        => dispatchFert({ type: 'REMOVE',     id   }), []);
  const updateFert = useCallback((id, qty) => dispatchFert({ type: 'UPDATE_QTY', id, qty }), []);
  const clearFert  = useCallback(()        => dispatchFert({ type: 'CLEAR'             }), []);

  const addCrop    = useCallback(item      => dispatchCrop({ type: 'ADD',        item }), []);
  const removeCrop = useCallback(id        => dispatchCrop({ type: 'REMOVE',     id   }), []);
  const updateCrop = useCallback((id, qty) => dispatchCrop({ type: 'UPDATE_QTY', id, qty }), []);
  const clearCrop  = useCallback(()        => dispatchCrop({ type: 'CLEAR'             }), []);

  const fertTotal = fertCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cropTotal = cropCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const fertCount = fertCart.reduce((s, i) => s + i.quantity, 0);
  const cropCount = cropCart.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      fertCart, addFert, removeFert, updateFert, clearFert, fertTotal, fertCount,
      cropCart, addCrop, removeCrop, updateCrop, clearCrop, cropTotal, cropCount,
      fertCartOpen, setFertCartOpen,
      cropCartOpen, setCropCartOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};
