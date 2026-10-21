import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Order, Deal, Client, Interaction, CompanySettings, CrmNotification, SupplierSource, SupplierProduct } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { INITIAL_DEALS, INITIAL_CLIENTS, INITIAL_ORDERS, INITIAL_INTERACTIONS, INITIAL_NOTIFICATIONS } from '../data/crmMockData';
import { DEFAULT_COMPANY_SETTINGS } from '../data/defaultSettings';
import { INITIAL_SUPPLIER_SOURCES, INITIAL_SUPPLIER_PRODUCTS } from '../data/supplierMockData';
import { resolveProductImage } from '../utils/imageUtils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initial seeder if Firestore is empty
export async function seedInitialDataIfEmpty(): Promise<void> {
  // Products
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      console.log('Seeding initial products into Firestore...');
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'products');
  }

  // Clients
  try {
    const clientsSnap = await getDocs(collection(db, 'clients'));
    if (clientsSnap.empty) {
      console.log('Seeding initial clients into Firestore...');
      for (const client of INITIAL_CLIENTS) {
        await setDoc(doc(db, 'clients', client.id), client);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'clients');
  }

  // Deals
  try {
    const dealsSnap = await getDocs(collection(db, 'deals'));
    if (dealsSnap.empty) {
      console.log('Seeding initial deals into Firestore...');
      for (const deal of INITIAL_DEALS) {
        await setDoc(doc(db, 'deals', deal.id), deal);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'deals');
  }

  // Orders
  try {
    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (ordersSnap.empty) {
      console.log('Seeding initial orders into Firestore...');
      for (const order of INITIAL_ORDERS) {
        await setDoc(doc(db, 'orders', order.id), order);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'orders');
  }

  // Interactions
  try {
    const interactionsSnap = await getDocs(collection(db, 'interactions'));
    if (interactionsSnap.empty) {
      console.log('Seeding initial interactions into Firestore...');
      for (const inter of INITIAL_INTERACTIONS) {
        await setDoc(doc(db, 'interactions', inter.id), inter);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'interactions');
  }

  // Settings
  try {
    const settingsSnap = await getDocs(collection(db, 'settings'));
    if (settingsSnap.empty) {
      console.log('Seeding company settings into Firestore...');
      await setDoc(doc(db, 'settings', 'company'), DEFAULT_COMPANY_SETTINGS);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings');
  }

  // Notifications
  try {
    const notifsSnap = await getDocs(collection(db, 'notifications'));
    if (notifsSnap.empty) {
      console.log('Seeding initial notifications into Firestore...');
      for (const notif of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, 'notifications', notif.id), notif);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'notifications');
  }

  // Suppliers
  try {
    const suppliersSnap = await getDocs(collection(db, 'suppliers'));
    if (suppliersSnap.empty) {
      console.log('Seeding initial suppliers into Firestore...');
      for (const supp of INITIAL_SUPPLIER_SOURCES) {
        await setDoc(doc(db, 'suppliers', supp.id), supp);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'suppliers');
  }

  // Supplier Products
  try {
    const suppProdsSnap = await getDocs(collection(db, 'supplier_products'));
    if (suppProdsSnap.empty) {
      console.log('Seeding initial supplier products into Firestore...');
      for (const sp of INITIAL_SUPPLIER_PRODUCTS) {
        await setDoc(doc(db, 'supplier_products', sp.id), sp);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'supplier_products');
  }
}

// Real-time listener subscriptions
export function subscribeToProducts(callback: (products: Product[]) => void) {
  return onSnapshot(
    collection(db, 'products'),
    (snap) => {
      const prods: Product[] = [];
      snap.forEach((d) => {
        const p = d.data() as Product;
        prods.push({
          ...p,
          image: resolveProductImage(p.image, p.category)
        });
      });
      callback(prods.length > 0 ? prods : INITIAL_PRODUCTS);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
    }
  );
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  return onSnapshot(
    collection(db, 'orders'),
    (snap) => {
      const ordersList: Order[] = [];
      snap.forEach((d) => {
        const order = d.data() as Order;
        const normalizedItems = (order.items || []).map((it) => ({
          ...it,
          product: {
            ...it.product,
            image: resolveProductImage(it.product.image, it.product.category)
          }
        }));
        ordersList.push({
          ...order,
          items: normalizedItems
        });
      });
      // Sort newest first
      ordersList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(ordersList.length > 0 ? ordersList : INITIAL_ORDERS);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    }
  );
}

export function subscribeToDeals(callback: (deals: Deal[]) => void) {
  return onSnapshot(
    collection(db, 'deals'),
    (snap) => {
      const dealsList: Deal[] = [];
      snap.forEach((d) => dealsList.push(d.data() as Deal));
      dealsList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      callback(dealsList.length > 0 ? dealsList : INITIAL_DEALS);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'deals');
    }
  );
}

export function subscribeToClients(callback: (clients: Client[]) => void) {
  return onSnapshot(
    collection(db, 'clients'),
    (snap) => {
      const clientsList: Client[] = [];
      snap.forEach((d) => clientsList.push(d.data() as Client));
      callback(clientsList.length > 0 ? clientsList : INITIAL_CLIENTS);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'clients');
    }
  );
}

export function subscribeToInteractions(callback: (interactions: Interaction[]) => void) {
  return onSnapshot(
    collection(db, 'interactions'),
    (snap) => {
      const list: Interaction[] = [];
      snap.forEach((d) => list.push(d.data() as Interaction));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(list.length > 0 ? list : INITIAL_INTERACTIONS);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'interactions');
    }
  );
}

// Database Mutators
export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${order.id}`);
    throw error;
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: Order['status']): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    throw error;
  }
}

export async function saveDealToFirestore(deal: Deal): Promise<void> {
  try {
    await setDoc(doc(db, 'deals', deal.id), deal);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `deals/${deal.id}`);
    throw error;
  }
}

export async function updateDealStageInFirestore(dealId: string, stage: Deal['stage']): Promise<void> {
  try {
    await updateDoc(doc(db, 'deals', dealId), { 
      stage, 
      updatedAt: new Date().toISOString().split('T')[0] 
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `deals/${dealId}`);
    throw error;
  }
}

export async function deleteDealFromFirestore(dealId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'deals', dealId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `deals/${dealId}`);
    throw error;
  }
}

export async function saveClientToFirestore(client: Client): Promise<void> {
  try {
    await setDoc(doc(db, 'clients', client.id), client);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `clients/${client.id}`);
    throw error;
  }
}

export async function saveInteractionToFirestore(interaction: Interaction): Promise<void> {
  try {
    await setDoc(doc(db, 'interactions', interaction.id), interaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `interactions/${interaction.id}`);
    throw error;
  }
}

export function subscribeToSettings(callback: (settings: CompanySettings) => void) {
  return onSnapshot(
    doc(db, 'settings', 'company'),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as CompanySettings);
      } else {
        callback(DEFAULT_COMPANY_SETTINGS);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/company');
    }
  );
}

export async function saveSettingsToFirestore(settings: CompanySettings): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'company'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/company');
    throw error;
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
    throw error;
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    throw error;
  }
}

// Notifications Sync
export function subscribeToNotifications(callback: (notifications: CrmNotification[]) => void) {
  return onSnapshot(
    collection(db, 'notifications'),
    (snap) => {
      const notifs: CrmNotification[] = [];
      snap.forEach((docSnap) => {
        notifs.push(docSnap.data() as CrmNotification);
      });
      // Sort newest first
      notifs.sort((a, b) => (b.id > a.id ? 1 : -1));
      callback(notifs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    }
  );
}

export async function saveNotificationToFirestore(notification: CrmNotification): Promise<void> {
  try {
    await setDoc(doc(db, 'notifications', notification.id), notification);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notifications/${notification.id}`);
    throw error;
  }
}

export async function updateNotificationInFirestore(notificationId: string, updates: Partial<CrmNotification>): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
    throw error;
  }
}

export async function deleteNotificationFromFirestore(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${notificationId}`);
    throw error;
  }
}

// ==========================================
// SUPPLIERS & DROPSHIPPING REALTIME SYNC
// ==========================================

export function subscribeToSuppliers(callback: (suppliers: SupplierSource[]) => void) {
  return onSnapshot(
    collection(db, 'suppliers'),
    (snap) => {
      const list: SupplierSource[] = [];
      snap.forEach((d) => list.push(d.data() as SupplierSource));
      callback(list.length > 0 ? list : INITIAL_SUPPLIER_SOURCES);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'suppliers');
    }
  );
}

export async function saveSupplierToFirestore(supplier: SupplierSource): Promise<void> {
  try {
    await setDoc(doc(db, 'suppliers', supplier.id), supplier);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `suppliers/${supplier.id}`);
    throw error;
  }
}

export async function deleteSupplierFromFirestore(supplierId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'suppliers', supplierId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `suppliers/${supplierId}`);
    throw error;
  }
}

export function subscribeToSupplierProducts(callback: (prods: SupplierProduct[]) => void) {
  return onSnapshot(
    collection(db, 'supplier_products'),
    (snap) => {
      const list: SupplierProduct[] = [];
      snap.forEach((d) => {
        const item = d.data() as SupplierProduct;
        list.push({
          ...item,
          image: resolveProductImage(item.image, item.category)
        });
      });
      callback(list.length > 0 ? list : INITIAL_SUPPLIER_PRODUCTS);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'supplier_products');
    }
  );
}

export async function saveSupplierProductToFirestore(prod: SupplierProduct): Promise<void> {
  try {
    await setDoc(doc(db, 'supplier_products', prod.id), prod);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `supplier_products/${prod.id}`);
    throw error;
  }
}

export async function batchSaveSupplierProductsToFirestore(prods: SupplierProduct[]): Promise<void> {
  for (const p of prods) {
    await saveSupplierProductToFirestore(p).catch((err) => {
      console.error(`Failed to sync product ${p.id} to Firestore`, err);
    });
  }
}

export async function deleteSupplierProductFromFirestore(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'supplier_products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `supplier_products/${productId}`);
    throw error;
  }
}




